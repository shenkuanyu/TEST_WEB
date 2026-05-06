import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export async function GET() {
  const db = getDB();
  try { db.exec('ALTER TABLE news ADD COLUMN title_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE news ADD COLUMN summary_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE news ADD COLUMN content_en TEXT'); } catch {}
  const items = db.prepare('SELECT * FROM news ORDER BY id DESC').all();
  return NextResponse.json({ items });
}

export async function POST(req) {
  const fd = await req.formData();
  const title = fd.get('title');
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const file = fd.get('cover_image');
  let cover = null;
  if (file && typeof file !== 'string' && file.size > 0) cover = await saveUploadedFile(file);

  const db = getDB();
  try { db.exec('ALTER TABLE news ADD COLUMN title_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE news ADD COLUMN summary_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE news ADD COLUMN content_en TEXT'); } catch {}

  const r = db.prepare(`
    INSERT INTO news (title, summary, content, title_en, summary_en, content_en, cover_image, published)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(
    title,
    fd.get('summary') || null,
    fd.get('content') || null,
    fd.get('title_en') || null,
    fd.get('summary_en') || null,
    fd.get('content_en') || null,
    cover,
    fd.get('published') ? 1 : 0,
  );
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
