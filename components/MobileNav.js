'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MobileNav({ links = [], locale = 'zh', member = null, labels = {} }) {
  const [open, setOpen] = useState(false);

  // 開啟抽屜時鎖捲動
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
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

      {/* 抽屜 */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? '' : 'pointer-events-none'}`}>
        {/* 黑色遮罩 */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${open ? 'opacity-50' : 'opacity-0'}`}
        />
        {/* 側邊抽屜內容 */}
        <aside
          className={`absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* 頂部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="leading-tight">
              <div className="text-brand font-bold text-lg">
                {locale === 'en' ? 'Jeouyang Machinery' : '久洋機械'}
              </div>
              <div className="text-xs text-gray-400 tracking-widest">
                SINCE 1994
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="關閉選單"
              className="w-10 h-10 rounded text-gray-500 hover:text-brand"
            >
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* 選單項 */}
          <nav className="flex-1 overflow-y-auto py-3">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-lg text-gray-800 hover:bg-gray-50 hover:text-brand border-b border-gray-100 last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* 底部：會員 */}
          <div className="border-t p-5 space-y-3">
            {member ? (
              <>
                <p className="text-sm text-gray-500">Hi, {member.email}</p>
                <form action="/api/auth/logout" method="POST">
                  <button className="btn-outline w-full">{labels.logout || '登出'}</button>
                </form>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn-outline w-full !justify-center"
                >
                  {labels.login || '登入'}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full !justify-center"
                >
                  {labels.register || '註冊'}
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
