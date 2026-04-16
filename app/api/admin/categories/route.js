import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export async function GET() {
  const db = getDB();
  const items = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all();
  return NextResponse.json({ items });
}

export async function POST(req) {
  const { name, sort_order = 0 } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const r = getDB().prepare('INSERT INTO categories (name, sort_order) VALUES (?,?)').run(name, sort_order);
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}

export async function DELETE(req) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  getDB().prepare('DELETE FROM categories WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
