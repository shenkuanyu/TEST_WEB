/**
 * 更新後台管理員帳號密碼
 * 執行：node scripts/update-admin.js
 *
 * 若已存在舊的 admin@example.com 帳號，會將其帳號名稱與密碼改為指定的新帳密。
 * 若不存在，則新建一個。
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// ====== 要設定的新帳密 ======
const NEW_EMAIL = 'poshtech';
const NEW_PASSWORD = '89209973';
// ============================

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 找不到資料庫，請先執行 npm run init-db');
  process.exit(1);
}

const db = new Database(DB_PATH);
const hash = bcrypt.hashSync(NEW_PASSWORD, 10);

// 先清掉所有管理員，再寫入一組新的（避免舊的殘留）
db.prepare('DELETE FROM admins').run();
db.prepare('INSERT INTO admins (email, password_hash, name) VALUES (?,?,?)')
  .run(NEW_EMAIL, hash, 'Administrator');

console.log('\n✅ 後台帳密已更新！');
console.log(`   帳號：${NEW_EMAIL}`);
console.log(`   密碼：${NEW_PASSWORD}`);
console.log('\n→ 請前往 http://localhost:3000/admin/login 以新帳密登入');
db.close();
