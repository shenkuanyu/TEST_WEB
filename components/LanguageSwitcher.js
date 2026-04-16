'use client';
import { useEffect, useRef, useState } from 'react';

export default function LanguageSwitcher({ locale = 'zh' }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // 點擊外部關閉
  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function pick(l) {
    // 存 cookie（有效期 1 年）
    document.cookie = `locale=${l};path=/;max-age=31536000;SameSite=Lax`;
    setOpen(false);
    window.location.reload();
  }

  const label = locale === 'en' ? 'EN' : '繁中';

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:text-brand hover:border-brand transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* 地球 icon */}
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span>{label}</span>
        <svg className={`w-3 h-3 transition ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-lg overflow-hidden z-50"
        >
          <button
            onClick={() => pick('zh')}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${locale === 'zh' ? 'text-brand font-semibold bg-red-50' : 'text-gray-700'}`}
          >
            繁體中文
            {locale === 'zh' && <span>✓</span>}
          </button>
          <button
            onClick={() => pick('en')}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${locale === 'en' ? 'text-brand font-semibold bg-red-50' : 'text-gray-700'}`}
          >
            ENGLISH
            {locale === 'en' && <span>✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
