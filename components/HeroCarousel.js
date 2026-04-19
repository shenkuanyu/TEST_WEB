'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/** 解析 "50% 30% 1.2" → { pos, scale } */
function parseImagePos(str) {
  if (!str) return { pos: 'center', scale: 1 };
  const parts = str.replace(/%/g, '').trim().split(/\s+/);
  const x = parts[0] || '50';
  const y = parts[1] || '50';
  const scale = Number(parts[2]) || 1;
  return { pos: `${x}% ${y}%`, scale };
}

export default function HeroCarousel({ banners = [] }) {
  const [idx, setIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  // 自動輪播
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  // 手機滑動切換
  const handleTouchStart = useCallback((e) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setIdx(i => (i + 1) % banners.length);
      } else {
        setIdx(i => (i - 1 + banners.length) % banners.length);
      }
    }
    setTouchStart(null);
  }, [touchStart, banners.length]);

  if (!banners.length) {
    return (
      <div className="bg-gray-100 h-[40vh] md:h-[60vh] flex items-center justify-center text-gray-400">
        尚未新增輪播圖，請至後台新增。
      </div>
    );
  }

  return (
    <section
      className="relative w-full aspect-[16/10] sm:aspect-[16/8] md:aspect-[16/7] overflow-hidden bg-gray-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={b.image}
            alt={b.title || ''}
            className="w-full h-full object-cover"
            style={{
              objectPosition: parseImagePos(b.image_position).pos,
              transform: parseImagePos(b.image_position).scale !== 1
                ? `scale(${parseImagePos(b.image_position).scale})`
                : undefined,
            }}
            draggable={false}
          />
          {/* 漸層遮罩：手機用由下往上，桌機用由左往右 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/30 md:to-transparent" />

          {/* 文字內容 */}
          <div className="absolute inset-0 flex flex-col justify-end pb-16 sm:pb-20 md:justify-center md:pb-0 px-5 md:px-8 lg:px-16">
            {b.subtitle && (
              <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.3em] uppercase text-brand font-semibold mb-1.5 md:mb-3">
                {b.subtitle}
              </p>
            )}
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-white max-w-2xl leading-snug drop-shadow-lg">
              {b.title}
            </h2>
            {b.link_url && (
              <Link
                href={b.link_url}
                className="btn-primary mt-3 md:mt-6 w-fit !px-4 md:!px-5 !py-2 md:!py-2.5 text-xs sm:text-sm md:text-base"
              >
                了解更多
              </Link>
            )}
          </div>
        </div>
      ))}

      {/* 輪播指示器 */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`slide-${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? 'w-8 md:w-10 bg-brand' : 'w-2.5 md:w-3 bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
