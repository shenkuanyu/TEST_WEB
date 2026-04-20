import { NextResponse } from 'next/server';
import { getLineSubscribers } from '@/lib/line-notify';
import { getDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 取得所有 LINE 訂閱者 */
export async function GET() {
  const subscribers = getLineSubscribers();
  return NextResponse.json({ subscribers });
}

/** 刪除指定訂閱者 */
export async function DELETE(req) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const db = getDB();
  try {
    db.prepare('UPDATE line_subscribers SET active=0 WHERE user_id=?').run(userId);
  } catch {}
  return NextResponse.json({ ok: true });
}
