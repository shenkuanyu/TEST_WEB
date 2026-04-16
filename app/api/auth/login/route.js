import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyPassword, setMemberSession } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const db = getDB();
  const m = db.prepare('SELECT * FROM members WHERE email=?').get(email);
  if (!m || !verifyPassword(password || '', m.password_hash)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }
  await setMemberSession(m);
  return NextResponse.json({ ok: true });
}
