import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

export async function GET(_req, { params }) {
  const id = Number(params.id);
  const db = getDB();
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
  if (!product) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const images = db.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order, id').all(id);
  const downloads = db.prepare('SELECT * FROM product_downloads WHERE product_id=? ORDER BY sort_order, id').all(id);
  return NextResponse.json({ product, images, downloads });
}

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const fd = await req.formData();
  const db = getDB();
  const current = db.prepare('SELECT * FROM products WHERE id=?').get(id);
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const file = fd.get('image');
  let imagePath = current.image;
  if (file && typeof file !== 'string' && file.size > 0) imagePath = await saveUploadedFile(file);

  db.prepare(`
    UPDATE products
       SET name=?, model_code=?, category_id=?, price=?, stock=?, image=?,
           summary=?, description=?, published=?, sort_order=?,
           video_url=?, specs_md=?, features=?, catalog_pdf=?,
           name_en=?, summary_en=?, description_en=?, specs_md_en=?, features_en=?,
           applications=?, applications_en=?,
           standard_accessories=?, standard_accessories_en=?,
           optional_accessories=?, optional_accessories_en=?
     WHERE id=?
  `).run(
    fd.get('name') || current.name,
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
    id,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const id = Number(params.id);
  getDB().prepare('DELETE FROM products WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
