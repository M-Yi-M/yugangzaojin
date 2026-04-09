# 鱼缸造景展示网站

一个用于展示和管理水族造景作品的 Web 应用，专为鱼缸造景爱好者设计。

## ✨ 功能特点

- 📸 **瀑布流画廊** - 优雅的图片展示布局
- 🔍 **智能筛选** - 按尺寸分类、具体规格、状态筛选
- 📏 **精确尺寸** - 支持长度和宽度的详细标注
- 💰 **价格管理** - 可选的价格显示
- 🎨 **深海主题** - 沉稳专业的深蓝色系设计
- ⚙️ **管理后台** - 简洁的上传和管理界面
- 🏷️ **状态标记** - 在售/已售状态管理
- 📱 **响应式设计** - 支持移动端访问

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/M-Yi-M/yugangzaojin.git
cd yugangzaojin
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化数据库

```bash
npm run init-db
```

### 4. 启动服务器

```bash
npm start
```

或使用开发模式（自动重启）：

```bash
npm run dev
```

### 5. 访问网站

- 🌐 前台展示：http://localhost:3000
- ⚙️ 管理后台：http://localhost:3000/admin.html

## 📁 项目结构

```
yugangzaojin/
├── server.js              # Express 后端服务器
├── package.json           # 项目配置和依赖
├── database.sqlite        # SQLite 数据库（自动生成）
├── CLAUDE.md             # 项目开发指导文档
├── scripts/
│   └── init-db.js        # 数据库初始化脚本
├── public/               # 前端静态文件
│   ├── index.html        # 前台展示页面
│   ├── admin.html        # 管理后台页面
│   ├── css/
│   │   └── style.css     # 深海主题样式
│   └── js/
│       └── main.js       # 前台交互逻辑
└── uploads/              # 图片存储目录
    └── images/           # 上传的图片文件
```

## 🎯 使用说明

### 管理后台上传作品

1. 访问 http://localhost:3000/admin.html
2. 填写表单：
   - **尺寸分类**：小型缸/中型缸/大型缸
   - **具体长度**：根据分类选择（如 60-70cm）
   - **宽度**：选择 20-60cm 或范围（如 30-40cm）
   - **价格**：可选填写
   - **图片**：上传造景照片
3. 点击"上传作品"

### 前台筛选查看

1. 访问 http://localhost:3000
2. 使用筛选按钮：
   - 点击尺寸分类（小/中/大型缸）
   - 显示该分类下的具体尺寸选项
   - 按在售/已售状态筛选
3. 点击图片查看详细信息

## 🗄️ 数据库结构

```sql
CREATE TABLE aquariums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  size TEXT CHECK(size IN ('small', 'medium', 'large')),
  size_detail TEXT CHECK(size_detail IN ('40-50', '60-70', '80-90', '100', '120', '150-200')),
  width TEXT CHECK(width IN ('20', '20-30', '30', '30-40', '40', '40-50', '50', '50-60', '60')),
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

### 尺寸分类说明

- **小型缸 (small)**: 40-50cm, 60-70cm
- **中型缸 (medium)**: 80-90cm, 100cm, 120cm
- **大型缸 (large)**: 150-200cm
- **宽度选项**: 20, 20-30, 30, 30-40, 40, 40-50, 50, 50-60, 60 (单位: cm)

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (sql.js) - 内存数据库，持久化到文件
- **前端**: 原生 HTML/CSS/JavaScript
- **文件上传**: Multer
- **跨域支持**: CORS

## 📝 API 接口

### 获取所有作品
```http
GET /api/aquariums?size=small&size_detail=60-70&status=available
```

### 获取单个作品
```http
GET /api/aquariums/:id
```

### 上传作品
```http
POST /api/aquariums
Content-Type: multipart/form-data
```

### 标记已售/在售
```http
PATCH /api/aquariums/:id/sold
PATCH /api/aquariums/:id/available
```

### 删除作品
```http
DELETE /api/aquariums/:id
```

### 获取统计信息
```http
GET /api/stats
```

## ⚠️ 注意事项

- 图片大小限制：10MB
- 支持格式：jpeg, jpg, png, gif, webp
- 使用 sql.js，写操作后必须调用 `saveDatabase()`
- 管理后台无身份验证，生产环境需添加
- 数据库结构变更后需运行 `npm run init-db`

## 🔧 常见问题

### 数据库结构变更后如何更新？

```bash
rm database.sqlite
npm run init-db
# 重启服务器
```

### 如何重启服务器？

```bash
# Windows
taskkill /F /PID <进程ID>
node server.js

# 或使用开发模式自动重启
npm run dev
```

## 📄 开源协议

MIT License

## 👨‍💻 作者

M-Yi-M

## 🔗 相关链接

- GitHub: https://github.com/M-Yi-M/yugangzaojin
