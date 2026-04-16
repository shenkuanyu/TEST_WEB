'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeroCarousel({ banners = [] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!banners.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) {
    return (
      <div className="bg-gray-100 h-[40vh] md:h-[60vh] flex items-center justify-center text-gray-400">
        尚未新增輪播圖，請至後台新增。
      </div>
    );
  }

  return (
    <section className="relative w-full h-[50vh] md:h-[60vh] min-h-[320px] overflow-hidden bg-gray-100">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={b.image} alt={b.title || ''} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-8 lg:px-16">
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-brand font-semibold mb-2 md:mb-3">{b.subtitle}</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-light text-white max-w-2xl leading-tight drop-shadow">
              {b.title}
            </h2>
            {b.link_url && (
              <Link href={b.link_url} className="btn-primary mt-4 md:mt-6 w-fit !px-4 md:!px-5 !py-2 md:!py-2.5 text-sm md:text-base">
                了解更多
              </Link>
            )}
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`slide-${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 md:w-10 bg-brand' : 'w-2.5 md:w-3 bg-white/70'}`}
          />
        ))}
      </div>
    </section>
  );
}
