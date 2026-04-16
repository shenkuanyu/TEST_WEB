/**
 * 同時重設兩個 DB（machines.db 與 components.db）的後台帳號密碼
 * 執行：npm run reset-admin
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// ====== 要設定的新帳密 ======
const NEW_EMAIL = 'poshtech';
const NEW_PASSWORD = '89209973';
// ============================

const DATA_DIR = path.join(__dirname, '..', 'data');
const dbs = ['machines.db', 'components.db'];

const hash = bcrypt.hashSync(NEW_PASSWORD, 10);

for (const name of dbs) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) {
    console.log(`· 跳過 ${name}（不存在）`);
    continue;
  }
  const db = new Database(p);

  // 確保 admins 表存在（若不存在就建立）
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.prepare('DELETE FROM admins').run();
  db.prepare('INSERT INTO admins (email, password_hash, name) VALUES (?,?,?)')
    .run(NEW_EMAIL, hash, 'Administrator');

  console.log(`✔ ${name} 管理員已重設`);
  db.close();
}

console.log(`\n✅ 兩個 DB 的後台帳密都已設為：`);
console.log(`   帳號：${NEW_EMAIL}`);
console.log(`   密碼：${NEW_PASSWORD}`);
console.log(`\n→ 機台館：http://localhost:3001/admin/login`);
console.log(`→ 零組件館：http://localhost:3002/admin/login`);
