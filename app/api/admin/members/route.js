import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export async function GET() {
  const db = getDB();
  const items = db.prepare('SELECT id, email, name, phone, address, created_at FROM members ORDER BY id DESC').all();
  return NextResponse.json({ items });
}

export async function DELETE(req) {
  const id = Number(new URL(req.url).searchParams.get('id'));
  getDB().prepare('DELETE FROM members WHERE id=?').run(id);
  return NextResponse.json({ ok: true });
}
