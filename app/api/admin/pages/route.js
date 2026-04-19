import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { saveUploadedFile } from '@/lib/upload';

export const dynamic = 'force-dynamic';

/** 讀取頁面設定（存在 site_settings 裡，key 以 page_ 開頭） */
export async function GET() {
  const db = getDB();
  const rows = db.prepare("SELECT key, value FROM site_settings WHERE key LIKE 'page_%'").all();
  const data = {};
  rows.forEach(r => {
    try { data[r.key] = JSON.parse(r.value); } catch { data[r.key] = r.value; }
  });
  return NextResponse.json({ data });
}

/** 儲存頁面設定 */
export async function PUT(req) {
  const contentType = req.headers.get('content-type') || '';
  const db = getDB();
  const upsert = db.prepare(
    "INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  );

  // 支援 JSON 和 FormData 兩種格式
  if (contentType.includes('application/json')) {
    const body = await req.json();
    const tx = db.transaction(() => {
      for (const [key, val] of Object.entries(body)) {
        if (!key.startsWith('page_')) continue;
        upsert.run(key, typeof val === 'string' ? val : JSON.stringify(val));
      }
    });
    tx();
    return NextResponse.json({ ok: true });
  }

  // FormData（上傳圖片用）
  const fd = await req.formData();
  const key = fd.get('key');
  const file = fd.get('image');

  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  if (file && typeof file !== 'string' && file.size > 0) {
    const imagePath = await saveUploadedFile(file);
    return NextResponse.json({ ok: true, path: imagePath });
  }

  return NextResponse.json({ error: 'no file' }, { status: 400 });
}
