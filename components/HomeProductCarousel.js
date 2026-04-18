'use client';
import { useRef } from 'react';
import Link from 'next/link';

export default function HomeProductCarousel({ products = [] }) {
  const scroller = useRef(null);

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 16 : 320;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((p) => (
          <Link
            key={p.id}
            data-card
            href={`/products/${p.id}`}
            className="group relative shrink-0 w-[280px] md:w-[380px] aspect-[4/3] overflow-hidden rounded-sm snap-start bg-gray-200"
          >
            <img
              src={p.image || '/uploads/placeholder.svg'}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div>
                <div className="text-white text-lg md:text-xl font-semibold tracking-wider">{p.name}</div>
                {p.summary && (
                  <div className="text-white/70 text-xs mt-1 line-clamp-1">{p.summary}</div>
                )}
              </div>
              <div className="w-10 h-10 rounded-full border border-white/70 flex items-center justify-center text-white group-hover:bg-brand group-hover:border-brand transition shrink-0">
                →
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* 左右按鈕 */}
      <button
        onClick={() => scrollBy(-1)}
        aria-label="prev"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white border border-gray-200 rounded-full items-center justify-center text-xl text-gray-600 hover:bg-brand hover:text-white hover:border-brand transition shadow"
      >
        ‹
      </button>
      <button
        onClick={() => scrollBy(1)}
        aria-label="next"
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white border border-gray-200 rounded-full items-center justify-center text-xl text-gray-600 hover:bg-brand hover:text-white hover:border-brand transition shadow"
      >
        ›
      </button>
    </div>
  );
}
