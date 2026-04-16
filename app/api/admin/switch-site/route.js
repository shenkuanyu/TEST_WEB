import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * 後台切換當前管理的站台（不跳頁、不換 port）
 *   POST /api/admin/switch-site
 *   FormData: site=machines|components, next=/admin
 *
 * 寫入 admin_site cookie，讓後台 API 與頁面改讀對應 DB。
 * 公開頁面（/, /products, /about 等）不受影響，繼續依 SITE_CODE env 顯示。
 */
export async function POST(req) {
  const fd = await req.formData();
  const site = fd.get('site');
  const next = fd.get('next') || '/admin';

  if (site !== 'machines' && site !== 'components') {
    return NextResponse.json({ error: 'invalid site' }, { status: 400 });
  }

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set('admin_site', site, {
    httpOnly: false,   // 可讓前端 JS 讀取（非敏感資訊）
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
