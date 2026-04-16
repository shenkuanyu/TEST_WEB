import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export async function GET() {
  const db = getDB();
  const items = db.prepare('SELECT * FROM contacts ORDER BY id DESC').all();
  return NextResponse.json({ items });
}

export async function POST(req) {
  const body = await req.json();
  const { name, company, email, phone, fax, address, country, city, comment } = body || {};
  const db = getDB();
  const r = db.prepare(`
    INSERT INTO contacts (name, company, email, phone, fax, address, country, city, comment, source)
    VALUES (?,?,?,?,?,?,?,?,?, 'manual')
  `).run(
    name || null, company || null, email || null, phone || null,
    fax || null, address || null, country || null, city || null, comment || null
  );
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
