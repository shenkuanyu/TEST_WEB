/**
 * 從 web/聯絡人清單.xlsx 匯入聯絡人資料
 * 執行：npm run import-contacts [檔案路徑]
 *
 * 若未指定路徑，預設讀取 "./聯絡人清單.xlsx"
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');

const XLSX_PATH = process.argv[2] || path.join(process.cwd(), '聯絡人清單.xlsx');
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');

if (!fs.existsSync(XLSX_PATH)) {
  console.error(`❌ 找不到 Excel 檔：${XLSX_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 找不到資料庫，請先執行 npm run init-db');
  process.exit(1);
}

// 欄位對照（Excel 欄名 → DB 欄位）
const COL_MAP = {
  name: ['Name', '姓名', '名字'],
  company: ['Company Name', 'Company', '公司', '公司名稱'],
  email: ['E-mail', 'Email', '電郵', '電子郵件'],
  phone: ['Phone Number', 'Phone', '電話', '手機'],
  fax: ['Fax', '傳真'],
  address: ['Address', '地址'],
  country: ['Country', '國家'],
  city: ['City/Town', 'City', '城市'],
  comment: ['Comment', 'Note', '備註', '留言', '內容'],
};

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '' && String(row[k]).toLowerCase() !== 'nan') {
      return String(row[k]).trim();
    }
  }
  return null;
}

const wb = XLSX.readFile(XLSX_PATH);
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const ins = db.prepare(`
  INSERT INTO contacts (name, company, email, phone, fax, address, country, city, comment, source)
  VALUES (@name, @company, @email, @phone, @fax, @address, @country, @city, @comment, 'import')
`);

let totalImported = 0;
const tx = db.transaction((rows) => {
  for (const r of rows) ins.run(r);
});

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  if (!rows.length) continue;

  const mapped = rows
    .map((row) => ({
      name: pick(row, COL_MAP.name),
      company: pick(row, COL_MAP.company),
      email: pick(row, COL_MAP.email),
      phone: pick(row, COL_MAP.phone),
      fax: pick(row, COL_MAP.fax),
      address: pick(row, COL_MAP.address),
      country: pick(row, COL_MAP.country),
      city: pick(row, COL_MAP.city),
      comment: pick(row, COL_MAP.comment),
    }))
    .filter((r) => r.name || r.email || r.company); // 至少要有一個欄位

  tx(mapped);
  totalImported += mapped.length;
  console.log(`✔ 分頁 "${sheetName}" 匯入 ${mapped.length} 筆`);
}

console.log(`\n✅ 共匯入 ${totalImported} 筆聯絡人`);
db.close();
