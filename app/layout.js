import './globals.css';
import { Noto_Sans_TC } from 'next/font/google';
import { getAllSettings } from '@/lib/settings';
import { getLocale } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';

// 使用 next/font 自動 self-host 字體,避免阻擋渲染 + 避免 CLS
const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-tc',
});

export async function generateMetadata() {
  const s = getAllSettings();
  const site = getSiteMeta();
  const locale = getLocale();
  const isEn = locale === 'en';

  const title = isEn ? site.seo_title_en : site.seo_title_zh;
  const description = isEn ? site.seo_description_en : site.seo_description_zh;

  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  return {
    title,
    description,
    keywords: site.seo_keywords,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-icon.png',
    },
    metadataBase: new URL(domain),
    alternates: {
      // 每個語系獨立的 canonical 避免重複內容問題
      canonical: isEn ? `${domain}/?lang=en` : `${domain}/?lang=zh`,
      languages: {
        'zh-Hant': `${domain}/?lang=zh`,
        en: `${domain}/?lang=en`,
        // x-default 指向該站「預設語言」對應的 URL
        'x-default': site.code === 'machines' ? `${domain}/?lang=en` : `${domain}/?lang=zh`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: domain,
      images: s.seo_og_image ? [s.seo_og_image] : undefined,
      siteName: site.brand_en,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
    ...(site.seo_google_verification ? {
      verification: { google: site.seo_google_verification },
    } : {}),
  };
}

export default function RootLayout({ children }) {
  const s = getAllSettings();
  const site = getSiteMeta();
  const ga4 = (s.ga4_id || '').trim();
  const gtm = (s.gtm_id || '').trim();
  const headHtml = s.stat_code_head || '';
  const bodyHtml = s.stat_code_body || '';

  // Schema.org 結構化資料：告訴 Google「POSHTECH = 久洋機械 = Jeouyang Machinery」是同一公司
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://poshtech.com.tw/#organization',
    name: 'Jeouyang Machinery Co., Ltd.',
    alternateName: ['POSHTECH', '久洋機械', '久洋機械股份有限公司', 'Jeouyang', 'Jeouyang Machinery'],
    url: 'https://poshtech.com.tw',
    logo: {
      '@type': 'ImageObject',
      url: 'https://poshtech.com.tw/uploads/logo.png',
      caption: 'POSHTECH / Jeouyang Machinery / 久洋機械',
    },
    description: site.seo_description_en,
    foundingDate: '1994',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No. 197, Minsheng St., Lilin Village',
      addressLocality: 'Tanzi District',
      addressRegion: 'Taichung City',
      addressCountry: 'TW',
    },
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: '+886-4-2537-0971',
      faxNumber: '+886-4-2537-0984',
      email: 'poshtech@ms36.hinet.net',
      contactType: 'sales',
      areaServed: ['TW', 'Worldwide'],
      availableLanguage: ['zh-Hant', 'en'],
    }],
    // 從後台設定讀社群連結,協助 Google 建立 Knowledge Graph 關聯
    sameAs: [
      s.social_facebook,
      s.social_line,
      s.social_instagram,
      s.social_youtube,
      s.social_linkedin,
      s.social_whatsapp ? `https://wa.me/${String(s.social_whatsapp).replace(/[^\d]/g, '')}` : null,
    ].filter(Boolean),
  };

  const siteUrl = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: site.code === 'machines'
      ? 'POSHTECH / Jeouyang Machinery — CNC 加工中心'
      : 'Jeouyang Components — 工具機零組件',
    alternateName: site.code === 'machines'
      ? ['久洋機械', 'POSHTECH', 'Jeouyang Machinery']
      : ['久洋零組件', 'POSHTECH Components', 'Jeouyang Components'],
    url: siteUrl,
    inLanguage: ['zh-Hant', 'en'],
    publisher: { '@id': 'https://poshtech.com.tw/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // hreflang 必須使用絕對 URL,且每站獨立判斷預設語言
  const isMachines = site.code === 'machines';
  const hrefZh = `${siteUrl}/?lang=zh`;
  const hrefEn = `${siteUrl}/?lang=en`;
  // x-default 指向「該站的預設語系」(機台預設英文、零組件預設中文)
  const hrefDefault = isMachines ? hrefEn : hrefZh;

  return (
    <html lang="zh-Hant" className={notoSansTC.variable}>
      <head>
        {/* hreflang:每站獨立宣告,使用絕對 URL (Google 規範) */}
        <link rel="alternate" hrefLang="zh-Hant" href={hrefZh} />
        <link rel="alternate" hrefLang="en" href={hrefEn} />
        <link rel="alternate" hrefLang="x-default" href={hrefDefault} />

        {/* Schema.org 結構化資料 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {/* Google Analytics 4 */}
        {ga4 && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4}');`,
              }}
            />
          </>
        )}

        {/* Google Tag Manager */}
        {gtm && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`,
            }}
          />
        )}

        {headHtml && <div dangerouslySetInnerHTML={{ __html: headHtml }} />}
      </head>
      <body className={`${notoSansTC.className} antialiased`}>
        {gtm && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {children}
        {bodyHtml && <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
      </body>
    </html>
  );
}
