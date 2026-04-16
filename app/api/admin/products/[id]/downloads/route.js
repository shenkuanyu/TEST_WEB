import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const CATALOG_DIR = path.join(process.cwd(), 'public', 'uploads', 'catalogs');
if (!fs.existsSync(CATALOG_DIR)) fs.mkdirSync(CATALOG_DIR, { recursive: true });

async function saveCatalog(file) {
  if (!file || typeof file === 'string') return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name || '').toLowerCase() || '.pdf';
  const safe = (file.name || 'file').replace(/[^\w.\-()\u4e00-\u9fa5]/g, '_');
  const name = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(CATALOG_DIR, name), buffer);
  return { path: `/uploads/catalogs/${name}`, size: buffer.length, origName: file.name || name };
}

export async function GET(_req, { params }) {
  const productId = Number(params.id);
  const items = getDB().prepare('SELECT * FROM product_downloads WHERE product_id=? ORDER BY sort_order, id').all(productId);
  return NextResponse.json({ items });
}

// POST 支援兩種：
//  1. multipart/form-data 上傳檔案（files 欄位）
//  2. application/json 送現有檔案路徑（label + file_path）
export async function POST(req, { params }) {
  const productId = Number(params.id);
  const db = getDB();
  const ctype = req.headers.get('content-type') || '';

  if (ctype.includes('multipart/form-data')) {
    const fd = await req.formData();
    const files = fd.getAll('files');
    const ins = db.prepare('INSERT INTO product_downloads (product_id, label, file_path, file_size, sort_order) VALUES (?,?,?,?,?)');
    let n = 0;
    for (const f of files) {
      if (!f || typeof f === 'string' || f.size === 0) continue;
      const saved = await saveCatalog(f);
      ins.run(productId, saved.origName, saved.path, saved.size, n);
      n++;
    }
    return NextResponse.json({ ok: true, added: n });
  }

  // JSON 新增（從既有檔案引用）
  const body = await req.json();
  const r = db.prepare('INSERT INTO product_downloads (product_id, label, file_path, file_size, sort_order) VALUES (?,?,?,?,?)')
    .run(productId, body.label, body.file_path, body.file_size || 0, body.sort_order || 0);
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}

export async function PUT(req, { params }) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  const body = await req.json();
  getDB().prepare('UPDATE product_downloads SET label=?, sort_order=? WHERE id=? AND product_id=?')
    .run(body.label || null, Number(body.sort_order) || 0, id, Number(params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  getDB().prepare('DELETE FROM product_downloads WHERE id=? AND product_id=?').run(id, Number(params.id));
  return NextResponse.json({ ok: true });
}
