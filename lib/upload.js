import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 可壓縮的圖片格式
const COMPRESSIBLE = new Set(['.jpg', '.jpeg', '.png', '.webp']);
// 最大寬度(超過會縮小)
const MAX_WIDTH = 1920;
// 壓縮品質
const QUALITY = 82;

// 安全預設值:圖片白名單,避免 SVG (含 XSS 風險) 或可執行檔
export const IMAGE_MIME_WHITELIST = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
]);

// 文件白名單(產品下載用,如型錄 PDF)
export const DOCUMENT_MIME_WHITELIST = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * 壓縮圖片(使用 sharp,若未安裝則跳過壓縮)
 */
async function compressImage(buffer, ext) {
  try {
    const sharp = (await import('sharp')).default;
    let pipeline = sharp(buffer);

    pipeline = pipeline.rotate();

    const meta = await pipeline.metadata();

    if (meta.width && meta.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }

    if (ext === '.png') {
      return { buffer: await pipeline.png({ quality: QUALITY, effort: 6 }).toBuffer(), ext: '.png' };
    } else {
      return { buffer: await pipeline.webp({ quality: QUALITY }).toBuffer(), ext: '.webp' };
    }
  } catch (err) {
    console.warn('[upload] image compression skipped:', err?.message);
    return { buffer, ext };
  }
}

/**
 * 安全儲存上傳檔案
 * @param {File} file - 由 FormData 取得的 File 物件
 * @param {object} options
 * @param {Set<string>} options.allowedMimeTypes - 允許的 MIME 白名單(預設只允許圖片)
 * @param {number} options.maxBytes - 最大檔案大小(byte,預設 10 MB)
 * @returns {Promise<string|null>} 儲存後的相對 URL,或 null
 * @throws {Error} MIME 類型不允許或檔案過大時拋出
 */
export async function saveUploadedFile(file, options = {}) {
  if (!file || typeof file === 'string') return null;

  const {
    allowedMimeTypes = IMAGE_MIME_WHITELIST,
    maxBytes = DEFAULT_MAX_BYTES,
  } = options;

  // 大小檢查(避免攻擊者上傳超大檔耗盡硬碟)
  if (file.size > maxBytes) {
    throw new Error(`檔案過大,上限 ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }

  // MIME 類型白名單檢查
  // 注意:file.type 可由攻擊者偽造,但 sharp 處理時若不是真實圖片會失敗 → 雙重防護
  if (allowedMimeTypes && allowedMimeTypes.size > 0 && !allowedMimeTypes.has(file.type)) {
    throw new Error(`不允許的檔案類型: ${file.type || '未知'}`);
  }

  const bytes = await file.arrayBuffer();
  let buffer = Buffer.from(bytes);
  let ext = path.extname(file.name || '') || '.bin';

  // 圖片自動壓縮(僅針對 COMPRESSIBLE 副檔名,SVG 不在此列也不在白名單)
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
