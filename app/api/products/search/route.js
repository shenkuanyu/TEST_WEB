import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ products: [] });

  const db = getDB();
  const keyword = `%${q}%`;
  const products = db.prepare(`
    SELECT p.id, p.name, p.name_en, p.model_code, p.image, p.summary, p.summary_en,
           c.name AS category_name, c.name_en AS category_name_en
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.published = 1
       AND (p.name LIKE ? OR p.name_en LIKE ? OR p.model_code LIKE ? OR p.summary LIKE ? OR p.summary_en LIKE ?)
     ORDER BY p.sort_order, p.id DESC
     LIMIT 20
  `).all(keyword, keyword, keyword, keyword, keyword);

  return NextResponse.json({ products });
}
