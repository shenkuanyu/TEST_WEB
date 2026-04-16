import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export async function GET() {
  const db = getDB();
  const items = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  return NextResponse.json({ items });
}

export async function PUT(req) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  const { status } = await req.json();
  getDB().prepare('UPDATE orders SET status=? WHERE id=?').run(status, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  getDB().prepare('DELETE FROM orders WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
