import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export async function GET() {
  const db = getDB();
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

  const r = getDB().prepare(`
    INSERT INTO news (title, summary, content, cover_image, published)
    VALUES (?,?,?,?,?)
  `).run(title, fd.get('summary') || null, fd.get('content') || null, cover, fd.get('published') ? 1 : 0);
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
