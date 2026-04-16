import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { cookies } from 'next/headers';

/**
 * 後台資料庫連線：優先讀 admin_site cookie 決定要連哪個站的 DB。
 * 沒有 cookie 時回退到 SITE_CODE 環境變數，再回退到 machines。
 *
 * 這讓同一個 Next.js 程序能根據管理員在側邊欄的切換，
 * 動態決定要管理哪個站的資料庫——不用換 port、不用開新分頁。
 */

const _cache = {};

export function getCurrentAdminSite() {
  try {
    const c = cookies().get('admin_site')?.value;
    if (c === 'machines' || c === 'components') return c;
  } catch {}
  return process.env.SITE_CODE === 'components' ? 'components' : 'machines';
}

function resolveDBPath() {
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
