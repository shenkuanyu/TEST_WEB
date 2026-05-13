'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * 後台的錯誤邊界。後台只給中文管理員使用,所以不做 i18n。
 */
export default function AdminError({ error, reset }) {
  useEffect(() => {
    if (error) console.error('[admin error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="mb-4 inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">後台發生錯誤</h2>
        <p className="text-gray-500 mb-2">{error?.message || '未知錯誤'}</p>
        <p className="text-xs text-gray-400 mb-6">
          如果反覆出現,請聯絡開發人員並提供以下 digest:
          <br />
          <code className="bg-gray-100 px-2 py-1 rounded">{error?.digest || 'N/A'}</code>
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition font-medium"
          >
            重新載入
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-brand hover:text-brand transition font-medium"
          >
            回到儀表板
          </Link>
        </div>
      </div>
    </div>
  );
}
