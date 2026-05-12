import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, getCurrentUser } from '../api';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(username, password);
      const { access_token } = response.data;
      const userResponse = await getCurrentUser();
      authLogin(access_token, userResponse.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || '登录失败');
    }
  };

  return (
    <div className="auth-container">
      <h2>登录</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn">登录</button>
      </form>
      <div className="auth-link">
        还没有账号？ <Link to="/register">注册</Link>
      </div>
    </div>
  );
};

export default Login;
