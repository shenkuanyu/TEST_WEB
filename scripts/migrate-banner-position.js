/**
 * 遷移腳本：為 banners 資料表新增 image_position 欄位
 * 用於控制圖片在 16:7 裁切時的焦點位置
 *
 * 使用方式：
 *   node scripts/migrate-banner-position.js
 *   （會自動套用到所有 data/*.db 檔案）
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
const dbFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.db'));

if (dbFiles.length === 0) {
  console.log('⚠ 找不到任何 .db 檔案');
  process.exit(0);
}

for (const file of dbFiles) {
  const dbPath = path.join(dataDir, file);
  const db = new Database(dbPath);

  // 檢查 banners 表是否存在
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'").all();
  if (tables.length === 0) {
    console.log(`⏭ ${file} — 沒有 banners 表，略過`);
    db.close();
    continue;
  }

  // 檢查欄位是否已存在
  const cols = db.prepare("PRAGMA table_info(banners)").all();
  const hasCol = cols.some(c => c.name === 'image_position');

  if (hasCol) {
    console.log(`✔ ${file} — image_position 欄位已存在，略過`);
  } else {
    db.prepare("ALTER TABLE banners ADD COLUMN image_position TEXT DEFAULT 'center'").run();
    console.log(`✔ ${file} — 已新增 image_position 欄位`);
  }

  db.close();
}

console.log('✅ 遷移完成');
