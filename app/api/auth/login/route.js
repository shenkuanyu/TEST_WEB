import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyPassword, setMemberSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req) {
  const ip = getClientIp(req);
  // 同個 IP 15 分鐘內最多 10 次嘗試 (會員登入較寬鬆,避免誤鎖正常用戶)
  const rl = checkRateLimit(`member-login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `嘗試次數過多,請 ${rl.retryAfter} 秒後再試` },
      { status: 429 }
    );
  }

  const { email, password } = await req.json();
  const db = getDB();
  const m = db.prepare('SELECT * FROM members WHERE email=?').get(email);
  if (!m || !verifyPassword(password || '', m.password_hash)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }
  await setMemberSession(m);
  return NextResponse.json({ ok: true });
}
