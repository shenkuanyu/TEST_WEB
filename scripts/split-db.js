/**
 * 把既有的 web/data/app.db 分拆成 TEST_WEB/data/machines.db 與 components.db
 * 使用分類名稱判斷屬於哪個站。
 * 執行：node scripts/split-db.js
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// 來源：使用者的主要 web 專案資料庫
const SRC_DB = path.join(__dirname, '..', '..', 'web', 'data', 'app.db');

// 目的：TEST_WEB/data/
const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const MACHINES_DB = path.join(DATA_DIR, 'machines.db');
const COMPONENTS_DB = path.join(DATA_DIR, 'components.db');

// 分類歸屬表
const MACHINE_CATS = new Set([
  '立式加工中心', '臥式加工中心', '動柱式加工中心', '立式龍門加工中心',
  '小型雕銑機', '二手中古機專區', '加工中心空機',
]);
const COMPONENT_CATS = new Set([
  '斜楔', '聯軸器', '軸承座', '操作箱旋轉座', '碰塊',
  '拉刀爪', '傳動座', '尾端軸承座', '主軸馬達調整版',
  '標準地基螺栓組',
]);

if (!fs.existsSync(SRC_DB)) {
  console.error(`❌ 找不到來源資料庫 ${SRC_DB}`);
  console.error('   請確認 web/data/app.db 已存在（即 web 專案至少跑過一次 init-db）');
  process.exit(1);
}

function classify(categoryName) {
  if (!categoryName) return null;
  if (MACHINE_CATS.has(categoryName))   return 'machines';
  if (COMPONENT_CATS.has(categoryName)) return 'components';
  return null;
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

/**
 * 刪除目標 DB 中「不屬於當前站」的資料。
 * 會保留：admins, site_settings, members, orders, contacts（這些跨站共用或各站獨立）
 */
function purgeOtherSite(dbPath, keepSite) {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  // 讀取所有分類
  const cats = db.prepare('SELECT id, name FROM categories').all();
  const keepCatIds = cats.filter(c => classify(c.name) === keepSite).map(c => c.id);
  const removeCatIds = cats.filter(c => classify(c.name) !== keepSite).map(c => c.id);

  console.log(`[${keepSite}] 保留分類 ${keepCatIds.length} 個，移除 ${removeCatIds.length} 個`);

  if (removeCatIds.length) {
    const ph = removeCatIds.map(() => '?').join(',');
    // 先找出要刪除的產品 ID（包含該類別及無類別的）
    const removeProdIds = db.prepare(
      `SELECT id FROM products WHERE category_id IN (${ph})`
    ).all(...removeCatIds).map(r => r.id);

    if (removeProdIds.length) {
      const ph2 = removeProdIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM product_images WHERE product_id IN (${ph2})`).run(...removeProdIds);
      db.prepare(`DELETE FROM product_downloads WHERE product_id IN (${ph2})`).run(...removeProdIds);
      db.prepare(`DELETE FROM products WHERE id IN (${ph2})`).run(...removeProdIds);
    }
    db.prepare(`DELETE FROM categories WHERE id IN (${ph})`).run(...removeCatIds);

    console.log(`[${keepSite}] 移除產品 ${removeProdIds.length} 筆`);
  }

  // 調整網站名稱，讓兩站有區別
  const nameUpdate = db.prepare('UPDATE site_settings SET value=? WHERE key=?');
  if (keepSite === 'machines') {
    nameUpdate.run('久洋機械（機台館）', 'site_name');
    nameUpdate.run('專業的工具機製造商', 'site_slogan');
  } else {
    nameUpdate.run('久洋機械（零組件館）', 'site_name');
    nameUpdate.run('零組件標準化的專家', 'site_slogan');
  }

  // VACUUM 瘦身
  db.exec('VACUUM');
  db.close();
}

// ===== 執行 =====
console.log(`\n📁 從 ${SRC_DB} 開始拆分\n`);

console.log('→ 複製到 machines.db…');
copyFile(SRC_DB, MACHINES_DB);
purgeOtherSite(MACHINES_DB, 'machines');
console.log(`✔ ${MACHINES_DB}\n`);

console.log('→ 複製到 components.db…');
copyFile(SRC_DB, COMPONENTS_DB);
purgeOtherSite(COMPONENTS_DB, 'components');
console.log(`✔ ${COMPONENTS_DB}\n`);

console.log('✅ 拆分完成！');
console.log('   各站資料統計：');

for (const [site, db] of [['machines', MACHINES_DB], ['components', COMPONENTS_DB]]) {
  const d = new Database(db);
  const p = d.prepare('SELECT COUNT(*) c FROM products').get().c;
  const c = d.prepare('SELECT COUNT(*) c FROM categories').get().c;
  const n = d.prepare('SELECT COUNT(*) c FROM news').get().c;
  console.log(`   ${site.padEnd(12)} 產品 ${p} / 分類 ${c} / 消息 ${n}`);
  d.close();
}
