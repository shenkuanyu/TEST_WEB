import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDB();
  const items = db.prepare('SELECT * FROM products ORDER BY sort_order, id DESC').all();
  return NextResponse.json({ items });
}

export async function POST(req) {
  const fd = await req.formData();
  const name = fd.get('name');
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const file = fd.get('image');
  let imagePath = null;
  if (file && typeof file !== 'string' && file.size > 0) imagePath = await saveUploadedFile(file);

  const db = getDB();
  const r = db.prepare(`
    INSERT INTO products (
      name, model_code, category_id, price, stock, image, summary, description,
      published, sort_order, video_url, specs_md, features, catalog_pdf,
      name_en, summary_en, description_en, specs_md_en, features_en,
      applications, applications_en,
      standard_accessories, standard_accessories_en,
      optional_accessories, optional_accessories_en
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    name,
    fd.get('model_code') || null,
    fd.get('category_id') ? Number(fd.get('category_id')) : null,
    Number(fd.get('price') || 0),
    Number(fd.get('stock') || 0),
    imagePath,
    fd.get('summary') || null,
    fd.get('description') || null,
    fd.get('published') ? 1 : 0,
    Number(fd.get('sort_order') || 0),
    fd.get('video_url') || null,
    fd.get('specs_md') || null,
    fd.get('features') || null,
    fd.get('catalog_pdf') || null,
    fd.get('name_en') || null,
    fd.get('summary_en') || null,
    fd.get('description_en') || null,
    fd.get('specs_md_en') || null,
    fd.get('features_en') || null,
    fd.get('applications') || null,
    fd.get('applications_en') || null,
    fd.get('standard_accessories') || null,
    fd.get('standard_accessories_en') || null,
    fd.get('optional_accessories') || null,
    fd.get('optional_accessories_en') || null,
  );
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
