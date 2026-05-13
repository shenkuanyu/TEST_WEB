import NewsCard from '@/components/NewsCard';
import { getDB } from '@/lib/db';
import { getSiteMeta } from '@/lib/site';
import { getLocale, pickI18n } from '@/lib/i18n';

export const revalidate = 60;

export function generateMetadata() {
  const site = getSiteMeta();
  const locale = getLocale();
  const isEn = locale === 'en';
  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';
  return {
    title: isEn ? `News — ${site.brand_en}` : `最新消息 — ${site.brand_zh}`,
    description: isEn
      ? `Latest news and updates from ${site.brand_en}. New products, exhibitions, and company announcements.`
      : `${site.brand_zh}最新消息：新產品發表、展覽資訊、公司動態。`,
    alternates: { canonical: `${domain}/news` },
    robots: { index: true, follow: true },
    openGraph: {
      title: isEn ? `News — ${site.brand_en}` : `最新消息 — ${site.brand_zh}`,
      url: `${domain}/news`,
    },
  };
}

export default function NewsPage() {
  const db = getDB();
  const locale = getLocale();
  const isEn = locale === 'en';
  const site = getSiteMeta();
  const news = db.prepare('SELECT * FROM news WHERE published=1 ORDER BY id DESC').all()
    .map(n => ({ ...n, title: pickI18n(n, 'title', locale), summary: pickI18n(n, 'summary', locale) }));

  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : '首頁', item: domain },
      { '@type': 'ListItem', position: 2, name: isEn ? 'News' : '最新消息', item: `${domain}/news` },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="bg-gray-50 py-16">
        <div className="container text-center">
          <p className="section-sub mb-3">NEWS</p>
          <h1 className="section-title">{isEn ? 'Latest News' : '最新消息'}</h1>
        </div>
      </section>
      <section className="container py-12">
        {news.length === 0 ? (
          <p className="text-center text-gray-400 py-20">{isEn ? 'No news yet.' : '目前尚無消息'}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map(n => <NewsCard key={n.id} item={n} />)}
          </div>
        )}
      </section>
    </div>
  );
}
