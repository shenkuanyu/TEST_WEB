import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { hashPassword, setMemberSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req) {
  const ip = getClientIp(req);
  // 註冊更嚴 — 同 IP 1 小時內最多 3 次,擋帳號量產
  const rl = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `註冊次數過多,請 ${rl.retryAfter} 秒後再試` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { email, password, name, phone } = body || {};
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email 與密碼為必填,密碼至少 6 碼' }, { status: 400 });
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
