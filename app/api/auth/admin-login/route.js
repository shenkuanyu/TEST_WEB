import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyPassword, setAdminSession } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const db = getDB();
  const a = db.prepare('SELECT * FROM admins WHERE email=?').get(email);
  if (!a || !verifyPassword(password || '', a.password_hash)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }
  await setAdminSession(a);
  return NextResponse.json({ ok: true });
}
