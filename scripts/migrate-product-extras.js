/**
 * 擴充 products 資料表欄位 + 新增 product_images 與 product_downloads 兩個子表
 * 執行：npm run migrate-products
 * 可重複執行，已存在的欄位/表會自動跳過。
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 找不到資料庫，請先執行 npm run init-db');
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function hasColumn(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some(r => r.name === column);
}
function addColumn(table, column, def) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    console.log(`✔ 新增欄位 ${table}.${column}`);
  } else {
    console.log(`· 欄位已存在 ${table}.${column}`);
  }
}

// products 擴充欄位
addColumn('products', 'model_code',   'TEXT');
addColumn('products', 'video_url',    'TEXT');
addColumn('products', 'specs_md',     'TEXT');
addColumn('products', 'features',     'TEXT');     // JSON 陣列字串
addColumn('products', 'catalog_pdf',  'TEXT');     // 主型錄 PDF 路徑

// 產品多圖
db.exec(`
  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
`);
console.log('✔ product_images 表已就緒');

// 產品可下載檔案（型錄、規格書等）
db.exec(`
  CREATE TABLE IF NOT EXISTS product_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_product_downloads_product ON product_downloads(product_id);
`);
console.log('✔ product_downloads 表已就緒');

console.log('\n✅ 產品擴充欄位 migration 完成');
db.close();
