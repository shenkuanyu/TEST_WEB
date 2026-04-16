'use client';
import { useState } from 'react';

/**
 * 產品圖片相簿：左側主圖 + 右側 / 底部縮圖
 * @param {Array} images 每張物件：{ id, image, caption }
 */
export default function ProductGallery({ images = [], fallback = '/uploads/placeholder.svg' }) {
  const list = images.length ? images : [{ id: 0, image: fallback, caption: '' }];
  const [idx, setIdx] = useState(0);
  const current = list[idx] || list[0];

  return (
    <div>
      {/* 主圖 */}
      <div className="relative bg-gray-100 overflow-hidden rounded-lg flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '600px' }}>
        <img
          src={current.image}
          alt={current.caption || ''}
          className="max-w-full max-h-[600px] object-contain"
        />
        {list.length > 1 && (
          <>
            <button
              onClick={() => setIdx((idx - 1 + list.length) % list.length)}
              aria-label="上一張"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center text-xl shadow"
            >‹</button>
            <button
              onClick={() => setIdx((idx + 1) % list.length)}
              aria-label="下一張"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center text-xl shadow"
            >›</button>
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
              {idx + 1} / {list.length}
            </div>
          </>
        )}
      </div>

      {/* 縮圖列 */}
      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {list.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setIdx(i)}
              className={`aspect-square overflow-hidden rounded border-2 transition ${
                idx === i ? 'border-brand' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.image} alt="" className="w-full h-full object-contain bg-gray-50" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
