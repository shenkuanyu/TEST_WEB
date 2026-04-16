/**
 * 掃描 圖片/網站資料圖檔 並把機台 / 零組件匯入 products 表
 *
 * 每個產品會被建立：
 *   - 基本產品資料（name, summary, category）
 *   - 多張圖片 → product_images
 *   - PDF 型錄 → product_downloads
 *   - 主封面圖 → products.image
 *
 * 可重複執行：以 model_code 做唯一鍵，重跑會更新而非重複建立。
 *
 * 執行：npm run import-products
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const ROOT = process.cwd();
const SRC = path.join(ROOT, '圖片', '網站資料圖檔');
const UPLOADS_ROOT = path.join(ROOT, 'public', 'uploads');
const IMG_DIR = path.join(UPLOADS_ROOT, 'products');
const PDF_DIR = path.join(UPLOADS_ROOT, 'catalogs');
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, 'data', 'app.db');

if (!fs.existsSync(SRC)) {
  console.error(`❌ 找不到資料來源：${SRC}`);
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 找不到資料庫，請先跑 npm run init-db 與 migrate-products');
  process.exit(1);
}

fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(PDF_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ---------- 工具函式 ----------
function slug(s) {
  return String(s)
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .toLowerCase();
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    let st;
    try { st = fs.statSync(fp); } catch { continue; }
    if (st.isDirectory()) walk(fp, results);
    else results.push(fp);
  }
  return results;
}

function copyFile(src, destDir, newName) {
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, newName);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return dest;
}

function fileSize(p) {
  try { return fs.statSync(p).size; } catch { return 0; }
}

function ensureCategory(name) {
  const row = db.prepare('SELECT id FROM categories WHERE name=?').get(name);
  if (row) return row.id;
  const r = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories))').run(name);
  return r.lastInsertRowid;
}

function upsertProduct({ modelCode, name, summary, description, categoryId, mainImage, specsMd, features }) {
  const existing = db.prepare('SELECT id FROM products WHERE model_code=?').get(modelCode);
  if (existing) {
    db.prepare(`
      UPDATE products
         SET name=?, summary=?, description=?, category_id=?, image=COALESCE(?, image),
             specs_md=?, features=?
       WHERE id=?
    `).run(name, summary, description, categoryId, mainImage, specsMd, features, existing.id);
    return existing.id;
  }
  const r = db.prepare(`
    INSERT INTO products (model_code, name, summary, description, category_id, image, specs_md, features, published, sort_order)
    VALUES (?,?,?,?,?,?,?,?, 1, 0)
  `).run(modelCode, name, summary, description, categoryId, mainImage, specsMd, features);
  return r.lastInsertRowid;
}

function clearChildren(productId) {
  db.prepare('DELETE FROM product_images WHERE product_id=?').run(productId);
  db.prepare('DELETE FROM product_downloads WHERE product_id=?').run(productId);
}

function addImage(productId, imagePath, caption, sortOrder = 0) {
  db.prepare('INSERT INTO product_images (product_id, image, caption, sort_order) VALUES (?,?,?,?)')
    .run(productId, imagePath, caption || null, sortOrder);
}

function addDownload(productId, label, filePath, size, sortOrder = 0) {
  db.prepare('INSERT INTO product_downloads (product_id, label, file_path, file_size, sort_order) VALUES (?,?,?,?,?)')
    .run(productId, label, filePath, size, sortOrder);
}

// ---------- 定義要處理的產品 ----------
// 機台：每個資料夾對應一個產品
const MACHINES = [
  { dir: '機台/H5080系列',              code: 'H5080',   name: 'H5080 系列臥式加工中心',          category: '臥式加工中心', summary: '適合高剛性切削的臥式加工中心' },
  { dir: '機台/H5080系列/HS500型錄',     code: 'HS500',   name: 'HS500N 臥式加工中心',              category: '臥式加工中心', summary: 'HS500 系列精密臥式加工中心' },
  { dir: '機台/JC400型錄',              code: 'JC400',   name: 'JC400 小型雕銑機',                  category: '小型雕銑機',  summary: '適合精密雕銑加工的立式機台' },
  { dir: '機台/JC400型錄/Hilik型錄',     code: 'JC400K',  name: 'JC400 Hilik 雕銑機',                category: '小型雕銑機',  summary: '搭載 Hilik 控制系統的雕銑機型號' },
  { dir: '機台/JM200系列',              code: 'JM200',   name: 'JM200 系列立式加工中心',            category: '立式加工中心', summary: '全功能立式加工中心系列' },
  { dir: '機台/JM450系列/JH450',        code: 'JH450',   name: 'JH450 立式加工中心',                category: '立式加工中心', summary: '立式加工中心 — JH450 機型' },
  { dir: '機台/JM450系列/JL400型錄',     code: 'JL400',   name: 'JL400 立式加工中心',                category: '立式加工中心', summary: 'JL400 立式加工中心 — 高精度選擇' },
  { dir: '機台/JM450系列/JM450型錄',     code: 'JM450',   name: 'JM450 立式加工中心',                category: '立式加工中心', summary: '大行程立式加工中心' },
  { dir: '機台/JM450系列/JT450',        code: 'JT450',   name: 'JT450 立式加工中心',                category: '立式加工中心', summary: 'JT450 系列立式加工中心' },
  { dir: '機台/JM450系列/KENT USA 系列', code: 'KENTUSA', name: 'KENT USA 系列',                    category: '立式加工中心', summary: 'KENT USA 代工機系列' },
  { dir: '機台/KMC系列/KMC760型錄',      code: 'KMC760',  name: 'KMC760 臥式加工中心',              category: '臥式加工中心', summary: 'KMC760 臥式加工中心' },
  { dir: '機台/KMC系列/KMC2000型錄',     code: 'KMC2000', name: 'KMC2000 大型加工中心',             category: '立式龍門加工中心', summary: 'KMC2000 大型加工中心' },
  { dir: '機台/NB系列/NB600',           code: 'NB600',   name: 'NB600 立式加工中心',                category: '立式加工中心', summary: 'NB600 立式加工中心' },
  { dir: '機台/NB系列/Ami-24F',         code: 'AMI24F',  name: 'Ami-24F 立式加工中心',              category: '立式加工中心', summary: 'Ami-24F 機型' },
  { dir: '機台/NV系列/NV1010',          code: 'NV1010',  name: 'NV1010 立式加工中心',              category: '立式加工中心', summary: 'NV1010 立式加工中心' },
  { dir: '機台/NV系列/NV1512',          code: 'NV1512',  name: 'NV1512 立式加工中心',              category: '立式加工中心', summary: 'NV1512 大行程立式加工中心' },
];

// 零組件：用資料夾內 "XX 名稱" 格式
const COMPONENTS = [
  { dir: '零組件/01 斜栔',             code: 'COMP_XQ',    name: '斜楔 / 斜栔',               category: '斜楔',           summary: '線性滑軌標準斜楔，機械加工精密定位零件' },
  { dir: '零組件/02 聯軸器',           code: 'COMP_CPL',   name: '聯軸器系列',                category: '聯軸器',         summary: '提供 CP / CR / CS / CT / LT 全系列聯軸器' },
  { dir: '零組件/03 碰塊',             code: 'COMP_PK',    name: '碰塊 / 止檔塊',             category: '碰塊',           summary: '工具機專用精密碰塊' },
  { dir: '零組件/04 操作箱旋轉座',     code: 'COMP_RS',    name: '操作箱旋轉座',              category: '操作箱旋轉座',   summary: '工具機操作箱旋轉機構' },
  { dir: '零組件/05 緩衝墊',           code: 'COMP_BF',    name: '緩衝墊',                    category: '標準地基螺栓組', summary: '機台專用緩衝墊' },
  { dir: '零組件/06 拉刀爪',           code: 'COMP_TC',    name: '拉刀爪（BT / CAT / DIN）',  category: '拉刀爪',         summary: '加工中心主軸拉刀爪，標準德式規格' },
  { dir: '零組件/07 旋轉工作台',       code: 'COMP_RT',    name: '旋轉工作台 / 立式旋轉工作台', category: '加工中心空機',  summary: '精密旋轉工作台' },
  { dir: '零組件/08 主軸型錄',         code: 'COMP_SP',    name: '主軸',                      category: '主軸馬達調整版', summary: '工具機主軸系列' },
  { dir: '零組件/10 軸承座',           code: 'COMP_BS',    name: '軸承座（JS / SE / SF）',    category: '軸承座',         summary: '標準軸承座 JS、SE、SF 三系列' },
  { dir: '零組件/11 傳動座',           code: 'COMP_DR',    name: '傳動座 / 尾端座',           category: '傳動座',         summary: '各式傳動座與尾端座' },
  { dir: '零組件/12 馬達板',           code: 'COMP_MP',    name: '主軸馬達調整板',            category: '主軸馬達調整版', summary: '主軸馬達調整板' },
  { dir: '零組件/13 斗笠式刀庫',       code: 'COMP_TM',    name: '斗笠式刀庫',                category: '加工中心空機',   summary: '斗笠式自動換刀刀庫' },
  { dir: '零組件/14 噴嘴',             code: 'COMP_NZ',    name: '冷卻液噴嘴',                category: '加工中心空機',   summary: '精密冷卻液噴嘴' },
  { dir: '零組件/15 把手',             code: 'COMP_HD',    name: '操作把手',                  category: '加工中心空機',   summary: '工具機專用操作把手' },
  { dir: '零組件/16 DD四五軸',         code: 'COMP_DD45',  name: 'DD 馬達四五軸',             category: '加工中心空機',   summary: 'DD 馬達驅動四 / 五軸旋轉工作台' },
  { dir: '零組件/17 45軸',             code: 'COMP_45',    name: '四軸 / 五軸轉盤',            category: '加工中心空機',   summary: '四軸與五軸加工轉盤' },
];

// ---------- 處理每個產品 ----------
function processProduct(prod, sortIndex) {
  const src = path.join(SRC, prod.dir);
  if (!fs.existsSync(src)) {
    console.log(`⚠  ${prod.code} — 找不到來源資料夾，跳過：${prod.dir}`);
    return;
  }

  const files = walk(src);
  const imgs = files.filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f) && !/Thumbs\.db$/i.test(f));
  const pdfs = files.filter(f => /\.pdf$/i.test(f));

  // 複製圖檔到 public/uploads/products/{code}/
  const destImgDir = path.join(IMG_DIR, prod.code);
  const imgPaths = [];
  imgs.slice(0, 12).forEach((src, idx) => {   // 每個產品最多 12 張圖
    const ext = path.extname(src).toLowerCase();
    const newName = `${prod.code}-${String(idx + 1).padStart(2, '0')}${ext}`;
    copyFile(src, destImgDir, newName);
    imgPaths.push(`/uploads/products/${prod.code}/${newName}`);
  });

  // 複製 PDF 到 public/uploads/catalogs/
  const pdfPaths = [];
  pdfs.slice(0, 6).forEach((src, idx) => {  // 最多 6 份下載
    const label = path.basename(src);
    const newName = `${prod.code}-${idx + 1}-${label.replace(/[^\w.\-()\u4e00-\u9fa5]/g, '_')}`;
    copyFile(src, PDF_DIR, newName);
    pdfPaths.push({ label, file: `/uploads/catalogs/${newName}`, size: fileSize(src) });
  });

  const categoryId = ensureCategory(prod.category);
  const mainImage = imgPaths[0] || null;

  const description = [
    prod.summary,
    '',
    '### 產品特色',
    '- 精密加工級零組件',
    '- 符合工業標準',
    '- 提供技術支援與售後服務',
    '',
    '更多規格請下載型錄或聯絡業務窗口洽詢。',
  ].join('\n');

  const specsMd = [
    '### 主要規格',
    '| 項目 | 內容 |',
    '| --- | --- |',
    '| 型號 | ' + prod.code + ' |',
    '| 分類 | ' + prod.category + ' |',
    '| 適用 | ' + (prod.summary || '請參考型錄') + ' |',
  ].join('\n');

  const features = JSON.stringify([
    '高剛性、高穩定',
    '精度穩定',
    '量產驗證',
  ]);

  const productId = upsertProduct({
    modelCode: prod.code,
    name: prod.name,
    summary: prod.summary,
    description,
    categoryId,
    mainImage,
    specsMd,
    features,
  });

  // 重建子表
  clearChildren(productId);
  imgPaths.forEach((p, i) => addImage(productId, p, `${prod.name} - 圖 ${i + 1}`, i));
  pdfPaths.forEach((p, i) => addDownload(productId, p.label, p.file, p.size, i));

  // 更新主型錄欄位（第一個 PDF 當代表）
  if (pdfPaths[0]) {
    db.prepare('UPDATE products SET catalog_pdf=? WHERE id=?').run(pdfPaths[0].file, productId);
  }
  // 更新排序
  db.prepare('UPDATE products SET sort_order=? WHERE id=?').run(sortIndex, productId);

  console.log(`✔ ${prod.code.padEnd(10)} ${prod.name.padEnd(30)} 圖 ${imgPaths.length.toString().padStart(2)} 張 / PDF ${pdfPaths.length} 份`);
}

// ---------- 主流程 ----------
console.log('\n── 匯入機台 ──');
MACHINES.forEach((p, i) => processProduct(p, 10 + i));

console.log('\n── 匯入零組件 ──');
COMPONENTS.forEach((p, i) => processProduct(p, 100 + i));

const { cnt } = db.prepare('SELECT COUNT(*) cnt FROM products').get();
console.log(`\n✅ 匯入完成，products 表目前共有 ${cnt} 筆`);
db.close();
