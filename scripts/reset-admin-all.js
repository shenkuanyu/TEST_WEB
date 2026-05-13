/**
 * 同時重設兩個 DB(machines.db 與 components.db)的後台帳號密碼
 * 執行方式:
 *   ADMIN_EMAIL=poshtech ADMIN_PASSWORD='你的強密碼' npm run reset-admin
 *
 * 為了避免密碼洩漏,這支腳本拒絕從程式碼寫死的預設值跑,
 * 必須由環境變數提供 ADMIN_EMAIL 與 ADMIN_PASSWORD。
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const NEW_EMAIL = process.env.ADMIN_EMAIL;
const NEW_PASSWORD = process.env.ADMIN_PASSWORD;

if (!NEW_EMAIL || !NEW_PASSWORD) {
  console.error('❌ 請以環境變數提供 ADMIN_EMAIL 與 ADMIN_PASSWORD,例如:');
  console.error('   ADMIN_EMAIL=poshtech ADMIN_PASSWORD=\'你的強密碼\' npm run reset-admin');
  process.exit(1);
}
if (NEW_PASSWORD.length < 10) {
  console.error('❌ 密碼長度需 >= 10 個字元');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const dbs = ['machines.db', 'components.db'];

const hash = bcrypt.hashSync(NEW_PASSWORD, 10);

for (const name of dbs) {
  const p = path.join(DATA_DIR, name);
  if (!fs.existsSync(p)) {
    console.log(`· 跳過 ${name}(不存在)`);
    continue;
  }
  const db = new Database(p);

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

console.log(`\n✅ 兩個 DB 的後台帳號已設為:${NEW_EMAIL}(密碼已雜湊儲存,本訊息不顯示明文)`);
console.log(`\n→ 機台館:http://localhost:3001/admin/login`);
console.log(`→ 零組件館:http://localhost:3002/admin/login`);
