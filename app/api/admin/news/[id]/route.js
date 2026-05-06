import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const fd = await req.formData();
  const db = getDB();
  const current = db.prepare('SELECT * FROM news WHERE id=?').get(id);
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const file = fd.get('cover_image');
  let cover = current.cover_image;
  if (file && typeof file !== 'string' && file.size > 0) cover = await saveUploadedFile(file);

  try { db.exec('ALTER TABLE news ADD COLUMN title_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE news ADD COLUMN summary_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE news ADD COLUMN content_en TEXT'); } catch {}

  db.prepare(`
    UPDATE news SET title=?, summary=?, content=?, title_en=?, summary_en=?, content_en=?, cover_image=?, published=? WHERE id=?
  `).run(
    fd.get('title') || current.title,
    fd.get('summary') || null,
    fd.get('content') || null,
    fd.get('title_en') || null,
    fd.get('summary_en') || null,
    fd.get('content_en') || null,
    cover,
    fd.get('published') ? 1 : 0,
    id,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  getDB().prepare('DELETE FROM news WHERE id=?').run(Number(params.id));
  return NextResponse.json({ ok: true });
}
