import { NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

export async function POST(req) {
  const fd = await req.formData();
  const file = fd.get('images');

  if (!file || typeof file === 'string' || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // 檢查檔案類型
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // 限制大小 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  const url = await saveUploadedFile(file);
  return NextResponse.json({ ok: true, url });
}
