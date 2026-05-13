/**
 * 臨時 SEO 診斷端點 - 用來排查 sitemap 為什麼產品/新聞讀不到
 * 上線確認 sitemap 正常後可移除。
 */
import { NextResponse } from 'next/server';
import { SITE_CODE } from '@/lib/site';
import { getDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = {
    timestamp: new Date().toISOString(),
    env: {
      SITE_CODE,
      DATABASE_PATH: process.env.DATABASE_PATH || '(undefined - fallback to ./data/app.db)',
      cwd: process.cwd(),
      NODE_ENV: process.env.NODE_ENV,
    },
    db: {
      connectOk: false,
      tables: [],
      productsCount: null,
      newsCount: null,
      productsQueryError: null,
      newsQueryError: null,
      sampleProductIds: [],
      sampleNewsIds: [],
    },
  };

  try {
    const db = getDB();
    result.db.connectOk = true;

    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      result.db.tables = tables.map(t => t.name);
    } catch (e) {
      result.db.tablesError = e?.message;
    }

    try {
      const rows = db.prepare('SELECT id FROM products WHERE published=1 LIMIT 5').all();
      result.db.productsCount = db.prepare('SELECT COUNT(*) c FROM products WHERE published=1').get().c;
      result.db.sampleProductIds = rows.map(r => r.id);
    } catch (e) {
      result.db.productsQueryError = e?.message;
    }

    try {
      const rows = db.prepare('SELECT id FROM news WHERE published=1 LIMIT 5').all();
      result.db.newsCount = db.prepare('SELECT COUNT(*) c FROM news WHERE published=1').get().c;
      result.db.sampleNewsIds = rows.map(r => r.id);
    } catch (e) {
      result.db.newsQueryError = e?.message;
    }
  } catch (e) {
    result.db.connectError = e?.message;
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}
