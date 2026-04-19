import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export async function GET() {
  const db = getDB();
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

  const r = getDB().prepare(`
    INSERT INTO banners (title, subtitle, link_url, image, sort_order, active, image_position)
    VALUES (?,?,?,?,?,?,?)
  `).run(
    fd.get('title') || null,
    fd.get('subtitle') || null,
    fd.get('link_url') || null,
    imagePath,
    Number(fd.get('sort_order') || 0),
    fd.get('active') ? 1 : 0,
    fd.get('image_position') || 'center',
  );
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
