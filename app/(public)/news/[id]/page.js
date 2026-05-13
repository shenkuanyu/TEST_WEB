import { getDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLocale, pickI18n } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const db = getDB();
  const locale = getLocale();
  const site = getSiteMeta();
  const isEn = locale === 'en';
  const n = db.prepare('SELECT * FROM news WHERE id=? AND published=1').get(Number(params.id));
  if (!n) return {};

  const title = pickI18n(n, 'title', locale);
  const summary = pickI18n(n, 'summary', locale);
  const content = pickI18n(n, 'content', locale);
  const brandPrefix = site.code === 'machines'
    ? (isEn ? 'POSHTECH | ' : '久洋機械 | ')
    : (isEn ? 'Jeouyang | ' : '久洋零組件 | ');
  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  const descRaw = (summary || (content ? String(content).replace(/<[^>]*>/g, '').slice(0, 160) : '')) || title;

  return {
    title: `${brandPrefix}${title}`,
    description: descRaw,
    alternates: { canonical: `${domain}/news/${params.id}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${brandPrefix}${title}`,
      description: descRaw,
      type: 'article',
      url: `${domain}/news/${params.id}`,
      images: n.cover_image ? [`${domain}${n.cover_image}`] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandPrefix}${title}`,
      description: descRaw,
    },
  };
}

export default function NewsDetail({ params }) {
  const db = getDB();
  const locale = getLocale();
  const site = getSiteMeta();
  const isEn = locale === 'en';
  const raw = db.prepare('SELECT * FROM news WHERE id=? AND published=1').get(Number(params.id));
  if (!raw) notFound();

  const item = {
    ...raw,
    title: pickI18n(raw, 'title', locale),
    summary: pickI18n(raw, 'summary', locale),
    content: pickI18n(raw, 'content', locale),
  };

  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';
  const publisherName = site.code === 'machines' ? 'POSHTECH / Jeouyang Machinery' : 'Jeouyang Components';

  // NewsArticle Schema.org — 讓 Google 搜尋結果顯示日期、縮圖、出版者
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: item.title,
    description: item.summary || (item.content ? String(item.content).replace(/<[^>]*>/g, '').slice(0, 160) : ''),
    image: item.cover_image ? [`${domain}${item.cover_image}`] : undefined,
    datePublished: item.created_at,
    dateModified: item.updated_at || item.created_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${domain}/news/${params.id}` },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://poshtech.com.tw/#organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: `${domain}/uploads/logo.png`,
      },
    },
    author: {
      '@type': 'Organization',
      '@id': 'https://poshtech.com.tw/#organization',
      name: publisherName,
    },
    inLanguage: isEn ? 'en' : 'zh-Hant',
  };

  // BreadcrumbList — 麵包屑導航結構化資料
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : '首頁', item: domain },
      { '@type': 'ListItem', position: 2, name: isEn ? 'News' : '最新消息', item: `${domain}/news` },
      { '@type': 'ListItem', position: 3, name: item.title, item: `${domain}/news/${params.id}` },
    ],
  };

  return (
    <div className="container py-16 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 視覺麵包屑 */}
      <nav aria-label="breadcrumb" className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-brand">{isEn ? 'Home' : '首頁'}</Link>
        <span className="mx-2">/</span>
        <Link href="/news" className="hover:text-brand">{isEn ? 'News' : '最新消息'}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{item.title}</span>
      </nav>

      <article className="mt-6">
        <p className="text-xs tracking-widest text-gray-400">{item.created_at?.slice(0, 10)}</p>
        <h1 className="text-3xl md:text-4xl font-light mt-3 mb-6">{item.title}</h1>
        {item.cover_image && (
          <img src={item.cover_image} alt={item.title} className="w-full rounded-lg mb-8" />
        )}
        <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-loose">
          {item.content}
        </div>
      </article>
    </div>
  );
}
