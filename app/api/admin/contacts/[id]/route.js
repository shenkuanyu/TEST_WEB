import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export async function PUT(req, { params }) {
  const id = Number(params.id);
  const body = await req.json();
  const { name, company, email, phone, fax, address, country, city, comment } = body || {};
  const db = getDB();
  const current = db.prepare('SELECT id FROM contacts WHERE id=?').get(id);
  if (!current) return NextResponse.json({ error: 'not found' }, { status: 404 });
  db.prepare(`
    UPDATE contacts
       SET name=?, company=?, email=?, phone=?, fax=?, address=?, country=?, city=?, comment=?
     WHERE id=?
  `).run(
    name || null, company || null, email || null, phone || null,
    fax || null, address || null, country || null, city || null, comment || null,
    id,
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  getDB().prepare('DELETE FROM contacts WHERE id=?').run(Number(params.id));
  return NextResponse.json({ ok: true });
}
