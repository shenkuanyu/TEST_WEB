'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomeProductCarousel({ products = [] }) {
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const singleSetWidthRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const offset = useRef(0);

  // 速度：每幀移動的 px 數（越小越慢）
  const speed = 0.5;

  /** 點箭頭快速跳一張卡 */
  function scrollBy(dir) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 16 : 396;
    offset.current += dir * step;
    const sw = singleSetWidthRef.current;
    if (sw > 0) {
      if (offset.current >= sw) offset.current -= sw;
      if (offset.current < 0) offset.current += sw;
    }
    track.style.transition = 'transform 0.4s ease';
    track.style.transform = `translateX(-${offset.current}px)`;
    setTimeout(() => { if (track) track.style.transition = ''; }, 420);
  }

  useEffect(() => {
    if (products.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    // 取得一組卡片的總寬度（含 gap）
    const cards = track.querySelectorAll('[data-card]');
    if (!cards.length) return;
    const totalCards = products.length;
    // 一組的寬度 = 所有原始卡片寬度 + gap
    let singleSetWidth = 0;
    for (let i = 0; i < totalCards; i++) {
      singleSetWidth += cards[i].offsetWidth + 16; // 16 = gap-4
    }
    singleSetWidthRef.current = singleSetWidth;

    function animate() {
      if (!paused) {
        offset.current += speed;
        // 當滾過一整組，回到起點（無縫）
        if (offset.current >= singleSetWidth) {
          offset.current -= singleSetWidth;
        }
        track.style.transform = `translateX(-${offset.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [products.length, paused]);

  if (!products.length) return null;

  // 複製 3 組確保畫面填滿
  const items = [...products, ...products, ...products];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex gap-4 will-change-transform"
        style={{ width: 'max-content' }}
      >
        {items.map((p, i) => (
          <Link
            key={`${p.id}-${i}`}
            data-card
            href={`/products/${p.id}`}
            className="group relative shrink-0 w-[280px] md:w-[380px] aspect-[4/3] overflow-hidden rounded-sm bg-gray-200"
          >
            <img
              src={p.image || '/uploads/placeholder.svg'}
              alt={p.name}
              className="absolute inset-0 w-full h-full object-contain group-hover:scale-110 transition duration-700"
              draggable={false}
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

      {/* 左右箭頭 */}
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
