import { getSiteMeta } from '@/lib/site';
import { getLocale } from '@/lib/i18n';

export function generateMetadata() {
  const site = getSiteMeta();
  const locale = getLocale();
  const isEn = locale === 'en';
  const domain = site.code === 'machines'
    ? 'https://machines.poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';
  return {
    title: isEn
      ? `Contact Us — ${site.brand_en} | Request a Quote`
      : `聯絡我們 — ${site.brand_zh} | 線上詢價`,
    description: isEn
      ? `Contact ${site.brand_en} for CNC machining center inquiries, quotes, and technical support. Located in Taichung, Taiwan. Phone: +886-4-2537-0971`
      : `聯絡${site.brand_zh}（久洋機械），產品詢價、技術諮詢。地址：台中市潭子區民生街197號。電話：04-2537-0971`,
    alternates: { canonical: `${domain}/contact` },
    openGraph: {
      title: isEn ? `Contact — ${site.brand_en}` : `聯絡我們 — ${site.brand_zh}`,
      url: `${domain}/contact`,
    },
  };
}

export default function ContactLayout({ children }) {
  return children;
}
