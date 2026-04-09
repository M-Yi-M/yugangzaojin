# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供项目开发指导。

## 项目概述

鱼缸造景展示网站 - 用于展示和管理水族造景作品的 Web 应用，包含图片画廊、筛选功能和管理后台。

**目标用户**: 30-40岁喜欢养鱼的男性用户

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (sql.js) - 内存数据库，持久化到文件
- **前端**: 原生 HTML/CSS/JavaScript
- **文件上传**: Multer

## 开发命令

```bash
# 安装依赖
npm install

# 初始化数据库（修改数据库结构后必须运行）
npm run init-db

# 启动服务器
npm start
```

服务器运行在 http://localhost:3000
- 前台展示: http://localhost:3000
- 管理后台: http://localhost:3000/admin.html

## 架构说明

### 后端 (server.js)
- Express 服务器提供 REST API 接口
- **sql.js**（注意不是 better-sqlite3）- JavaScript 实现的 SQLite
- Multer 处理文件上传到 `uploads/images/`
- 文件大小限制: 10MB，格式: jpeg/jpg/png/gif/webp
- **重要**: 任何写操作后必须调用 `saveDatabase()`

### 数据库 (database.sqlite)
**表结构** - `aquariums` 表:
```sql
CREATE TABLE aquariums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  size TEXT CHECK(size IN ('small', 'medium', 'large')),
  size_detail TEXT CHECK(size_detail IN ('40-50', '60-70', '70', '80-90', '100', '120', '150', '180-200')),
  width TEXT CHECK(width IN ('20', '20-30', '30', '30-40', '40', '40-50', '50', '50-60', '60')),
  bottom_sand TEXT CHECK(bottom_sand IN ('8', '10', '12', '15', '20', '30', '40', '50', '60', '75', '100')),
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

**尺寸分类**:
- `small` (小型缸): 40-50cm, 60-70cm, 70cm
- `medium` (中型缸): 80-90cm, 100cm, 120cm
- `large` (大型缸): 150cm, 180-200cm

### 前端设计
- **主题**: 深海水族风格 - 深蓝渐变背景，水波纹效果
- **配色**: 深蓝色系 (#0a1929, #1a3a52, #2d5f7a)，青色点缀 (#3498db, #7dd3fc)
- **风格**: 沉稳、专业、有质感，适合30-40岁男性审美
- `public/index.html` - 瀑布流画廊布局（CSS columns）
- `public/admin.html` - 简化的上传界面
- `public/js/main.js` - 二级尺寸筛选功能
- `public/css/style.css` - 深海主题渐变背景

## 关键代码模式

### 数据库操作 (sql.js)
```javascript
// 查询数据
const stmt = db.prepare('SELECT * FROM aquariums WHERE id = ?', [id]);
const rows = [];
while (stmt.step()) {
  rows.push(stmt.getAsObject());
}
stmt.free();

// 插入/更新 - 必须保存
db.run('INSERT INTO aquariums (...) VALUES (...)', [params]);
saveDatabase(); // 关键！不调用会丢失数据
```

### 图片上传流程
1. Multer 保存文件到 `uploads/images/`，文件名带时间戳
2. 路径以 `/uploads/images/filename.jpg` 格式存入数据库
3. Express 将 `/uploads` 设为静态目录

### API 筛选功能
查询参数: `size`, `size_detail`, `status`, `search`
- 二级筛选: 先选尺寸分类 → 再选具体尺寸
- 前端仅在选择尺寸分类后才显示具体尺寸按钮

### 环境变量配置
密码等敏感配置通过 `.env` 文件管理（已添加到 `.gitignore`）：
```bash
# .env 文件内容
ADMIN_PASSWORD=your_strong_password_here
PORT=3000
```

**首次部署必须设置**：
1. 复制 `.env.example` 为 `.env`
2. 修改 `ADMIN_PASSWORD` 为强密码
3. 运行 `npm start`

## 常见问题与解决方案

### 数据库结构变更
**问题**: 修改 `scripts/init-db.js` 后，旧的 database.sqlite 仍使用旧结构
**解决方案**: 
```bash
rm database.sqlite
npm run init-db
# 然后重启服务器
```

### 服务器重启
**何时需要**: 数据库结构变更或 server.js 修改后
**如何操作**:
```bash
# 关闭旧进程
taskkill //F //PID <进程ID>
# 启动新进程
node server.js
```

### 尺寸细分筛选不生效
**原因**: 前端发送 `size_detail` 参数但后端未筛选
**修复**: 确保 server.js 的 API 接口同时检查 `size` 和 `size_detail` 参数

## 重要注意事项

- **sql.js** 需要在写操作后显式调用 `saveDatabase()` - 否则数据会丢失
- 数据库在启动时从 `database.sqlite` 文件加载到内存
- 删除数据库记录时，图片文件不会从文件系统删除
- 管理后台没有身份验证 - 生产环境部署前需要添加
- 前端显示极简: 仅显示尺寸和价格（无标题/描述/标签）
- 具体尺寸下拉选项根据选择的尺寸分类动态生成
