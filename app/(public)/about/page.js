import Link from 'next/link';
import { getSiteMeta } from '@/lib/site';
import { getLocale } from '@/lib/i18n';
import { getDB } from '@/lib/db';

export const revalidate = 60;

export function generateMetadata() {
  const site = getSiteMeta();
  const locale = getLocale();
  const isEn = locale === 'en';
  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';
  return {
    title: isEn
      ? `About — ${site.brand_en} | Taiwan CNC Machine Manufacturer Since 1994`
      : `公司介紹 — ${site.brand_zh} | 台灣CNC工具機製造商`,
    description: isEn
      ? `${site.brand_en} (Jeouyang Machinery) — Taiwan CNC machine manufacturer established in 1994. Professional vertical, horizontal and gantry machining centers.`
      : `${site.brand_zh}（久洋機械股份有限公司）成立於1994年，台中專業CNC加工中心製造商，產品外銷全球。`,
    alternates: { canonical: `${domain}/about` },
    robots: { index: false, follow: false },
    openGraph: {
      title: isEn ? `About — ${site.brand_en}` : `公司介紹 — ${site.brand_zh}`,
      url: `${domain}/about`,
    },
  };
}

/** 從 site_settings 取得 page_about JSON，依語言回傳對應欄位 */
function getAboutData(locale) {
  const isEn = locale === 'en';
  const s = (key, d) => {
    if (isEn) return d[`${key}_en`] || d[key] || '';
    return d[key] || '';
  };

  const raw = (() => {
    const defaults = {
      hero_subtitle: 'ABOUT JEOUYANG', hero_subtitle_en: 'ABOUT JEOUYANG',
      hero_title: '公司介紹', hero_title_en: 'About Us',
      hero_desc: '零組件標準化的專家 ｜ since 1994', hero_desc_en: 'Standardization Expert | since 1994',
      about_title: '用標準化思維', about_title_en: 'Standardized Thinking',
      about_highlight: '為台灣機械工業再盡一份力', about_highlight_en: "Empowering Taiwan's Machinery Industry",
      about_p1: '久洋機械股份有限公司創立於 1994 年 7 月，公司成立的初衷，是為台灣機械工業再添一家民營的研究設計公司，協助中小企業解決因設計研發人才短缺，而減少新產品開發、錯失商機的困境。',
      about_p1_en: "Jeouyang Machinery Co., Ltd. was founded in July 1994 with the mission of adding a privately-owned R&D company to Taiwan's machinery industry.",
      about_p2: '經過三十餘年的累積，久洋以「零組件標準化」為核心，持續投入工具機及自動化產業所需的機械零組件研發與製造。我們的目標很明確 —— 讓客戶不必為零件再傷腦筋：減少庫存量、縮短備料期、降低成本，讓久洋成為您穩定可靠的採購夥伴。',
      about_p2_en: 'Over 30 years, Jeouyang has focused on standardizing components for the machine tool industry, helping customers reduce inventory, shorten lead times, and lower costs.',
      philosophy: [
        { num: '01', title: '標準化設計', title_en: 'Standardized Design', desc: '以「可重複量產」為前提做設計。零件規格穩定、品質一致，客戶不必每次重新開規格、重新驗證。', desc_en: 'Design for mass reproduction with stable specs and consistent quality.' },
        { num: '02', title: '縮短備料期', title_en: 'Shorter Lead Time', desc: '以常備庫存加上彈性製程，讓客戶從下單到交機的時間大幅縮短，真正掌握市場商機。', desc_en: 'Ready stock plus flexible processes dramatically reduce delivery time.' },
        { num: '03', title: '降低總成本', title_en: 'Lower Total Cost', desc: '透過標準化與規模化，讓客戶外購久洋零件比自行開發更經濟。把開發資源留給客戶的核心產品。', desc_en: 'Standardization at scale makes outsourcing more economical.' },
      ],
      stats: [
        { number: '30+', title: '年的專業累積', title_en: 'Years of Expertise', desc: '自 1994 年至今，持續投入機械設計與製造。', desc_en: 'Continuous investment in machinery design since 1994.' },
        { number: '17', title: '大產品類別', title_en: 'Product Categories', desc: '從零件到整機，為客戶提供一站式採購方案。', desc_en: 'From components to complete machines.' },
        { number: '100%', title: '客戶導向思維', title_en: 'Customer-Oriented', desc: '所有設計以「降低客戶總成本」為最終目標。', desc_en: 'Every design aims to minimize total customer cost.' },
      ],
      milestones: [
        { year: '1994', title: '公司成立', title_en: 'Founded', desc: '久洋機械股份有限公司於台中潭子創立，以「研究設計」為公司核心能力。', desc_en: 'Jeouyang Machinery established in Tanzih, Taichung.' },
        { year: '創立初期', title: '投入零組件標準化', title_en: 'Component Standardization', desc: '鎖定台灣中小型機械廠需求，從斜楔、聯軸器、軸承座等精密零件切入，建立標準品線。', desc_en: 'Focused on wedges, couplings, and bearing housings.' },
        { year: '擴展期', title: '延伸至整機製造', title_en: 'Machine Manufacturing', desc: '陸續切入立式 / 臥式 / 龍門 / 動柱式加工中心，成為兼具零件與整機能力的綜合型供應商。', desc_en: 'Expanded into machining centers.' },
        { year: '至今', title: '持續深耕', title_en: 'Continuous Growth', desc: '持續以「減少客戶庫存、縮短備料期、降低採購成本」為核心價值，服務台灣工具機與自動化產業。', desc_en: "Serving Taiwan's machine tool industry." },
      ],
    };
    try {
      const db = getDB();
      const row = db.prepare("SELECT value FROM site_settings WHERE key='page_about'").get();
      if (row?.value) return { ...defaults, ...JSON.parse(row.value) };
    } catch {}
    return defaults;
  })();

  return {
    hero_subtitle: s('hero_subtitle', raw),
    hero_title: s('hero_title', raw),
    hero_desc: s('hero_desc', raw),
    about_title: s('about_title', raw),
    about_highlight: s('about_highlight', raw),
    about_p1: s('about_p1', raw),
    about_p2: s('about_p2', raw),
    philosophy: raw.philosophy.map(p => ({ num: p.num, title: isEn ? (p.title_en || p.title) : p.title, desc: isEn ? (p.desc_en || p.desc) : p.desc })),
    stats: raw.stats.map(st => ({ number: st.number, title: isEn ? (st.title_en || st.title) : st.title, desc: isEn ? (st.desc_en || st.desc) : st.desc })),
    milestones: raw.milestones.map(m => ({ year: m.year, title: isEn ? (m.title_en || m.title) : m.title, desc: isEn ? (m.desc_en || m.desc) : m.desc })),
  };
}

export default function AboutPage() {
  const locale = getLocale();
  const d = getAboutData(locale);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gray-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="/uploads/about.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative container text-center">
          <p className="text-sm tracking-[0.4em] text-brand mb-4">{d.hero_subtitle}</p>
          <h1 className="text-4xl md:text-6xl font-light tracking-wide">{d.hero_title}</h1>
          <p className="mt-6 text-lg text-gray-300">{d.hero_desc}</p>
        </div>
      </section>

      {/* 公司簡介 */}
      <section className="container py-20">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <img src="/uploads/about.jpg" alt="久洋機械" className="rounded-lg w-full shadow-sm" />
          </div>
          <div>
            <p className="section-sub mb-3 !text-brand">ABOUT US</p>
            <h2 className="text-3xl md:text-4xl font-light mb-6 leading-snug">
              {d.about_title}<br />
              <span className="text-brand">{d.about_highlight}</span>
            </h2>
            <div className="space-y-4 text-gray-600 leading-loose">
              <p>{d.about_p1}</p>
              <p>{d.about_p2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 經營理念 */}
      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="text-center mb-14">
            <p className="section-sub mb-3">OUR PHILOSOPHY</p>
            <h2 className="section-title">經營理念</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {d.philosophy.map((x) => (
              <div key={x.num} className="bg-white p-8 rounded-lg border-t-4 border-brand shadow-sm">
                <div className="text-brand text-4xl font-light mb-4">{x.num}</div>
                <div className="text-xl font-semibold mb-3 text-gray-900">{x.title}</div>
                <p className="text-gray-500 leading-relaxed">{x.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 產品能量 */}
      <section className="container py-20">
        <div className="text-center mb-14">
          <p className="section-sub mb-3">CAPABILITY</p>
          <h2 className="section-title">產品與服務能量</h2>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
            從精密零組件到整機，完整涵蓋工具機產業上下游所需。
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { t: '精密機械零組件', items: ['斜楔', '聯軸器', '軸承座', '操作箱旋轉座', '碰塊', '拉刀爪'] },
            { t: '工具機整機', items: ['立式加工中心', '臥式加工中心', '動柱式加工中心', '立式龍門加工中心', '小型雕銑機'] },
            { t: '配件與週邊', items: ['傳動座', '尾端軸承座', '主軸馬達調整版', '標準地基螺栓組'] },
            { t: '中古機專區', items: ['二手中古機', '加工中心空機', '整備翻修服務'] },
          ].map((g) => (
            <div key={g.t} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-brand">{g.t}</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {g.items.map(i => <li key={i} className="flex items-start"><span className="text-brand mr-2">›</span>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/products" className="btn-primary">瀏覽完整產品列表</Link>
        </div>
      </section>

      {/* 品質與技術 */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container grid md:grid-cols-3 gap-8 text-center">
          {d.stats.map(x => (
            <div key={x.title}>
              <div className="text-5xl md:text-6xl font-light text-brand mb-3">{x.number}</div>
              <div className="text-xl font-semibold mb-2">{x.title}</div>
              <p className="text-gray-400 text-sm leading-relaxed">{x.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 發展歷程 */}
      <section className="container py-20">
        <div className="text-center mb-14">
          <p className="section-sub mb-3">MILESTONE</p>
          <h2 className="section-title">發展歷程</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-8 relative">
          <div className="absolute left-[5.5rem] top-2 bottom-2 w-px bg-brand/30" />
          {d.milestones.map((m) => (
            <div key={m.year} className="flex gap-6 items-start relative">
              <div className="text-brand font-bold text-lg w-24 shrink-0 pt-1">{m.year}</div>
              <div className="w-3 h-3 rounded-full bg-brand shrink-0 mt-2 relative z-10" />
              <div className="flex-1 pb-4">
                <div className="font-semibold text-gray-900 mb-1">{m.title}</div>
                <p className="text-gray-600 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 公司資訊 / 聯絡 */}
      <section className="bg-gray-50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <p className="section-sub mb-3">COMPANY INFO</p>
            <h2 className="section-title">公司資訊</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-5 text-gray-900 flex items-center">
                <span className="w-1 h-6 bg-brand mr-3" />基本資料
              </h3>
              <dl className="space-y-3 text-gray-600">
                <div className="flex gap-4"><dt className="w-20 text-gray-400">公司名稱</dt><dd>久洋機械股份有限公司</dd></div>
                <div className="flex gap-4"><dt className="w-20 text-gray-400">英文名稱</dt><dd>Jeouyang Machinery Co., Ltd.</dd></div>
                <div className="flex gap-4"><dt className="w-20 text-gray-400">成立時間</dt><dd>1994 年 7 月</dd></div>
                <div className="flex gap-4"><dt className="w-20 text-gray-400">主要業務</dt><dd>機械零組件設計、製造、銷售</dd></div>
              </dl>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-semibold mb-5 text-gray-900 flex items-center">
                <span className="w-1 h-6 bg-brand mr-3" />聯絡方式
              </h3>
              <dl className="space-y-3 text-gray-600">
                <div className="flex gap-4"><dt className="w-20 text-gray-400 shrink-0">地址</dt><dd>台中市潭子區栗林里民生街 197 號</dd></div>
                <div className="flex gap-4"><dt className="w-20 text-gray-400 shrink-0">電話</dt><dd><a href="tel:886-4-2537-0971" className="hover:text-brand">886-4-2537-0971</a></dd></div>
                <div className="flex gap-4"><dt className="w-20 text-gray-400 shrink-0">傳真</dt><dd>886-4-2537-0984</dd></div>
                <div className="flex gap-4"><dt className="w-20 text-gray-400 shrink-0">Email</dt><dd><a href="mailto:poshtech@ms36.hinet.net" className="hover:text-brand break-all">poshtech@ms36.hinet.net</a></dd></div>
              </dl>
              <div className="mt-6">
                <Link href="/contact" className="btn-primary w-full !justify-center">前往詢價表單</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand text-white py-14">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-light mb-3">想更進一步了解久洋？</h2>
          <p className="text-white/80 mb-6">歡迎來電或親自蒞臨台中潭子廠區參觀洽談。</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:886-4-2537-0971" className="inline-flex items-center px-6 py-3 bg-white text-brand rounded-md hover:bg-gray-100 transition font-medium">
              立即來電 886-4-2537-0971
            </a>
            <Link href="/products" className="inline-flex items-center px-6 py-3 border border-white text-white rounded-md hover:bg-white hover:text-brand transition">
              瀏覽產品線
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
