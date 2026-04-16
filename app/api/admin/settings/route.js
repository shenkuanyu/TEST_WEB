import { NextResponse } from 'next/server';
import { getAllSettings, putSettings } from '@/lib/settings';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDB();
  const settings = getAllSettings(db);
  const masked = { ...settings };
  if (masked.smtp_pass) masked.smtp_pass = '********';
  return NextResponse.json({ settings: masked });
}

export async function PUT(req) {
  const body = await req.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const pairs = { ...body };
  if (pairs.smtp_pass === '********') delete pairs.smtp_pass;

  const db = getDB();
  putSettings(pairs, db);
  return NextResponse.json({ ok: true });
}
