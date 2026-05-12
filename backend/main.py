from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from datetime import timedelta
from typing import List, Optional

from database import engine, get_db, Base
import models
import schemas
from auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini Social Network")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/posts/", response_model=schemas.Post)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_post = models.Post(
        title=post.title,
        content=post.content,
        author_id=current_user.id
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@app.get("/posts/", response_model=List[schemas.Post])
def read_posts(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Post)
    
    if search:
        query = query.filter(
            or_(
                models.Post.title.contains(search),
                models.Post.content.contains(search)
            )
        )
    
    if sort_by == "hot":
        query = query.outerjoin(models.Like).group_by(models.Post.id).order_by(
            desc(func.count(models.Like.id)),
            desc(models.Post.created_at)
        )
    else:
        query = query.order_by(desc(models.Post.created_at))
    
    posts = query.offset(skip).limit(limit).all()
    
    for post in posts:
        post.likes_count = db.query(models.Like).filter(models.Like.post_id == post.id).count()
        post.is_liked = db.query(models.Like).filter(
            models.Like.post_id == post.id,
            models.Like.user_id == current_user.id
        ).first() is not None
    
    return posts


@app.get("/posts/{post_id}", response_model=schemas.Post)
def read_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post.likes_count = db.query(models.Like).filter(models.Like.post_id == post_id).count()
    post.is_liked = db.query(models.Like).filter(
        models.Like.post_id == post_id,
        models.Like.user_id == current_user.id
    ).first() is not None
    
    return post


@app.post("/posts/{post_id}/comments/", response_model=schemas.Comment)
def create_comment(
    post_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db_comment = models.Comment(
        content=comment.content,
        author_id=current_user.id,
        post_id=post_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@app.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    db.delete(comment)
    db.commit()
    return None


@app.post("/posts/{post_id}/like/", response_model=schemas.Post)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id,
        models.Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
    else:
        db_like = models.Like(post_id=post_id, user_id=current_user.id)
        db.add(db_like)
    
    db.commit()
    db.refresh(post)
    
    post.likes_count = db.query(models.Like).filter(models.Like.post_id == post_id).count()
    post.is_liked = existing_like is None
    
    return post


@app.get("/posts/{post_id}/comments/", response_model=List[schemas.Comment])
def read_comments(
    post_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    comments = db.query(models.Comment).filter(
        models.Comment.post_id == post_id
    ).order_by(models.Comment.created_at).offset(skip).limit(limit).all()
    return comments
