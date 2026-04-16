import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';

// Excel 欄名 → DB 欄位對照
const COL_MAP = {
  name: ['Name', '姓名', '名字', '聯絡人'],
  company: ['Company Name', 'Company', '公司', '公司名稱'],
  email: ['E-mail', 'Email', 'EMAIL', '電郵', '電子郵件'],
  phone: ['Phone Number', 'Phone', '電話', '手機'],
  fax: ['Fax', 'FAX', '傳真'],
  address: ['Address', '地址'],
  country: ['Country', '國家'],
  city: ['City/Town', 'City', '城市'],
  comment: ['Comment', 'Note', '備註', '留言', '內容'],
};

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) {
      const s = String(row[k]).trim();
      if (s && s.toLowerCase() !== 'nan') return s;
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const fd = await req.formData();
    const file = fd.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: '請選擇 Excel 檔案' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });

    const db = getDB();
    const ins = db.prepare(`
      INSERT INTO contacts (name, company, email, phone, fax, address, country, city, comment, source)
      VALUES (@name, @company, @email, @phone, @fax, @address, @country, @city, @comment, 'import')
    `);

    let imported = 0;
    const tx = db.transaction((rows) => {
      for (const r of rows) ins.run(r);
    });

    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });
      if (!rows.length) continue;
      const mapped = rows
        .map(row => ({
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
        .filter(r => r.name || r.email || r.company);
      tx(mapped);
      imported += mapped.length;
    }

    return NextResponse.json({ ok: true, imported });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
