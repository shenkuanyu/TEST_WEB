import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 可壓縮的圖片格式
const COMPRESSIBLE = new Set(['.jpg', '.jpeg', '.png', '.webp']);
// 最大寬度（超過會縮小）
const MAX_WIDTH = 1920;
// 壓縮品質
const QUALITY = 82;

/**
 * 壓縮圖片（使用 sharp，若未安裝則跳過壓縮）
 */
async function compressImage(buffer, ext) {
  try {
    const sharp = (await import('sharp')).default;
    let pipeline = sharp(buffer);

    // 自動旋轉（根據 EXIF）
    pipeline = pipeline.rotate();

    // 取得圖片資訊
    const meta = await pipeline.metadata();

    // 超過最大寬度才縮放
    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    // 統一輸出為 WebP（體積最小）或保持原格式
    if (ext === '.png') {
      // PNG 保持 PNG（可能有透明背景）
      return { buffer: await pipeline.png({ quality: QUALITY, effort: 6 }).toBuffer(), ext: '.png' };
    } else {
      // JPG / WEBP → 輸出為 WebP
      return { buffer: await pipeline.webp({ quality: QUALITY }).toBuffer(), ext: '.webp' };
    }
  } catch (err) {
    // sharp 未安裝或壓縮失敗，回傳原始檔案
    console.warn('[upload] image compression skipped:', err?.message);
    return { buffer, ext };
  }
}

export async function saveUploadedFile(file) {
  if (!file || typeof file === 'string') return null;
  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let ext = path.extname(file.name || '') || '.bin';

  // 圖片自動壓縮
  if (COMPRESSIBLE.has(ext.toLowerCase())) {
    const result = await compressImage(buffer, ext.toLowerCase());
    buffer = result.buffer;
    ext = result.ext;
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const target = path.join(UPLOAD_DIR, name);
  fs.writeFileSync(target, buffer);
  return `/uploads/${name}`;
}
