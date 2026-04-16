import Link from 'next/link';
import { getMemberSession } from '@/lib/auth';
import { getLocale, t } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';
import LanguageSwitcher from './LanguageSwitcher';
import MobileNav from './MobileNav';

export default async function Navbar() {
  const member = await getMemberSession();
  const locale = getLocale();
  const site = getSiteMeta();
  const isMachines = site.code === 'machines';

  const labels = {
    home: t('nav.home', locale),
    about: t('nav.about', locale),
    products: t('nav.products', locale),
    news: t('nav.news', locale),
    contact: t('nav.contact', locale),
    login: t('nav.login', locale),
    register: t('nav.register', locale),
    logout: t('nav.logout', locale),
  };

  const links = [
    { href: '/', label: labels.home },
    { href: '/about', label: labels.about },
    { href: '/products', label: labels.products },
    { href: '/news', label: labels.news },
    { href: '/contact', label: labels.contact },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="w-full px-4 md:px-6 lg:px-10 flex items-center justify-between gap-3 md:gap-6 h-16 md:h-24">

        {/* ===== 左：LOGO ===== */}
        <Link href="/" className="flex items-center gap-2 md:gap-4 shrink-0 min-w-0">
          <img
            src="/uploads/logo.png"
            alt="久洋機械"
            className="h-8 md:h-14 w-auto object-contain shrink-0"
          />
          {/* 公司名：手機/小螢幕隱藏；中型以上才顯示 */}
          <div className="hidden lg:block leading-tight min-w-0">
            <div className="text-brand font-bold text-xl xl:text-2xl tracking-wider truncate">
              {locale === 'en' ? 'Jeouyang Machinery Co., Ltd.' : '久洋機械股份有限公司'}
            </div>
            <div className="text-xs xl:text-sm text-gray-500 tracking-[0.25em] mt-0.5 truncate">
              {locale === 'en' ? 'JEOUYANG MACHINERY · POSHTECH' : 'JEOUYANG MACHINERY'}
            </div>
          </div>
          <div className="hidden md:block lg:hidden leading-tight min-w-0">
            <div className="text-brand font-bold text-base tracking-wider truncate">
              {locale === 'en' ? 'Jeouyang' : '久洋機械'}
            </div>
            <div className="text-[10px] text-gray-500 tracking-widest truncate">
              SINCE 1994
            </div>
          </div>
        </Link>

        {/* ===== 中：主選單（僅 ≥md 顯示） ===== */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-sm lg:text-base text-gray-700 flex-1 justify-center">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-brand transition font-medium whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ===== 右：語言 + 登入註冊（≥md）/ 漢堡（<md） ===== */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <LanguageSwitcher locale={locale} />

          {/* 桌機顯示 */}
          <div className="hidden md:flex items-center gap-3">
            {member ? (
              <>
                <span className="text-gray-500 hidden xl:inline text-sm">Hi, {member.email}</span>
                <form action="/api/auth/logout" method="POST">
                  <button className="text-gray-600 hover:text-brand text-sm">{labels.logout}</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-brand text-sm lg:text-base whitespace-nowrap">
                  {labels.login}
                </Link>
                <Link href="/register" className="btn-primary !px-3 lg:!px-5 !py-2 text-sm lg:text-base whitespace-nowrap">
                  {labels.register}
                </Link>
              </>
            )}
          </div>

          {/* 手機顯示：漢堡選單 */}
          <MobileNav
            links={links}
            locale={locale}
            member={member ? { email: member.email } : null}
            labels={labels}
          />
        </div>
      </div>
    </header>
  );
}
