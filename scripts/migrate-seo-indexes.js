/**
 * 新增關鍵 SEO / 列表查詢用 index
 * 執行:node scripts/migrate-seo-indexes.js
 *
 * VPS 部署後執行:
 *   docker exec -it poshtech-machines node scripts/migrate-seo-indexes.js
 *   docker exec -it poshtech-components node scripts/migrate-seo-indexes.js
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function migrate(dbPath) {
  if (!fs.existsSync(dbPath)) {
    console.log(`· 跳過 ${dbPath}(不存在)`);
    return;
  }
  console.log(`\n→ 處理 ${dbPath}`);
  const db = new Database(dbPath);

  const indexes = [
    // 首頁、產品列表最常用的 published + sort 查詢
    {
      name: 'idx_products_published_sort',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_published_sort ON products(published, sort_order, id)',
    },
    // 分類篩選 + published 篩選
    {
      name: 'idx_products_category_published',
      sql: 'CREATE INDEX IF NOT EXISTS idx_products_category_published ON products(category_id, published)',
    },
    // 新聞列表(published 篩選 + 依 id 排序最新)
    {
      name: 'idx_news_published_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_news_published_id ON news(published, id DESC)',
    },
    // 首頁 banner(active 篩選 + sort)
    {
      name: 'idx_banners_active_sort',
      sql: 'CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON banners(active, sort_order)',
    },
  ];

  for (const idx of indexes) {
    try {
      db.exec(idx.sql);
      console.log(`  ✔ ${idx.name}`);
    } catch (e) {
      console.error(`  ✘ ${idx.name}: ${e.message}`);
    }
  }

  // 顯示目前資料表的 indexes
  const list = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name").all();
  console.log(`  目前 indexes:`, list.map(r => r.name).join(', '));

  db.close();
}

// 容器內部:DATABASE_PATH 環境變數;本機:把兩個 DB 都跑一遍
const envPath = process.env.DATABASE_PATH;
if (envPath) {
  migrate(envPath);
} else {
  const DATA_DIR = path.join(__dirname, '..', 'data');
  ['machines.db', 'components.db'].forEach(name => migrate(path.join(DATA_DIR, name)));
}

console.log('\n✅ 完成');
