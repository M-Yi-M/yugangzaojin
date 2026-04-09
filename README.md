# 鱼缸造景展示网站

一个用于展示和管理鱼缸造景作品的 Web 应用。

## 功能特点

- 📸 瀑布流布局展示造景图片
- 🔍 按尺寸、状态筛选和搜索
- 💾 SQLite 数据库存储
- 🎨 响应式设计，支持移动端
- ⚙️ 管理后台：上传、编辑、删除作品
- 🏷️ 标记在售/已售状态

## 快速开始

### 1. 安装依赖

```bash
cd E:\imgShowWeb
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 启动服务器

```bash
npm start
```

或使用开发模式（自动重启）：

```bash
npm run dev
```

### 4. 访问网站

- 前台展示页面：http://localhost:3000
- 管理后台：http://localhost:3000/admin.html

## 项目结构

```
imgShowWeb/
├── server.js              # 后端服务器
├── package.json           # 项目配置
├── database.sqlite        # SQLite 数据库（运行后自动生成）
├── scripts/
│   └── init-db.js        # 数据库初始化脚本
├── public/               # 前端静态文件
│   ├── index.html        # 前台展示页面
│   ├── admin.html        # 管理后台
│   ├── css/
│   │   └── style.css     # 样式文件
│   └── js/
│       └── main.js       # 前台 JS
└── uploads/              # 图片存储目录
    ├── images/           # 原图
    └── thumbnails/       # 缩略图（预留）
```

## API 接口

### 获取所有作品
```
GET /api/aquariums?size=small&status=available&search=关键词
```

### 获取单个作品
```
GET /api/aquariums/:id
```

### 上传作品
```
POST /api/aquariums
Content-Type: multipart/form-data
```

### 更新作品
```
PUT /api/aquariums/:id
```

### 标记已售
```
PATCH /api/aquariums/:id/sold
```

### 标记在售
```
PATCH /api/aquariums/:id/available
```

### 删除作品
```
DELETE /api/aquariums/:id
```

### 获取统计
```
GET /api/stats
```

## 数据库结构

```sql
CREATE TABLE aquariums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    size TEXT CHECK(size IN ('small', 'medium', 'large')),
    dimensions TEXT,
    style TEXT,
    image_path TEXT NOT NULL,
    thumbnail_path TEXT,
    description TEXT,
    status TEXT CHECK(status IN ('available', 'sold')) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sold_at DATETIME,
    price REAL,
    tags TEXT
);
```

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (sql.js)
- **前端**: 原生 HTML + CSS + JavaScript
- **文件上传**: Multer

## 🚀 一键部署到 Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/7Xf7X5?referralCode=openclaw)

### 部署步骤：
1. 点击上方 "Deploy on Railway" 按钮
2. 使用 GitHub 账号登录 Railway
3. 选择仓库（或创建新仓库）
4. Railway 会自动部署你的应用
5. 部署完成后，访问生成的 `xxx.railway.app` 域名

### 环境变量配置（Railway 会自动设置）：
- `PORT`: 服务器端口（默认 3000）
- `NODE_ENV`: 环境（production）
- `DATABASE_PATH`: 数据库文件路径

## 注意事项

- 图片大小限制：10MB
- 支持格式：jpeg, jpg, png, gif, webp
- 数据库文件会在项目根目录自动生成
- 上传的图片保存在 `uploads/images/` 目录
- **云部署注意**: Railway 的文件系统是临时的，重启后上传的图片会丢失。建议：
  - 使用外部云存储（如 AWS S3、Cloudinary）
  - 或定期备份重要数据

## 后续优化建议

- [ ] 添加图片压缩和缩略图生成
- [ ] 添加用户认证（管理后台登录）
- [ ] 支持批量上传
- [ ] 添加图片编辑功能
- [ ] 数据导出功能
- [ ] 迁移到外部数据库（生产环境）
- [ ] 集成云存储服务（避免文件丢失）
