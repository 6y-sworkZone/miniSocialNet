import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (username, email, password) => {
  return api.post('/users/', { username, email, password });
};

export const login = (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/token', formData);
};

export const getCurrentUser = () => {
  return api.get('/users/me/');
};

export const getPosts = (search = '', sortBy = 'created_at') => {
  return api.get('/posts/', { params: { search, sort_by: sortBy } });
};

export const createPost = (title, content) => {
  return api.post('/posts/', { title, content });
};

export const createComment = (postId, content) => {
  return api.post(`/posts/${postId}/comments/`, { content });
};

export const deleteComment = (commentId) => {
  return api.delete(`/comments/${commentId}`);
};

export const likePost = (postId) => {
  return api.post(`/posts/${postId}/like/`);
};

export default api;
