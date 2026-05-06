import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export async function GET() {
  const db = getDB();
  // 自動加欄位（如果還沒有）
  try { db.exec('ALTER TABLE banners ADD COLUMN title_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE banners ADD COLUMN subtitle_en TEXT'); } catch {}
  const items = db.prepare('SELECT * FROM banners ORDER BY sort_order, id').all();
  return NextResponse.json({ items });
}

export async function POST(req) {
  const fd = await req.formData();
  const file = fd.get('image');
  if (!file || typeof file === 'string' || file.size === 0) {
    return NextResponse.json({ error: 'image required' }, { status: 400 });
  }
  const imagePath = await saveUploadedFile(file);
  const db = getDB();
  try { db.exec('ALTER TABLE banners ADD COLUMN title_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE banners ADD COLUMN subtitle_en TEXT'); } catch {}

  const r = db.prepare(`
    INSERT INTO banners (title, subtitle, title_en, subtitle_en, link_url, image, sort_order, active, image_position)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    fd.get('title') || null,
    fd.get('subtitle') || null,
    fd.get('title_en') || null,
    fd.get('subtitle_en') || null,
    fd.get('link_url') || null,
    imagePath,
    Number(fd.get('sort_order') || 0),
    fd.get('active') ? 1 : 0,
    fd.get('image_position') || 'center',
  );
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
