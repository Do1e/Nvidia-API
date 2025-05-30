import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';


const DB_PATH = process.env.DB_PATH || 'data.db';
// 数据库单例
let db: Database | null = null;

// 初始化数据库
export async function initializeDatabase() {
  if (!db) {
    // 确保在相对路径中正确找到数据库文件
    const dbPath = path.resolve(DB_PATH);

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // 创建访问记录表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        access_time TEXT NOT NULL,
        ip_address TEXT
      )
    `);
  }

  return db;
}

// 记录用户访问
export async function access(email: string, ipAddress?: string) {
  const database = await initializeDatabase();

  // 生成本地时间
  const localTime = new Date().toLocaleString('zh-CN', {
    timeZone: process.env.TZ || 'Asia/Shanghai', // 使用环境变量中的时区，默认为上海
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  try {
    await database.run(
      'INSERT INTO access_logs (email, access_time, ip_address) VALUES (?, ?, ?)',
      [email, localTime, ipAddress || null]  // 显式插入时间
    );
    return true;
  } catch (error) {
    console.error('Failed to log access:', error);
    return false;
  }
}

// 获取访问记录
export async function getAccessLogs(limit = 100) {
  const database = await initializeDatabase();

  try {
    const logs = await database.all(
      'SELECT * FROM access_logs ORDER BY access_time DESC LIMIT ?',
      [limit]
    );
    return logs;
  } catch (error) {
    console.error('Failed to get access logs:', error);
    return [];
  }
}
