from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class Comment(CommentBase):
    id: int
    author_id: int
    post_id: int
    created_at: datetime
    author: User

    class Config:
        orm_mode = True


class LikeBase(BaseModel):
    post_id: int


class Like(LikeBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


class PostBase(BaseModel):
    title: str
    content: str


class PostCreate(PostBase):
    pass


class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    author: User
    comments: List[Comment] = []
    likes_count: int = 0
    is_liked: bool = False

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
