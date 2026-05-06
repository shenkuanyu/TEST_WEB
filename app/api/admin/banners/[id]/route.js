import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const fd = await req.formData();
  const db = getDB();
  const current = db.prepare('SELECT * FROM banners WHERE id=?').get(id);
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const file = fd.get('image');
  let imagePath = current.image;
  if (file && typeof file !== 'string' && file.size > 0) imagePath = await saveUploadedFile(file);

  try { db.exec('ALTER TABLE banners ADD COLUMN title_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE banners ADD COLUMN subtitle_en TEXT'); } catch {}

  db.prepare(`
    UPDATE banners SET title=?, subtitle=?, title_en=?, subtitle_en=?, link_url=?, image=?, sort_order=?, active=?, image_position=? WHERE id=?
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
    id,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  getDB().prepare('DELETE FROM banners WHERE id=?').run(Number(params.id));
  return NextResponse.json({ ok: true });
}
