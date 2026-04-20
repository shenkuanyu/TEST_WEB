import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** DELETE: 批次刪除訂單 */
export async function DELETE(req) {
  const { ids } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: '請選取至少一筆資料' }, { status: 400 });
  }

  const db = getDB();
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM orders WHERE id IN (${placeholders})`).run(...ids.map(Number));

  return NextResponse.json({ ok: true, deleted: result.changes });
}
