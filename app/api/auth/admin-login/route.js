import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyPassword, setAdminSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req) {
  const ip = getClientIp(req);
  // 同個 IP 15 分鐘內最多 5 次嘗試
  const rl = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `嘗試次數過多,請 ${rl.retryAfter} 秒後再試` },
      { status: 429 }
    );
  }

  const { email, password } = await req.json();
  const db = getDB();
  const a = db.prepare('SELECT * FROM admins WHERE email=?').get(email);
  if (!a || !verifyPassword(password || '', a.password_hash)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }
  await setAdminSession(a);
  return NextResponse.json({ ok: true });
}
