/* Run: node scripts/init-db.js */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ------- Schema -------
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  model_code TEXT,
  category_id INTEGER,
  price REAL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  image TEXT,
  summary TEXT,
  description TEXT,
  specs_md TEXT,
  features TEXT,
  video_url TEXT,
  catalog_pdf TEXT,
  applications TEXT,
  applications_en TEXT,
  standard_accessories TEXT,
  standard_accessories_en TEXT,
  optional_accessories TEXT,
  optional_accessories_en TEXT,
  published INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

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

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  cover_image TEXT,
  summary TEXT,
  content TEXT,
  published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  subtitle TEXT,
  image TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(member_id) REFERENCES members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT,
  price REAL,
  qty INTEGER,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  fax TEXT,
  address TEXT,
  country TEXT,
  city TEXT,
  comment TEXT,
  tag TEXT,
  source TEXT DEFAULT 'manual',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
`);

// ------- Seed default admin -------
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
const existing = db.prepare('SELECT id FROM admins WHERE email=?').get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync(adminPass, 10);
  db.prepare('INSERT INTO admins (email, password_hash, name) VALUES (?,?,?)').run(adminEmail, hash, 'Administrator');
  console.log(`✔ Admin created: ${adminEmail} / ${adminPass}`);
} else {
  console.log(`• Admin already exists: ${adminEmail}`);
}

// ------- Seed categories -------
const catCount = db.prepare('SELECT COUNT(*) c FROM categories').get().c;
if (catCount === 0) {
  const insCat = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?,?)');
  ['產品系列 A', '產品系列 B', '產品系列 C'].forEach((n, i) => insCat.run(n, i));
  console.log('✔ Seeded categories');
}

// ------- Seed sample products -------
const prodCount = db.prepare('SELECT COUNT(*) c FROM products').get().c;
if (prodCount === 0) {
  const ins = db.prepare(`
    INSERT INTO products (name, slug, category_id, price, stock, image, summary, description)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  const demoImg = '/uploads/placeholder.svg';
  ins.run('示範產品 001', 'demo-001', 1, 1200, 20, demoImg, '這是一段簡短的產品描述。', '詳細產品說明。可在後台編輯。');
  ins.run('示範產品 002', 'demo-002', 1, 2400, 15, demoImg, '第二項示範產品。', '詳細內容。');
  ins.run('示範產品 003', 'demo-003', 2, 980,  30, demoImg, '第三項示範產品。', '詳細內容。');
  ins.run('示範產品 004', 'demo-004', 3, 3600, 5,  demoImg, '高階產品。',        '詳細內容。');
  console.log('✔ Seeded products');
}

// ------- Seed news -------
const newsCount = db.prepare('SELECT COUNT(*) c FROM news').get().c;
if (newsCount === 0) {
  const ins = db.prepare('INSERT INTO news (title, slug, summary, content) VALUES (?,?,?,?)');
  ins.run('公司官網正式上線', 'site-launch', '我們的官方網站今天正式上線！', '完整的消息內容，可在後台編輯。');
  ins.run('新產品發表會', 'new-release', '春季新品登場。', '活動細節可在後台編輯。');
  console.log('✔ Seeded news');
}

// ------- Seed banners -------
const bCount = db.prepare('SELECT COUNT(*) c FROM banners').get().c;
if (bCount === 0) {
  const ins = db.prepare('INSERT INTO banners (title, subtitle, image, link_url, sort_order, active) VALUES (?,?,?,?,?,?)');
  ins.run('專業 · 誠信 · 品質', '為您提供最佳解決方案', '/uploads/banner-1.svg', '/products', 0, 1);
  ins.run('全新產品系列',        '立即探索',            '/uploads/banner-2.svg', '/products', 1, 1);
  console.log('✔ Seeded banners');
}

// ------- Seed site settings -------
const sCount = db.prepare('SELECT COUNT(*) c FROM site_settings').get().c;
if (sCount === 0) {
  const ins = db.prepare('INSERT INTO site_settings (key, value) VALUES (?,?)');
  ins.run('site_name', '我的公司');
  ins.run('contact_phone', '+886-2-0000-0000');
  ins.run('contact_email', 'contact@example.com');
  ins.run('contact_address', '台北市中正區示範路 1 號');
  console.log('✔ Seeded site settings');
}

console.log('\n✅  Database initialised at', DB_PATH);
db.close();
