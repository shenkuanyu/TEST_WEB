import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import HomeProductCarousel from '@/components/HomeProductCarousel';
import NewsCard from '@/components/NewsCard';
import Reveal from '@/components/Reveal';
import { getDB } from '@/lib/db';
import { getLocale, pickI18n } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';

export const revalidate = 60; // ISR: 每 60 秒重新產生

export default function Home() {
  const db = getDB();
  const locale = getLocale();
  const site = getSiteMeta();
  const isEn = locale === 'en';

  const banners = db.prepare('SELECT * FROM banners WHERE active=1 ORDER BY sort_order').all();
  const products = db.prepare('SELECT * FROM products WHERE published=1 ORDER BY sort_order, id DESC').all()
    .map(p => ({ ...p, name: pickI18n(p, 'name', locale), summary: pickI18n(p, 'summary', locale) }));
  const news = db.prepare('SELECT * FROM news WHERE published=1 ORDER BY id DESC LIMIT 4').all()
    .map(n => ({ ...n, title: pickI18n(n, 'title', locale), summary: pickI18n(n, 'summary', locale) }));

  const settings = {};
  db.prepare('SELECT key, value FROM site_settings').all().forEach(r => (settings[r.key] = r.value));

  // 首頁 3 格圖卡（依網站切換機台 / 零組件的圖）
  const aboutTiles = site.hero_tiles.map(t => ({
    img: t.img,
    label: isEn ? t.label_en : t.label_zh,
  }));

  return (
    <>
      {/* ===== Hero ===== */}
      <HeroCarousel banners={banners} />

      {/* ===== 關於區塊：左文字 + 右 3 圖卡 ===== */}
      <section className="relative py-14 md:py-24 overflow-hidden">
        <span className="absolute -top-3 md:-top-6 left-2 md:left-10 deco-en text-[70px] sm:text-[100px] md:text-[180px]">ABOUT</span>
        <div className="container relative grid lg:grid-cols-12 gap-8 md:gap-10 items-center">
          <Reveal variant="fade-right" className="lg:col-span-5">
            <p className="text-xs md:text-sm tracking-[0.4em] text-brand font-semibold mb-2 md:mb-3">
              {isEn ? 'ABOUT JEOUYANG' : 'ABOUT JEOUYANG'}
            </p>
            <p className="text-gray-400 tracking-widest mb-3 md:mb-4 text-sm md:text-base">
              {isEn ? 'Who We Are' : '關於久洋機械'}
            </p>
            {isEn ? (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug mb-4 md:mb-6 text-gray-900">
                Jeouyang Machinery Co., Ltd.<br />
                <span className="text-brand">Founded in 1994</span>,
                <br className="hidden md:block" />
                serving Taiwan&apos;s machinery industry.
              </h2>
            ) : (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug mb-4 md:mb-6 text-gray-900">
                久洋機械股份有限公司<br />
                <span className="text-brand">創立於 1994 年</span>，
                <br className="hidden md:block" />
                為台灣機械工業而生。
              </h2>
            )}
            <p className="text-sm md:text-base text-gray-600 leading-loose mb-6 md:mb-8">
              {isEn
                ? 'Jeouyang Machinery was founded to strengthen Taiwan’s machinery industry with a privately-owned R&D company. Over the years, we have continued to standardize machine components so that customers can reduce inventory, shorten lead times, and lower procurement costs.'
                : '公司成立的初衷，是為台灣機械工業再添一家民營的研究設計公司，協助中小企業解決研發人才短缺的難題。多年來我們持續將零組件標準化，讓客戶減少庫存、縮短備料期、降低採購成本。'
              }
            </p>
            <Link href="/about" className="group inline-flex items-center gap-3 border-b-2 border-brand pb-2 text-brand font-medium tracking-widest hover:gap-5 transition-all">
              READ MORE
              <span className="w-8 h-px bg-brand group-hover:w-12 transition-all" />
            </Link>
          </Reveal>

          <Reveal variant="fade-left" delay={100} className="lg:col-span-7">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {aboutTiles.map((t, i) => (
                <div
                  key={i}
                  className="group relative aspect-[3/5] overflow-hidden rounded-sm bg-gray-200"
                >
                  <img
                    src={t.img}
                    alt={t.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="inline-block text-white text-base md:text-xl font-semibold tracking-widest pb-2 border-b-2 border-brand">
                      {t.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 產品區塊：整面深色背景 + 橫向輪播 ===== */}
      <section className="relative py-14 md:py-24 bg-gray-100 overflow-hidden">
        <span className="absolute -top-1 left-0 right-0 text-center deco-en text-[60px] sm:text-[90px] md:text-[180px]">PRODUCTS</span>
        <div className="container relative">
          <Reveal variant="fade-down" className="text-center mb-8 md:mb-12">
            <p className="text-xs md:text-sm tracking-[0.4em] text-brand font-semibold mb-2 md:mb-3">OUR PRODUCTS</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-light text-gray-900">
              {isEn ? 'Products' : '產品資訊'}
            </h2>
            <div className="mt-4 md:mt-5 inline-flex items-center gap-3">
              <span className="w-6 md:w-8 h-px bg-brand" />
              <span className="text-[10px] md:text-xs tracking-[0.3em] text-gray-400">
                {isEn ? 'PROFESSIONAL LINEUP' : 'PROFESSIONAL LINEUP'}
              </span>
              <span className="w-6 md:w-8 h-px bg-brand" />
            </div>
          </Reveal>

          <Reveal variant="fade-up" delay={100}>
            <HomeProductCarousel products={products} />
          </Reveal>

          <div className="text-center mt-8">
            <Link href="/products" className="group inline-flex items-center gap-3 text-gray-800 font-medium tracking-widest hover:text-brand transition">
              READ MORE
              <span className="w-8 h-px bg-gray-800 group-hover:bg-brand group-hover:w-12 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 最新消息：左標題 右列表（大立風） ===== */}
      {news.length > 0 && (
        <section className="relative py-14 md:py-24 overflow-hidden">
          <span className="absolute -top-3 md:-top-6 right-2 md:right-10 deco-en text-[70px] sm:text-[100px] md:text-[180px]">NEWS</span>
          <div className="container relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-8 md:mb-10">
              <Reveal variant="fade-right">
                <p className="text-xs md:text-sm tracking-[0.4em] text-brand font-semibold mb-2 md:mb-3">LATEST NEWS</p>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-light text-gray-900">
                  {isEn ? 'Latest News' : '最新消息'}
                </h2>
              </Reveal>
              <Reveal variant="fade-left">
                <Link href="/news" className="group inline-flex items-center gap-3 text-gray-800 font-medium tracking-widest hover:text-brand transition">
                  READ MORE
                  <span className="w-8 h-px bg-gray-800 group-hover:bg-brand group-hover:w-12 transition-all" />
                </Link>
              </Reveal>
            </div>

            <Reveal variant="fade-up" delay={100}>
              <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
                {news.map((n) => (
                  <Link
                    key={n.id}
                    href={`/news/${n.id}`}
                    className="group flex gap-3 sm:gap-4 md:gap-8 items-center py-4 md:py-6 hover:bg-gray-50 transition px-2"
                  >
                    <div className="w-20 sm:w-24 md:w-48 shrink-0 aspect-[16/10] overflow-hidden rounded-sm bg-gray-100">
                      <img
                        src={n.cover_image || '/uploads/placeholder.svg'}
                        alt={n.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 md:mb-2">
                        <span className="text-brand font-semibold tracking-wider text-xs md:text-sm">
                          {n.created_at?.slice(0, 10).replace(/-/g, '.')}
                        </span>
                        <span className="inline-block px-2 py-0.5 text-[10px] md:text-xs bg-brand/10 text-brand rounded">
                          {isEn ? 'News' : '最新消息'}
                        </span>
                      </div>
                      <div className="text-base md:text-xl font-semibold text-gray-900 group-hover:text-brand transition truncate">
                        {n.title}
                      </div>
                      {n.summary && (
                        <div className="text-xs md:text-sm text-gray-500 mt-0.5 md:mt-1 line-clamp-1">{n.summary}</div>
                      )}
                    </div>
                    <div className="hidden md:flex shrink-0 w-10 h-10 rounded-full border border-gray-300 items-center justify-center text-gray-400 group-hover:bg-brand group-hover:border-brand group-hover:text-white transition">
                      →
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ===== 另一站介紹區塊 ===== */}
      <section className="relative py-14 md:py-20 bg-gray-50 overflow-hidden">
        <div className="container">
          <Reveal variant="fade-up">
            <div className="bg-white rounded-lg shadow-sm border-l-4 border-brand p-6 md:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <p className="text-xs md:text-sm tracking-[0.3em] text-brand font-semibold mb-2">
                  {isEn ? 'ALSO FROM JEOUYANG' : '同公司另一個網站'}
                </p>
                <h3 className="text-2xl md:text-3xl font-light text-gray-900 mb-3">
                  {isEn ? site.other_site.name_en : site.other_site.name_zh}
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
                  {isEn ? site.other_site.desc_en : site.other_site.desc_zh}
                </p>
              </div>
              <a
                href={site.other_site.url}
                target="_blank"
                rel="noopener"
                className="btn-primary !px-6 md:!px-8 whitespace-nowrap"
              >
                {isEn ? 'Visit Site →' : '前往網站 →'}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 聯絡區塊：左圖 + 右深色聯絡卡 ===== */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <Reveal variant="fade-right" className="relative aspect-[16/10] lg:aspect-auto min-h-[320px]">
            <img src="/uploads/contact-1.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
          </Reveal>

          <Reveal variant="fade-left" className="py-12 md:py-20 px-6 md:px-16 flex flex-col justify-center">
            <p className="text-xs md:text-sm tracking-[0.4em] text-brand font-semibold mb-2 md:mb-3">CONTACT US</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-light mb-6 md:mb-8">
              {isEn ? 'Contact Us' : '聯絡我們'}
            </h2>

            <dl className="space-y-4 md:space-y-5 text-sm md:text-lg">
              <div className="flex gap-4">
                <dt className="text-brand w-16 shrink-0 text-sm tracking-widest pt-1">ADD</dt>
                <dd className="text-gray-200">
                  {isEn ? (settings.contact_address_en || settings.contact_address) : settings.contact_address}
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="text-brand w-16 shrink-0 text-sm tracking-widest pt-1">TEL</dt>
                <dd><a href={`tel:${settings.contact_phone}`} className="text-gray-200 hover:text-brand">{settings.contact_phone}</a></dd>
              </div>
              <div className="flex gap-4">
                <dt className="text-brand w-16 shrink-0 text-sm tracking-widest pt-1">FAX</dt>
                <dd className="text-gray-200">{settings.contact_fax}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="text-brand w-16 shrink-0 text-sm tracking-widest pt-1">MAIL</dt>
                <dd><a href={`mailto:${settings.contact_email}`} className="text-gray-200 hover:text-brand break-all">{settings.contact_email}</a></dd>
              </div>
            </dl>

            <Link href="/contact" className="btn-primary mt-10 w-fit !px-8">
              {isEn ? 'Online Inquiry →' : '線上詢價 →'}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
