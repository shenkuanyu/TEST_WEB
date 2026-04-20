import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 取得所有 LINE 好友（含未啟用的） */
export async function GET() {
  const db = getDB();
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS line_subscribers (
        user_id TEXT PRIMARY KEY,
        display_name TEXT,
        active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const subscribers = db.prepare('SELECT user_id, display_name, active, created_at FROM line_subscribers ORDER BY created_at DESC').all();
    return NextResponse.json({ subscribers });
  } catch {
    return NextResponse.json({ subscribers: [] });
  }
}

/** 更新訂閱者狀態（啟用/停用/刪除） */
export async function PUT(req) {
  const { userId, active } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const db = getDB();
  db.prepare('UPDATE line_subscribers SET active=? WHERE user_id=?').run(active ? 1 : 0, userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const db = getDB();
  db.prepare('DELETE FROM line_subscribers WHERE user_id=?').run(userId);
  return NextResponse.json({ ok: true });
}
