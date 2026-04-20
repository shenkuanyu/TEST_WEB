/**
 * 遷移腳本：新增 line_subscribers 表
 * 用於 LINE Messaging API 訂閱者管理
 *
 * 執行：node scripts/migrate-line-subscribers.js
 * Docker：docker exec poshtech-machines node scripts/migrate-line-subscribers.js
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  console.log('data/ 目錄不存在，略過');
  process.exit(0);
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.db'));
for (const file of files) {
  const dbPath = path.join(dataDir, file);
  const db = new Database(dbPath);

  // 檢查是否已有此表
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='line_subscribers'").get();
  if (exists) {
    console.log(`⏭ ${file} — line_subscribers 表已存在，略過`);
    db.close();
    continue;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS line_subscribers (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log(`✅ ${file} — 已建立 line_subscribers 表`);
  db.close();
}

console.log('遷移完成！');
