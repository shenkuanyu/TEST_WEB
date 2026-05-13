import { SITE_CODE } from '@/lib/site';
import { getDB } from '@/lib/db';

export default function sitemap() {
  const domain = SITE_CODE === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  const now = new Date();

  // 靜態頁
  const staticPages = [
    { url: `${domain}/`,         changeFrequency: 'weekly',  priority: 1.0,  lastModified: now },
    { url: `${domain}/about`,    changeFrequency: 'monthly', priority: 0.8,  lastModified: now },
    { url: `${domain}/products`, changeFrequency: 'weekly',  priority: 0.9,  lastModified: now },
    { url: `${domain}/news`,     changeFrequency: 'weekly',  priority: 0.7,  lastModified: now },
    { url: `${domain}/contact`,  changeFrequency: 'monthly', priority: 0.7,  lastModified: now },
  ];

  // 動態頁:產品與新聞
  let dynamicPages = [];
  try {
    const db = getDB();

    const products = db.prepare(
      'SELECT id, updated_at, created_at FROM products WHERE published=1'
    ).all();
    const news = db.prepare(
      'SELECT id, updated_at, created_at FROM news WHERE published=1'
    ).all();

    dynamicPages = [
      ...products.map(p => ({
        url: `${domain}/products/${p.id}`,
        changeFrequency: 'monthly',
        priority: 0.8,
        lastModified: p.updated_at ? new Date(p.updated_at) : (p.created_at ? new Date(p.created_at) : now),
      })),
      ...news.map(n => ({
        url: `${domain}/news/${n.id}`,
        changeFrequency: 'monthly',
        priority: 0.6,
        lastModified: n.updated_at ? new Date(n.updated_at) : (n.created_at ? new Date(n.created_at) : now),
      })),
    ];
  } catch (e) {
    // DB 尚未就緒(build 期間)時忽略,只回靜態頁
  }

  return [...staticPages, ...dynamicPages];
}
