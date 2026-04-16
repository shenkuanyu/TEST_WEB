import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

// GET 列出該產品所有圖片
export async function GET(_req, { params }) {
  const productId = Number(params.id);
  const items = getDB().prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order, id').all(productId);
  return NextResponse.json({ items });
}

// POST 新增圖片（可一次上傳多張）
export async function POST(req, { params }) {
  const productId = Number(params.id);
  const fd = await req.formData();
  const files = fd.getAll('images');   // 多檔案
  const db = getDB();

  const ins = db.prepare('INSERT INTO product_images (product_id, image, caption, sort_order) VALUES (?,?,?,?)');
  let n = 0;
  for (const file of files) {
    if (!file || typeof file === 'string' || file.size === 0) continue;
    const imagePath = await saveUploadedFile(file);
    ins.run(productId, imagePath, null, n);
    n++;
  }
  return NextResponse.json({ ok: true, added: n });
}

// DELETE ?id=xxx 刪除單張
export async function DELETE(req, { params }) {
  const imageId = Number(new URL(req.url).searchParams.get('id'));
  getDB().prepare('DELETE FROM product_images WHERE id=? AND product_id=?').run(imageId, Number(params.id));
  return NextResponse.json({ ok: true });
}

// PUT ?id=xxx 更新 caption 或 sort_order
export async function PUT(req, { params }) {
  const imageId = Number(new URL(req.url).searchParams.get('id'));
  const body = await req.json();
  const { caption, sort_order } = body || {};
  getDB().prepare('UPDATE product_images SET caption=?, sort_order=? WHERE id=? AND product_id=?')
    .run(caption || null, Number(sort_order) || 0, imageId, Number(params.id));
  return NextResponse.json({ ok: true });
}
