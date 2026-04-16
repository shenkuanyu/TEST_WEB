import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Protect /admin/* (except /admin/login)
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

  // Protect admin API routes
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
