const express = require('express');
const multer = require('multer');
const path = require('path');
const initSqlJs = require('sql.js');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // 默认密码，生产环境请设置环境变量

// 简单的 token 存储（生产环境请使用 Redis 或数据库）
const validTokens = new Set();

let db;

// 初始化数据库
async function initDatabase() {
    const SQL = await initSqlJs();
    const dbPath = process.env.DATABASE_PATH || 'database.sqlite';

    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
        console.log('⚠️  数据库文件不存在，请先运行: npm run init-db');
    }
}

// 保存数据库到文件
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dbPath = process.env.DATABASE_PATH || 'database.sqlite';
    fs.writeFileSync(dbPath, buffer);
}

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 图片上传配置
const storage = multer.diskStorage({
    destination: 'uploads/images/',
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只支持图片格式 (jpeg, jpg, png, gif, webp)'));
    }
});

// API 路由

// 登录验证中间件
function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];
    if (!token || !validTokens.has(token)) {
        return res.status(401).json({ error: '未授权，请先登录' });
    }
    next();
}

// 登录接口
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        validTokens.add(token);
        res.json({ token });
    } else {
        res.status(401).json({ error: '密码错误' });
    }
});

// 登出接口
app.post('/api/admin/logout', (req, res) => {
    const token = req.headers['authorization'];
    if (token) {
        validTokens.delete(token);
    }
    res.json({ message: '已登出' });
});

// 验证 token 接口
app.get('/api/admin/verify', (req, res) => {
    const token = req.headers['authorization'];
    if (token && validTokens.has(token)) {
        res.json({ valid: true });
    } else {
        res.status(401).json({ valid: false });
    }
});

// 获取所有造景（支持筛选）
app.get('/api/aquariums', (req, res) => {
    try {
        const { size, size_detail, status, search, limit = 100, offset = 0 } = req.query;

        let query = 'SELECT * FROM aquariums WHERE 1=1';
        const params = [];

        if (size && size !== 'all') {
            query += ' AND size = ?';
            params.push(size);
        }
        if (size_detail && size_detail !== 'all') {
            query += ' AND size_detail = ?';
            params.push(size_detail);
        }
        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }
        if (search) {
            query += ' AND (title LIKE ? OR tags LIKE ? OR description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const stmt = db.prepare(query, params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取单个造景详情
app.get('/api/aquariums/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM aquariums WHERE id = ?', [req.params.id]);
        let row = null;
        if (stmt.step()) {
            row = stmt.getAsObject();
        }
        stmt.free();

        if (!row) {
            return res.status(404).json({ error: '未找到该造景' });
        }

        res.json(row);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 上传新造景（需要认证）
app.post('/api/aquariums', authMiddleware, upload.single('image'), (req, res) => {
    try {
        const { size, size_detail, width, bottom_sand, price } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: '请上传图片' });
        }

        const image_path = '/uploads/images/' + req.file.filename;
        const title = width ? `${size_detail}×${width}cm 鱼缸造景` : `${size_detail}cm 鱼缸造景`;

        db.run(`
            INSERT INTO aquariums (title, size, size_detail, width, bottom_sand, image_path, price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, size, size_detail, width || null, bottom_sand || null, image_path, price || null]);

        saveDatabase();

        const stmt = db.prepare('SELECT last_insert_rowid() as id');
        stmt.step();
        const result = stmt.getAsObject();
        stmt.free();

        res.json({
            id: result.id,
            message: '上传成功',
            image_path
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 更新造景信息（需要认证）
app.put('/api/aquariums/:id', authMiddleware, (req, res) => {
    try {
        const { title, size, size_detail, width, bottom_sand, dimensions, style, description, price, tags } = req.body;

        db.run(`
            UPDATE aquariums
            SET title = ?, size = ?, size_detail = ?, width = ?, bottom_sand = ?, dimensions = ?, style = ?, description = ?, price = ?, tags = ?
            WHERE id = ?
        `, [title, size, size_detail, width, bottom_sand, dimensions, style, description, price, tags, req.params.id]);

        saveDatabase();

        res.json({ message: '更新成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 标记为已售出（需要认证）
app.patch('/api/aquariums/:id/sold', authMiddleware, (req, res) => {
    try {
        db.run(`
            UPDATE aquariums
            SET status = 'sold', sold_at = datetime('now')
            WHERE id = ?
        `, [req.params.id]);

        saveDatabase();
        res.json({ message: '已标记为售出' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 标记为在售（需要认证）
app.patch('/api/aquariums/:id/available', authMiddleware, (req, res) => {
    try {
        db.run(`
            UPDATE aquariums
            SET status = 'available', sold_at = NULL
            WHERE id = ?
        `, [req.params.id]);

        saveDatabase();
        res.json({ message: '已标记为在售' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除造景（需要认证）
app.delete('/api/aquariums/:id', authMiddleware, (req, res) => {
    try {
        db.run('DELETE FROM aquariums WHERE id = ?', [req.params.id]);
        saveDatabase();
        res.json({ message: '删除成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取统计信息
app.get('/api/stats', (req, res) => {
    try {
        const stmt1 = db.prepare('SELECT COUNT(*) as count FROM aquariums');
        stmt1.step();
        const total = stmt1.getAsObject();
        stmt1.free();

        const stmt2 = db.prepare('SELECT COUNT(*) as count FROM aquariums WHERE status = "available"');
        stmt2.step();
        const available = stmt2.getAsObject();
        stmt2.free();

        const stmt3 = db.prepare('SELECT COUNT(*) as count FROM aquariums WHERE status = "sold"');
        stmt3.step();
        const sold = stmt3.getAsObject();
        stmt3.free();

        res.json({
            total: total.count,
            available: available.count,
            sold: sold.count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
        console.log(`📸 图片展示页面: http://localhost:${PORT}`);
        console.log(`⚙️  管理后台: http://localhost:${PORT}/admin.html`);
    });
});

// 优雅关闭
process.on('SIGINT', () => {
    if (db) {
        saveDatabase();
        db.close();
    }
    console.log('\n👋 服务器已关闭');
    process.exit(0);
});
