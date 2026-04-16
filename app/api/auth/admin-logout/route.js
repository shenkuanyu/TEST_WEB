import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req) {
  await clearAdminSession();

  // Docker 容器內 req.url 是 localhost:3000，需用 Host header 取得正確網址
  const host = headers().get('host') || 'poshtech.com.tw';
  const proto = headers().get('x-forwarded-proto') || 'https';
  const loginUrl = `${proto}://${host}/admin/login`;

  return NextResponse.redirect(loginUrl);
}
