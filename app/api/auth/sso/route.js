import { NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * 跨站單一登入（SSO）入口
 *   GET /api/auth/sso?token=<JWT>&next=/admin
 *
 * 流程：
 *   1. 使用者已登入 A 站，其 cookie 裡有 admin_token（JWT）
 *   2. A 站側邊欄的「切換到另一站」連結帶著該 JWT 指向 B 站的 /api/auth/sso
 *   3. B 站驗證 JWT（兩站共用 JWT_SECRET）
 *   4. 通過後 B 站簽發自己的新 cookie 並導向 /admin
 *
 * 安全考量：
 *   - 兩站必須用相同 JWT_SECRET，否則驗證失敗
 *   - token 仍有有效期（7 天），過期則需重新登入
 *   - JWT 放在 URL 會被 referer/log 記錄，僅適用於內部後台用途
 */
export async function GET(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const next = url.searchParams.get('next') || '/admin';

  const loginUrl = new URL('/admin/login', req.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    loginUrl.searchParams.set('error', 'sso_invalid');
    return NextResponse.redirect(loginUrl);
  }

  // 用本站環境簽發新的 JWT（確保 cookie 是以本站名義發出）
  const newToken = signToken({
    id: payload.id,
    email: payload.email,
    role: 'admin',
  });

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set('admin_token', newToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
