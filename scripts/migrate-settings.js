/**
 * 將所有「網站設定」的預設 key 寫入資料庫（不存在才寫入，不覆寫既有值）
 * 執行：npm run migrate-settings
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

const DEFAULTS = {
  // 基本資料
  'site_name':        '久洋機械股份有限公司',
  'site_name_en':     'Jeouyang Machinery Co., Ltd.',
  'site_slogan':      '零組件標準化的專家',
  'site_slogan_en':   'The Expert of Component Standardization',
  'site_subtitle':    '減少您的庫存量，縮短您的備料期！降低您的成本，讓久洋變成為您的採購件！',
  'site_subtitle_en': 'Reduce inventory, shorten lead time, and lower your cost — make Jeouyang your trusted sourcing partner.',
  'founded_year':     '1994',

  // 聯絡資訊
  'contact_phone':    '886-4-2537-0971',
  'contact_fax':      '886-4-2537-0984',
  'contact_email':    'poshtech@ms36.hinet.net',
  'contact_address':  '台中市潭子區栗林里民生街197號',
  'contact_address_en': 'No. 197, Minsheng St., Lilin Village, Tanzi Dist., Taichung City, Taiwan',
  'contact_hours':    '週一至週五 08:00 – 17:30',
  'contact_hours_en': 'Mon – Fri 08:00 – 17:30',

  // 統計 / 分析
  'ga4_id':           '',           // 例 G-PD12PTNLRF
  'gtm_id':           '',           // 例 GTM-XXXXXXX
  'stat_code_head':   '',           // 自訂 HTML（放在 <head>）
  'stat_code_body':   '',           // 自訂 HTML（放在 <body> 尾端）

  // 社群連結
  'social_facebook':  '',
  'social_line':      '',
  'social_instagram': '',
  'social_youtube':   '',
  'social_whatsapp':  '',

  // SEO 預設值
  'seo_default_title':       '久洋機械股份有限公司',
  'seo_default_description': '零組件標準化的專家。久洋機械自 1994 年成立，專精於機械零組件（斜楔、聯軸器、軸承座、加工中心等）的研發、設計與製造。',
  'seo_default_keywords':    '久洋, 久洋機械, jeouyang, 斜楔, 聯軸器, 軸承座, 加工中心',
  'seo_og_image':            '/uploads/about.jpg',

  // SMTP 寄信
  'smtp_enabled':      '0',           // 0 = 停用、1 = 啟用
  'smtp_host':         '',            // smtp.gmail.com
  'smtp_port':         '465',
  'smtp_secure':       'ssl',         // ssl / tls / none
  'smtp_user':         '',
  'smtp_pass':         '',
  'smtp_from_name':    '久洋機械',
  'smtp_from_email':   '',            // 寄件人信箱（預設同 smtp_user）
  'smtp_notify_to':    '',            // 收到詢價時通知給誰（預設 = contact_email）
  'smtp_auto_reply':   '1',           // 1 = 自動回覆客戶

  // 安全
  'admin_allow_ips':   '*',            // * 代表全部；可填多行 IP，# 開頭為註解

  // 前台顯示開關
  'show_prices':       '1',            // 0 = 產品頁不顯示價格
};

const insOrIgnore = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');

let inserted = 0;
for (const [k, v] of Object.entries(DEFAULTS)) {
  const r = insOrIgnore.run(k, v);
  if (r.changes > 0) inserted++;
}

console.log(`✅ 網站設定預設值寫入完成（新增 ${inserted} 筆，跳過已存在 ${Object.keys(DEFAULTS).length - inserted} 筆）`);
db.close();
