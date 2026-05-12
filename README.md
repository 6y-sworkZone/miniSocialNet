# Mini Social Network

一个使用 React + FastAPI + SQLite 构建的小型社交平台。

## 功能特性

- 用户注册和登录
- 发布帖子
- 评论功能（用户只能删除自己的评论）
- 点赞功能（点赞后按钮短暂禁用，防止重复点击）
- 帖子搜索
- 按时间或热度排序
- 发布新帖子后自动滚动到顶部

## 技术栈

### 后端
- FastAPI
- SQLite
- SQLAlchemy (ORM)
- Pydantic (数据验证)
- Python-jose (JWT)
- Passlib (密码加密)

### 前端
- React 18
- React Router (路由)
- Axios (HTTP 客户端)

## 项目结构

```
miniSocialNet/
├── backend/
│   ├── main.py          # FastAPI 主应用和 API 路由
│   ├── database.py      # 数据库连接配置
│   ├── models.py        # SQLAlchemy 数据模型
│   ├── schemas.py       # Pydantic 数据验证模型
│   ├── auth.py          # 认证相关功能
│   └── requirements.txt # Python 依赖
└── frontend/
    ├── package.json     # Node.js 依赖
    ├── public/
    │   └── index.html   # HTML 入口文件
    └── src/
        ├── index.js     # React 入口
        ├── App.js       # 主应用组件
        ├── api.js       # API 调用封装
        ├── contexts/
        │   └── AuthContext.js  # 认证状态管理
        └── components/
            ├── Login.js       # 登录组件
            ├── Register.js    # 注册组件
            └── Home.js        # 主页组件
```

## 安装和运行

### 后端启动

1. 进入后端目录：
```bash
cd backend
```

2. 创建虚拟环境并激活（推荐）：
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

4. 启动后端服务器：
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端将在 http://localhost:8000 启动

API 文档：http://localhost:8000/docs

### 前端启动

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

前端将在 http://localhost:3000 启动

## 使用说明

1. 访问 http://localhost:3000
2. 点击"注册"创建新账号
3. 使用注册的账号登录
4. 在主页可以：
   - 发布新帖子
   - 搜索帖子内容
   - 按时间或热度排序
   - 点赞帖子
   - 发表评论
   - 删除自己的评论

## API 端点

### 认证
- `POST /users/` - 用户注册
- `POST /token` - 获取访问令牌
- `GET /users/me/` - 获取当前用户信息

### 帖子
- `GET /posts/` - 获取帖子列表（支持 search 和 sort_by 参数）
- `POST /posts/` - 创建新帖子
- `POST /posts/{post_id}/like/` - 点赞/取消点赞帖子

### 评论
- `POST /posts/{post_id}/comments/` - 创建评论
- `DELETE /comments/{comment_id}` - 删除评论
- `GET /posts/{post_id}/comments/` - 获取帖子的评论列表

## 数据库

首次运行时，SQLite 数据库文件 `socialnet.db` 会自动创建在 backend 目录下。
