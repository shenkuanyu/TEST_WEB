'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductSearch({ placeholder = '搜尋產品名稱或型號…' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const timerRef = useRef(null);
  const router = useRouter();

  // 點擊外部關閉
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v);

    // debounce search
    clearTimeout(timerRef.current);
    if (v.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products/search?q=${encodeURIComponent(v.trim())}`);
        const data = await r.json();
        setResults(data.products || []);
        setOpen(true);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  }

  function goTo(id) {
    setOpen(false);
    setQuery('');
    router.push(`/products/${id}`);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 搜尋結果下拉 */}
      {open && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">找不到相關產品</div>
          ) : (
            results.map(p => (
              <button
                key={p.id}
                onClick={() => goTo(p.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0"
              >
                {p.image ? (
                  <img src={p.image} alt="" className="w-12 h-12 rounded object-contain bg-gray-100 shrink-0" loading="lazy" />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {p.name || p.name_en}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {p.model_code && <span className="text-brand font-mono">{p.model_code}</span>}
                    {(p.category_name || p.category_name_en) && (
                      <span>{p.category_name || p.category_name_en}</span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
