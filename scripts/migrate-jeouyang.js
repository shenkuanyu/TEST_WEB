/**
 * 將範例資料置換為「久洋機械股份有限公司」的實際內容
 * 執行：node scripts/migrate-jeouyang.js
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

// ----- 清空舊的範例資料 -----
db.prepare('DELETE FROM banners').run();
db.prepare('DELETE FROM products').run();
db.prepare('DELETE FROM news').run();
db.prepare('DELETE FROM categories').run();

// ----- 更新網站基本設定 -----
const setSetting = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?,?)');
setSetting.run('site_name', '久洋機械股份有限公司');
setSetting.run('site_slogan', '零組件標準化的專家');
setSetting.run('site_subtitle', '減少您的庫存量，縮短您的備料期！降低您的成本，讓久洋變成為您的採購件！');
setSetting.run('contact_phone', '886-4-2537-0971');
setSetting.run('contact_fax', '886-4-2537-0984');
setSetting.run('contact_email', 'poshtech@ms36.hinet.net');
setSetting.run('contact_address', '台中市潭子區栗林里民生街197號');
setSetting.run('founded_year', '1994');
console.log('✔ 網站基本設定已更新');

// ----- 產品分類（18 類，依原站順序） -----
const cats = [
  '斜楔', '聯軸器', '軸承座', '操作箱旋轉座', '碰塊',
  '拉刀爪', '小型雕銑機', '立式加工中心', '臥式加工中心',
  '動柱式加工中心', '立式龍門加工中心', '二手中古機專區',
  '加工中心空機', '傳動座', '尾端軸承座',
  '主軸馬達調整版', '標準地基螺栓組',
];
const insCat = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?,?)');
const catIds = {};
cats.forEach((n, i) => {
  const r = insCat.run(n, i);
  catIds[n] = r.lastInsertRowid;
});
console.log(`✔ 已建立 ${cats.length} 個產品分類`);

// ----- 首頁輪播圖（以公司形象圖為主） -----
const insBanner = db.prepare(
  'INSERT INTO banners (title, subtitle, image, link_url, sort_order, active) VALUES (?,?,?,?,?,?)'
);
insBanner.run('零組件標準化的專家', 'since 1994', '/uploads/banner-main.jpg', '/about', 0, 1);
insBanner.run('客製化機械解決方案', '減少庫存・縮短備料期・降低成本', '/uploads/cat-xieqie.jpg', '/products', 1, 1);
console.log('✔ 首頁輪播圖建立完成');

// ----- 首頁精選產品（原站用的 4 大精選） -----
const insProd = db.prepare(`
  INSERT INTO products (name, category_id, price, stock, image, summary, description, published, sort_order)
  VALUES (?,?,?,?,?,?,?,?,?)
`);

insProd.run(
  '斜楔', catIds['斜楔'], 0, 0, '/uploads/prod-xieqie.jpg',
  '機械加工常用之精密定位零件', '久洋自製斜楔，精度穩定、交期可靠。詳細規格請洽業務。',
  1, 0
);
insProd.run(
  '聯軸器', catIds['聯軸器'], 0, 0, '/uploads/prod-coupling.jpg',
  '各式聯軸器，支援客戶規格', '提供多款聯軸器，適用於各類傳動需求。歡迎來電詢價。',
  1, 1
);
insProd.run(
  '軸承座', catIds['軸承座'], 0, 0, '/uploads/prod-bearing.jpg',
  '標準化軸承座，備料快速', '標準軸承座大量庫存，快速出貨，協助客戶縮短備料期。',
  1, 2
);
insProd.run(
  '操作箱旋轉座', catIds['操作箱旋轉座'], 0, 0, '/uploads/prod-rotator.jpg',
  '工具機操作箱專用旋轉座', '為各大工具機品牌操作箱所設計，提供穩定精準的旋轉機構。',
  1, 3
);

// 其餘分類各補一個示範品（可在後台調整）
[
  ['碰塊', '精密碰塊，工具機定位零件'],
  ['拉刀爪', '加工中心主軸拉刀爪'],
  ['小型雕銑機', '小型雕銑機系列'],
  ['立式加工中心', '立式加工中心'],
  ['臥式加工中心', '臥式加工中心'],
  ['動柱式加工中心', '動柱式加工中心'],
  ['立式龍門加工中心', '大型立式龍門加工中心'],
  ['二手中古機專區', '嚴選二手中古機'],
  ['加工中心空機', '加工中心空機'],
  ['傳動座', '各式傳動座'],
  ['尾端軸承座', '尾端軸承座'],
  ['主軸馬達調整版', '主軸馬達調整版'],
  ['標準地基螺栓組', '標準地基螺栓組'],
].forEach(([name, summary], i) => {
  insProd.run(name, catIds[name], 0, 0, '/uploads/placeholder.svg', summary,
    `${name} — 詳細規格與圖片可於後台新增。`, 1, 10 + i);
});
console.log('✔ 示範產品已建立（4 個精選 + 各分類一項）');

// ----- 最新消息 -----
const insNews = db.prepare('INSERT INTO news (title, summary, content, published) VALUES (?,?,?,?)');
insNews.run(
  '久洋機械官方網站全新改版上線',
  '感謝各位長久以來的支持，新網站提供更清晰的產品資訊與聯絡管道。',
  '久洋機械股份有限公司自 1994 年創立以來，秉持專業、誠信、品質的理念，為台灣機械工業持續提供零組件標準化的設計與製造服務。\n\n全新官網上線後，您可以更快速找到所需的產品類別、留下詢價資訊，我們將盡速與您聯絡。',
  1
);
insNews.run(
  '歡迎來廠參觀 — 台中潭子廠區',
  '如需實地參訪或產品洽談，歡迎來電預約。',
  '地址：台中市潭子區栗林里民生街 197 號\n電話：886-4-2537-0971\n傳真：886-4-2537-0984\nE-mail：poshtech@ms36.hinet.net',
  1
);
console.log('✔ 最新消息已建立');

console.log('\n✅ 久洋機械資料移植完成！');
console.log('   請重新整理瀏覽器：http://localhost:3000');
db.close();
