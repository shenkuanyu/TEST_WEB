import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { getMemberSession } from '@/lib/auth';
import { notifyNewOrder } from '@/lib/mailer';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json();
  const { contact_name, contact_email, contact_phone, address, note, items = [] } = body || {};
  if (!contact_name || !contact_email) {
    return NextResponse.json({ error: '姓名與 Email 為必填' }, { status: 400 });
  }
  const db = getDB();
  const member = await getMemberSession();
  const total = items.reduce((s, it) => s + (Number(it.price) * Number(it.qty || 1)), 0);
  const r = db.prepare(`
    INSERT INTO orders (member_id, contact_name, contact_phone, contact_email, address, note, total, status)
    VALUES (?,?,?,?,?,?,?, 'pending')
  `).run(member?.id || null, contact_name, contact_phone || null, contact_email, address || null, note || null, total);

  const orderId = r.lastInsertRowid;
  if (items.length) {
    const ins = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price, qty) VALUES (?,?,?,?,?)');
    for (const it of items) ins.run(orderId, it.product_id || null, it.product_name || '', it.price || 0, it.qty || 1);
  }

  // 同時寫入 contacts 表，方便管理（避免重複登錄）
  try {
    const exists = db.prepare('SELECT id FROM contacts WHERE email=? LIMIT 1').get(contact_email);
    if (!exists) {
      db.prepare(`
        INSERT INTO contacts (name, email, phone, address, comment, source)
        VALUES (?,?,?,?,?, 'inquiry')
      `).run(contact_name, contact_email, contact_phone || null, address || null, note || null);
    }
  } catch (e) {
    console.error('[orders] auto-add contact failed:', e?.message);
  }

  // 非同步寄送 SMTP 通知（失敗不影響 API 成功回應）
  notifyNewOrder({ contact_name, contact_email, contact_phone, address, note });

  return NextResponse.json({ ok: true, id: orderId });
}
