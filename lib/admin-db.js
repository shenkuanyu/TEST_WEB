import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * 後台資料庫連線：直接用 SITE_CODE 環境變數決定連哪個站的 DB。
 * VPS 上每個容器各自有自己的 SITE_CODE（machines / components）。
 */

const _cache = {};

export function getCurrentAdminSite() {
  return process.env.SITE_CODE === 'components' ? 'components' : 'machines';
}

function resolveDBPath() {
  // Docker 環境：每個容器只服務一個站，直接用 DATABASE_PATH
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  // 本機開發：根據 admin_site cookie 切換
  const site = getCurrentAdminSite();
  const fileName = site === 'components' ? 'components.db' : 'machines.db';
  return path.join(process.cwd(), 'data', fileName);
}

export function getDB() {
  const dbPath = resolveDBPath();
  if (!_cache[dbPath]) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    _cache[dbPath] = db;
  }
  return _cache[dbPath];
}

// 提供具名匯出以便需要時同時引用兩種
export const getAdminDB = getDB;
