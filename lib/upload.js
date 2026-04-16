import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export async function saveUploadedFile(file) {
  if (!file || typeof file === 'string') return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name || '') || '.bin';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const target = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(target, buffer);
  return `/uploads/${name}`;
}
