import { getDB as getPublicDB } from './db';

/**
 * 取得所有網站設定（key → value 的 plain object）
 * 可傳入指定的 DB 連線；若未傳則使用公開頁的預設 DB。
 */
export function getAllSettings(db) {
  const d = db || getPublicDB();
  try {
    const rows = d.prepare('SELECT key, value FROM site_settings').all();
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  } catch {
    return {};
  }
}

/**
 * 快捷讀取單一設定
 */
export function getSetting(key, fallback = '', db) {
  const d = db || getPublicDB();
  try {
    const row = d.prepare('SELECT value FROM site_settings WHERE key=?').get(key);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * 批次寫入設定（有則更新，無則新增）
 */
export function putSettings(pairs, db) {
  const d = db || getPublicDB();
  const up = d.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  const tx = d.transaction((obj) => {
    for (const [k, v] of Object.entries(obj)) up.run(k, v == null ? '' : String(v));
  });
  tx(pairs);
}
