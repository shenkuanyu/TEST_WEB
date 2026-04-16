'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav({ links = [], locale = 'zh', member = null, labels = {} }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 路由變更時自動關閉
  useEffect(() => { setOpen(false); }, [pathname]);

  // 開啟抽屜時鎖捲動
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      {/* 漢堡按鈕（只在 <md 顯示） */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="開啟選單"
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded border border-gray-300 text-gray-700 hover:text-brand hover:border-brand"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 抽屜背景遮罩 */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* 側邊抽屜 */}
      <div
        className={`fixed right-0 top-0 h-full w-[80%] max-w-xs bg-white shadow-2xl z-[60] md:hidden transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 頂部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="leading-tight">
            <div className="text-brand font-bold text-lg">
              {locale === 'en' ? 'Jeouyang' : '久洋機械'}
            </div>
            <div className="text-[10px] text-gray-400 tracking-[0.2em]">SINCE 1994</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="關閉選單"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* 導覽連結 */}
        <nav className="px-2 py-4">
          {links.map(l => {
            const isActive = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium transition mb-1 ${
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand' : 'bg-gray-300'}`} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* 底部：詢價按鈕 */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-gray-200 bg-white">
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="btn-primary w-full !justify-center"
          >
            {locale === 'en' ? 'Contact Us' : '立即詢價'}
          </Link>
        </div>
      </div>
    </>
  );
}
