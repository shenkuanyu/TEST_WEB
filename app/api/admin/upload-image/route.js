import { NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

export async function POST(req) {
  const fd = await req.formData();
  const file = fd.get('images');

  if (!file || typeof file === 'string' || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // saveUploadedFile 內部已強制 MIME 白名單(僅 JPEG/PNG/WebP/GIF,排除 SVG)與 10MB 上限
  try {
    const url = await saveUploadedFile(file);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: e?.message || '上傳失敗' }, { status: 400 });
  }
}
