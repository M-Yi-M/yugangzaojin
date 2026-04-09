const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

(async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // 创建表
    db.run(`
      CREATE TABLE IF NOT EXISTS aquariums (
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
    `);

    // 保存数据库到文件
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('✅ 数据库初始化成功！');
    console.log('📁 数据库位置:', dbPath);

    db.close();
})();
