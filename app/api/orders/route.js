import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { getMemberSession } from '@/lib/auth';
import { notifyNewOrder } from '@/lib/mailer';
import { notifyNewOrderLine } from '@/lib/line-notify';

export const runtime = 'nodejs';

/**
 * 建立訂單:
 * - 不信任客戶端傳的 product_name 與 price
 * - 完全用 product_id 從 DB 取得正確的 name 與 price,防止客戶端竄改下 0 元訂單
 * - 找不到的 product_id 直接忽略該 line item
 */
export async function POST(req) {
  const body = await req.json();
  const { contact_name, contact_email, contact_phone, address, note, items = [] } = body || {};
  if (!contact_name || !contact_email) {
    return NextResponse.json({ error: '姓名與 Email 為必填' }, { status: 400 });
  }

  const db = getDB();
  const member = await getMemberSession();

  // 後端從 DB 查實際 name 與 price,完全忽略客戶端傳的 price/name
  const productStmt = db.prepare('SELECT id, name, price FROM products WHERE id=? AND published=1');
  const validatedItems = [];
  for (const it of items) {
    const pid = Number(it.product_id);
    if (!pid) continue;
    const p = productStmt.get(pid);
    if (!p) continue; // 找不到產品就跳過
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    validatedItems.push({
      product_id: p.id,
      product_name: p.name,
      price: Number(p.price) || 0,
      qty,
    });
  }

  const total = validatedItems.reduce((s, it) => s + it.price * it.qty, 0);

  const r = db.prepare(`
    INSERT INTO orders (member_id, contact_name, contact_phone, contact_email, address, note, total, status)
    VALUES (?,?,?,?,?,?,?, 'pending')
  `).run(member?.id || null, contact_name, contact_phone || null, contact_email, address || null, note || null, total);

  const orderId = r.lastInsertRowid;
  if (validatedItems.length) {
    const ins = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, price, qty) VALUES (?,?,?,?,?)');
    for (const it of validatedItems) {
      ins.run(orderId, it.product_id, it.product_name, it.price, it.qty);
    }
  }

  // 同時寫入 contacts 表,方便管理(避免重複登錄)
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

  // 非同步寄送通知(失敗不影響 API 成功回應)
  const orderData = { contact_name, contact_email, contact_phone, address, note };
  notifyNewOrder(orderData);
  notifyNewOrderLine(orderData);

  return NextResponse.json({ ok: true, id: orderId });
}
