import Link from 'next/link';
import { cookies } from 'next/headers';

export default function NotFound() {
  // Server component 用 cookies() 讀 locale
  const isEn = cookies().get('locale')?.value === 'en';

  const t = isEn ? {
    title: 'Page Not Found',
    desc: 'The page you are looking for may have been moved, renamed, or temporarily unavailable.',
    home: 'Back to home',
    products: 'Browse products',
    contact: 'Contact us',
  } : {
    title: '找不到此頁面',
    desc: '您要找的頁面可能已被移除、名稱已變更,或暫時無法使用。',
    home: '回到首頁',
    products: '瀏覽產品',
    contact: '聯絡我們',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        {/* 大大的 404 */}
        <h1 className="text-8xl md:text-9xl font-bold text-gray-200 select-none">404</h1>

        <div className="mt-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-3">{t.title}</h2>
          <p className="text-gray-500 max-w-md mx-auto">{t.desc}</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t.home}
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-brand hover:text-brand transition font-medium"
          >
            {t.products}
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
