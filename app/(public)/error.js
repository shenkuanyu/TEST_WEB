'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * 前台公開頁面的錯誤邊界。任何 server / client throw 都會 fallback 到此。
 * 提供雙語訊息與「重試 / 回首頁 / 聯絡我們」三個出口。
 */
export default function PublicError({ error, reset }) {
  useEffect(() => {
    // 把錯誤輸出到 console,方便開發/排錯
    if (error) console.error('[public error boundary]', error);
  }, [error]);

  // 從 cookie 判斷語系(client side 不能用 next/headers)
  const isEn = typeof document !== 'undefined' && document.cookie.includes('locale=en');

  const t = isEn ? {
    title: 'Something went wrong',
    desc: 'An unexpected error occurred while loading this page. Please try again, or return to the homepage.',
    retry: 'Try again',
    home: 'Back to home',
    contact: 'Contact us',
  } : {
    title: '糟糕,發生了一點錯誤',
    desc: '載入這個頁面時遇到意外狀況。請稍候重試,或回到首頁。',
    retry: '重新載入',
    home: '回到首頁',
    contact: '聯絡我們',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6 max-w-lg">
        <div className="mb-4 inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-3">{t.title}</h2>
        <p className="text-gray-500 mb-8">{t.desc}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition font-medium"
          >
            {t.retry}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-brand hover:text-brand transition font-medium"
          >
            {t.home}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-brand hover:text-brand transition font-medium"
          >
            {t.contact}
          </Link>
        </div>
      </div>
    </div>
  );
}
