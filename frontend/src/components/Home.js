import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPosts, createPost, createComment, deleteComment, likePost, getCurrentUser } from '../api';

const formatTime = (timeStr) => {
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [commentInputs, setCommentInputs] = useState({});
  const [likingPosts, setLikingPosts] = useState(new Set());
  const postsContainerRef = useRef(null);
  const { user, logout } = useAuth();

  const fetchPosts = async () => {
    try {
      const response = await getPosts(search, sortBy);
      setPosts(response.data);
    } catch (err) {
      console.error('获取帖子失败:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, sortBy]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    
    try {
      await createPost(newTitle, newContent);
      setNewTitle('');
      setNewContent('');
      await fetchPosts();
      
      if (postsContainerRef.current) {
        postsContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error('创建帖子失败:', err);
    }
  };

  const handleLike = async (postId) => {
    if (likingPosts.has(postId)) return;
    
    setLikingPosts(prev => new Set(prev).add(postId));
    
    try {
      const response = await likePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, likes_count: response.data.likes_count, is_liked: response.data.is_liked } : post
      ));
    } catch (err) {
      console.error('点赞失败:', err);
    } finally {
      setTimeout(() => {
        setLikingPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }, 1000);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    
    try {
      const response = await createComment(postId, content);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), response.data] }
          : post
      ));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('评论失败:', err);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    try {
      await deleteComment(commentId);
      setPosts(prev => prev.map(post => 
        post.id === postId
          ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
          : post
      ));
    } catch (err) {
      console.error('删除评论失败:', err);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Mini Social Network</h1>
        <div className="user-info">
          <span>欢迎, {user?.username}</span>
          <button className="btn btn-small btn-secondary" onClick={logout}>
            退出
          </button>
        </div>
      </div>

      <div className="create-post">
        <h3>发布新帖子</h3>
        <form onSubmit={handleCreatePost}>
          <div className="form-group">
            <input
              type="text"
              placeholder="标题"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="内容"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">发布</button>
        </form>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索帖子..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">按时间排序</option>
          <option value="hot">按热度排序</option>
        </select>
      </div>

      <div className="posts-container" ref={postsContainerRef}>
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <span className="post-author">{post.author.username}</span>
              <span className="post-time">{formatTime(post.created_at)}</span>
            </div>
            <div className="post-title">{post.title}</div>
            <div className="post-content">{post.content}</div>
            <div className="post-actions">
              <button
                className={`like-btn ${post.is_liked ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
                disabled={likingPosts.has(post.id)}
              >
                ❤️ {post.likes_count || 0}
              </button>
            </div>

            <div className="comments-section">
              <div className="comment-form">
                <input
                  type="text"
                  placeholder="写评论..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                />
                <button
                  className="btn btn-small"
                  onClick={() => handleCommentSubmit(post.id)}
                >
                  评论
                </button>
              </div>

              {post.comments && post.comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author.username}</span>
                    <span className="comment-time">{formatTime(comment.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="comment-content">{comment.content}</span>
                    {comment.author.id === user?.id && (
                      <button
                        className="comment-delete"
                        onClick={() => handleDeleteComment(comment.id, post.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
