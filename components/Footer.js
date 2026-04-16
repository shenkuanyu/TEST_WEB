import Link from 'next/link';
import { getAllSettings } from '@/lib/settings';
import { getLocale } from '@/lib/i18n';

export default function Footer() {
  const s = getAllSettings();
  const locale = getLocale();
  const isEn = locale === 'en';

  // 依語系挑 settings 內的欄位
  const val = (zhKey, enKey) => (isEn && s[enKey] ? s[enKey] : s[zhKey]) || '';

  const siteName = val('site_name', 'site_name_en') || 'Jeouyang Machinery Co., Ltd.';
  const slogan = val('site_slogan', 'site_slogan_en');
  const address = val('contact_address', 'contact_address_en');
  const hours = val('contact_hours', 'contact_hours_en');

  const L = isEn ? {
    nav: 'Navigation',
    home: 'Home',
    about: 'About',
    products: 'Products',
    news: 'News',
    contact: 'Contact',
    info: 'Contact Info',
    addressLabel: 'Address',
    hoursLabel: 'Hours',
    login: 'Sign In',
    register: 'Sign Up',
    admin: 'Admin',
  } : {
    nav: '網站導覽',
    home: '首頁',
    about: '公司介紹',
    products: '產品資訊',
    news: '最新消息',
    contact: '聯絡我們',
    info: '聯絡資訊',
    addressLabel: '地址',
    hoursLabel: '營業時間',
    login: '會員登入',
    register: '加入會員',
    admin: '後台入口',
  };

  const socials = [
    { key: 'social_facebook', label: 'Facebook', url: s.social_facebook, icon: '📘' },
    { key: 'social_line', label: 'LINE', url: s.social_line, icon: '💬' },
    { key: 'social_instagram', label: 'Instagram', url: s.social_instagram, icon: '📷' },
    { key: 'social_youtube', label: 'YouTube', url: s.social_youtube, icon: '▶️' },
    {
      key: 'social_whatsapp',
      label: 'WhatsApp',
      url: s.social_whatsapp ? `https://wa.me/${String(s.social_whatsapp).replace(/[^\d]/g, '')}` : '',
      icon: '📱',
    },
  ].filter(x => x.url);

  return (
    <footer className="mt-24 bg-gray-900 text-gray-300">
      <div className="container py-14 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
        <div className="md:col-span-1">
          <div className="text-lg font-bold text-white mb-3">{siteName}</div>
          <div className="text-xs tracking-widest text-brand mb-3">since {s.founded_year || '1994'}</div>
          <p className="text-gray-400 leading-relaxed">{slogan}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2 flex-wrap">
              {socials.map(ss => (
                <a key={ss.key} href={ss.url} target="_blank" rel="noopener noreferrer" title={ss.label}
                   className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-brand rounded transition">
                  <span className="text-base">{ss.icon}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold text-white mb-3">{L.nav}</div>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/" className="hover:text-white">{L.home}</Link></li>
            <li><Link href="/about" className="hover:text-white">{L.about}</Link></li>
            <li><Link href="/products" className="hover:text-white">{L.products}</Link></li>
            <li><Link href="/news" className="hover:text-white">{L.news}</Link></li>
            <li><Link href="/contact" className="hover:text-white">{L.contact}</Link></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <div className="font-semibold text-white mb-3">{L.info}</div>
          <div className="space-y-1.5 text-gray-400">
            <p>{L.addressLabel}：{address}</p>
            <p>TEL：<a href={`tel:${s.contact_phone}`} className="hover:text-white">{s.contact_phone}</a></p>
            {s.contact_fax && <p>FAX：{s.contact_fax}</p>}
            <p>E-mail：<a href={`mailto:${s.contact_email}`} className="hover:text-white">{s.contact_email}</a></p>
            {hours && <p>{L.hoursLabel}：{hours}</p>}
          </div>
          <div className="mt-5 text-xs">
            <Link href="/login" className="text-gray-500 hover:text-white mr-4">{L.login}</Link>
            <Link href="/register" className="text-gray-500 hover:text-white mr-4">{L.register}</Link>
            <Link href="/admin/login" className="text-gray-600 hover:text-white">{L.admin}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        Copyright © {new Date().getFullYear()} {siteName} All Rights Reserved.
      </div>
    </footer>
  );
}
