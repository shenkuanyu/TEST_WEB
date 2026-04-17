import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';

/**
 * 批次更新產品排序（只改 sort_order，不動其他欄位）
 * POST body: { orders: [ { id: 29, sort_order: 0 }, { id: 30, sort_order: 1 }, ... ] }
 */
export async function POST(req) {
  const { orders } = await req.json();
  if (!Array.isArray(orders)) {
    return NextResponse.json({ error: 'orders array required' }, { status: 400 });
  }

  const db = getDB();
  const stmt = db.prepare('UPDATE products SET sort_order=? WHERE id=?');

  const updateAll = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.sort_order, item.id);
    }
  });

  updateAll(orders);

  return NextResponse.json({ ok: true });
}
