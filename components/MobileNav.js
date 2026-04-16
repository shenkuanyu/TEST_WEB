'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav({ links = [], locale = 'zh' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <>
      {/* 漢堡按鈕 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="開啟選單"
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded border border-gray-300 text-gray-700"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 全螢幕遮罩 + 抽屜（用同一個 fixed 容器包起來） */}
      {open && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
          className="md:hidden"
        >
          {/* 半透明黑底 */}
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setOpen(false)}
          />

          {/* 白色抽屜面板 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '80%',
              maxWidth: '320px',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 頂部標題 */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#b81762', fontWeight: 'bold', fontSize: '18px' }}>
                  {locale === 'en' ? 'Jeouyang' : '久洋機械'}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '0.2em' }}>SINCE 1994</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="關閉選單"
                style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#6b7280', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            {/* 導覽連結 */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
              {links.map(l => {
                const isActive = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      marginBottom: '4px',
                      color: isActive ? '#b81762' : '#374151',
                      backgroundColor: isActive ? 'rgba(184,23,98,0.08)' : 'transparent',
                    }}
                  >
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      backgroundColor: isActive ? '#b81762' : '#d1d5db',
                    }} />
                    {l.label}
                  </Link>
                );
              })}
            </nav>

            {/* 底部詢價按鈕 */}
            <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="btn-primary"
                style={{ display: 'block', textAlign: 'center', width: '100%' }}
              >
                {locale === 'en' ? 'Contact Us' : '立即詢價'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
