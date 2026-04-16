import * as XLSX from 'xlsx';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';

export async function GET(req) {
  const db = getDB();
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids');

  let rows;
  if (idsParam) {
    const ids = idsParam.split(',').map(n => Number(n)).filter(Boolean);
    if (!ids.length) {
      rows = [];
    } else {
      const placeholders = ids.map(() => '?').join(',');
      rows = db.prepare(`
        SELECT name        AS "Name",
               company     AS "Company Name",
               email       AS "E-mail",
               phone       AS "Phone Number",
               fax         AS "Fax",
               address     AS "Address",
               country     AS "Country",
               city        AS "City/Town",
               comment     AS "Comment",
               created_at  AS "Created At"
          FROM contacts
         WHERE id IN (${placeholders})
         ORDER BY id DESC
      `).all(...ids);
    }
  } else {
    rows = db.prepare(`
      SELECT name        AS "Name",
             company     AS "Company Name",
             email       AS "E-mail",
             phone       AS "Phone Number",
             fax         AS "Fax",
             address     AS "Address",
             country     AS "Country",
             city        AS "City/Town",
             comment     AS "Comment",
             created_at  AS "Created At"
        FROM contacts
       ORDER BY id DESC
    `).all();
  }

  const ws = XLSX.utils.json_to_sheet(rows);

  // 自動欄寬
  const cols = ['Name', 'Company Name', 'E-mail', 'Phone Number', 'Fax', 'Address', 'Country', 'City/Town', 'Comment', 'Created At'];
  ws['!cols'] = cols.map(c => ({
    wch: Math.min(
      60,
      Math.max(c.length + 2, ...rows.map(r => String(r[c] || '').length + 2))
    ),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '聯絡人');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const date = new Date().toISOString().slice(0, 10);
  const filename = `contacts_${date}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
