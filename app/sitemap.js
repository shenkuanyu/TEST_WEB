import { getDB } from '@/lib/db';
import { getSiteMeta, SITE_CODE } from '@/lib/site';

export default function sitemap() {
  const site = getSiteMeta();
  const domain = SITE_CODE === 'machines'
    ? 'https://machines.poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  // 固定頁面
  const staticPages = [
    { url: `${domain}/`,        changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${domain}/about`,   changeFrequency: 'monthly', priority: 0.8 },
    { url: `${domain}/products`,changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${domain}/news`,    changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${domain}/contact`, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // 動態頁面：產品（含分類篩選頁）
  let productPages = [];
  let categoryPages = [];
  try {
    const db = getDB();
    const products = db.prepare('SELECT id, updated_at FROM products WHERE published = 1 ORDER BY sort_order').all();
    productPages = products.map(p => ({
      url: `${domain}/products/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    // 分類頁面
    const categories = db.prepare('SELECT id FROM categories ORDER BY sort_order').all();
    categoryPages = categories.map(c => ({
      url: `${domain}/products?cat=${c.id}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (e) {
    // DB 未建立時不中斷
  }

  // 動態頁面：新聞
  let newsPages = [];
  try {
    const db = getDB();
    const news = db.prepare('SELECT id, updated_at FROM news WHERE visible = 1 ORDER BY date DESC').all();
    newsPages = news.map(n => ({
      url: `${domain}/news/${n.id}`,
      lastModified: n.updated_at ? new Date(n.updated_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (e) {}

  return [...staticPages, ...categoryPages, ...productPages, ...newsPages];
}
