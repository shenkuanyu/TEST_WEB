import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { hashPassword, setMemberSession } from '@/lib/auth';

export async function POST(req) {
  const body = await req.json();
  const { email, password, name, phone } = body || {};
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email 與密碼為必填，密碼至少 6 碼' }, { status: 400 });
  }
  const db = getDB();
  const exist = db.prepare('SELECT id FROM members WHERE email=?').get(email);
  if (exist) return NextResponse.json({ error: '此 Email 已被註冊' }, { status: 409 });
  const hash = hashPassword(password);
  const r = db.prepare('INSERT INTO members (email, password_hash, name, phone) VALUES (?,?,?,?)')
    .run(email, hash, name || null, phone || null);
  await setMemberSession({ id: r.lastInsertRowid, email });
  return NextResponse.json({ ok: true, id: r.lastInsertRowid });
}
