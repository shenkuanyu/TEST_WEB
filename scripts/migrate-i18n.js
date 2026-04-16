/**
 * 為 products / categories / news 加上英文欄位，支援中英雙語
 * 執行：npm run migrate-i18n
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function run(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`· 跳過 ${dbPath}（檔案不存在）`);
    return;
  }
  const db = new Database(dbPath);

  function hasCol(table, col) {
    return db.prepare(`PRAGMA table_info(${table})`).all().some(r => r.name === col);
  }
  function add(table, col, def) {
    if (!hasCol(table, col)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
      console.log(`[${path.basename(dbPath)}] ✔ +${table}.${col}`);
    }
  }

  // Products bilingual
  add('products', 'name_en',        'TEXT');
  add('products', 'summary_en',     'TEXT');
  add('products', 'description_en', 'TEXT');
  add('products', 'specs_md_en',    'TEXT');
  add('products', 'features_en',    'TEXT');

  // Categories bilingual
  add('categories', 'name_en', 'TEXT');

  // News bilingual
  add('news', 'title_en',   'TEXT');
  add('news', 'summary_en', 'TEXT');
  add('news', 'content_en', 'TEXT');

  db.close();
}

// 處理兩個 DB
const DATA_DIR = path.join(__dirname, '..', 'data');
['machines.db', 'components.db'].forEach(name => {
  run(path.join(DATA_DIR, name));
});

console.log('\n✅ 雙語欄位 migration 完成');
