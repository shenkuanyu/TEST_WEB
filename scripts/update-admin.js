/**
 * 更新後台管理員帳號密碼
 * 執行方式:
 *   ADMIN_EMAIL=poshtech ADMIN_PASSWORD='你的強密碼' node scripts/update-admin.js
 *
 * 為了避免密碼寫死進 git,本腳本要求環境變數提供帳密。
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const NEW_EMAIL = process.env.ADMIN_EMAIL;
const NEW_PASSWORD = process.env.ADMIN_PASSWORD;

if (!NEW_EMAIL || !NEW_PASSWORD) {
  console.error('❌ 請以環境變數提供 ADMIN_EMAIL 與 ADMIN_PASSWORD,例如:');
  console.error('   ADMIN_EMAIL=poshtech ADMIN_PASSWORD=\'你的強密碼\' node scripts/update-admin.js');
  process.exit(1);
}
if (NEW_PASSWORD.length < 10) {
  console.error('❌ 密碼長度需 >= 10 個字元');
  process.exit(1);
}

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 找不到資料庫,請先執行 npm run init-db');
  process.exit(1);
}

const db = new Database(DB_PATH);
const hash = bcrypt.hashSync(NEW_PASSWORD, 10);

db.prepare('DELETE FROM admins').run();
db.prepare('INSERT INTO admins (email, password_hash, name) VALUES (?,?,?)')
  .run(NEW_EMAIL, hash, 'Administrator');

console.log(`\n✅ 後台帳號已更新:${NEW_EMAIL}(密碼已雜湊儲存)`);
console.log('\n→ 請前往 http://localhost:3000/admin/login 以新帳密登入');
db.close();
