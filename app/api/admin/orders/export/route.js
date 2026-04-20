import * as XLSX from 'xlsx';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET: 匯出訂單為 Excel，支援 ?ids=1,2,3 匯出選取 */
export async function GET(req) {
  const db = getDB();
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids');

  let rows;
  const query = (where = '') => `
    SELECT id            AS "編號",
           contact_name  AS "姓名",
           contact_email AS "Email",
           contact_phone AS "電話",
           address       AS "地址",
           note          AS "留言內容",
           status        AS "狀態",
           total         AS "金額",
           created_at    AS "建立時間"
      FROM orders
      ${where}
     ORDER BY id DESC
  `;

  if (idsParam) {
    const ids = idsParam.split(',').map(n => Number(n)).filter(Boolean);
    if (!ids.length) {
      rows = [];
    } else {
      const placeholders = ids.map(() => '?').join(',');
      rows = db.prepare(query(`WHERE id IN (${placeholders})`)).all(...ids);
    }
  } else {
    rows = db.prepare(query()).all();
  }

  // 狀態轉中文
  const statusMap = { pending: '待處理', processing: '處理中', done: '已完成', cancelled: '已取消' };
  rows.forEach(r => { r['狀態'] = statusMap[r['狀態']] || r['狀態']; });

  const ws = XLSX.utils.json_to_sheet(rows);

  // 自動欄寬
  const cols = ['編號', '姓名', 'Email', '電話', '地址', '留言內容', '狀態', '金額', '建立時間'];
  ws['!cols'] = cols.map(c => ({
    wch: Math.min(60, Math.max(c.length + 2, ...rows.map(r => String(r[c] || '').length + 2))),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '訂單詢問');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `orders_${date}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
