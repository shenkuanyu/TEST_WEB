import { NextResponse } from 'next/server';
import { clearMemberSession } from '@/lib/auth';

export async function POST(req) {
  await clearMemberSession();
  return NextResponse.redirect(new URL('/', req.url));
}
