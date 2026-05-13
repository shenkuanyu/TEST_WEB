import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 取得 JWT secret:production 必須設環境變數
function resolveSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[middleware] JWT_SECRET environment variable is required in production');
    }
    return 'dev-secret-change-me';
  }
  return s;
}
const SECRET = new TextEncoder().encode(resolveSecret());
const SITE_CODE = process.env.SITE_CODE || 'machines';

// 搜尋引擎與社群預覽爬蟲偵測 — 為了 SEO 穩定,爬蟲一律回中文版
const BOT_REGEX = /bot|crawler|spider|googlebot|bingbot|baiduspider|yandexbot|slurp|duckduckbot|facebookexternalhit|twitterbot|whatsapp|linkedinbot|applebot|petalbot|sogou|naverbot|seznambot/i;

/**
 * 偵測訪客應該看到的語系。回傳 null 表示不需要設定 cookie。
 *
 * 判斷順序:
 *   1. cookie 已存在 → 尊重用戶既有選擇
 *   2. URL ?lang= 參數 → 由 LanguageSwitcher 處理,不動
 *   3. 零組件站 (parts) → 永遠中文 (台灣市場為主)
 *   4. 機台站爬蟲 → 中文 (為了「久洋機械」中文搜尋排名)
 *   5. 機台站中文瀏覽器 (Accept-Language: zh*) → 中文
 *   6. 機台站其他訪客 → 英文 (國外客戶友善)
 */
function detectLocale(req) {
  const existing = req.cookies.get('locale')?.value;
  if (existing === 'en' || existing === 'zh') return null;

  const langParam = req.nextUrl.searchParams.get('lang');
  if (langParam === 'en' || langParam === 'zh') return null;

  if (SITE_CODE !== 'machines') return 'zh';

  const ua = req.headers.get('user-agent') || '';
  if (BOT_REGEX.test(ua)) return 'zh';

  const acceptLang = (req.headers.get('accept-language') || '').toLowerCase();
  if (acceptLang.startsWith('zh')) return 'zh';

  return 'en';
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ===== 後台路徑保護 =====
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload?.role !== 'admin') throw new Error('not admin');
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  if (pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (payload?.role !== 'admin') throw new Error();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ===== 智慧語系判斷 (只針對公開頁面) =====
  const isPublic = !pathname.startsWith('/admin') && !pathname.startsWith('/api');
  if (isPublic) {
    const detected = detectLocale(req);
    if (detected) {
      const res = NextResponse.next();
      res.cookies.set('locale', detected, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 一年
        sameSite: 'lax',
      });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路徑,排除 _next 內部資源、uploads 靜態檔、favicon、robots、sitemap
    '/((?!_next/static|_next/image|uploads|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
