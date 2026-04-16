'use client';
import { useState } from 'react';

/**
 * 前台產品內頁的分頁切換元件（產品介紹 / 規格 / 配備 / 影片）
 */
export default function ProductTabs({ descriptionHtml, specsHtml, accessories, videoId, videoUrl, productName, isEn }) {
  const tabs = [];

  if (descriptionHtml) tabs.push({ id: 'intro', label: isEn ? 'Introduction' : '產品介紹' });
  if (specsHtml) tabs.push({ id: 'specs', label: isEn ? 'Specifications' : '產品規格' });
  if (accessories) tabs.push({ id: 'equip', label: isEn ? 'Equipment' : '配備清單' });
  if (videoId) tabs.push({ id: 'video', label: isEn ? 'Video' : '產品影片' });

  const [active, setActive] = useState(tabs[0]?.id || 'intro');

  if (!tabs.length) return null;

  return (
    <section className="mt-16">
      {/* Tab 導覽列 */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-6 py-3 text-base font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              active === t.id
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 內容 */}
      {active === 'intro' && descriptionHtml && (
        <div className="product-content" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      )}

      {active === 'specs' && specsHtml && (
        <div className="product-content product-specs" dangerouslySetInnerHTML={{ __html: specsHtml }} />
      )}

      {active === 'equip' && accessories}

      {active === 'video' && videoId && (
        <div>
          <div className="flex items-center justify-end mb-3">
            <a href={videoUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-brand">
              {isEn ? 'Watch on YouTube' : '在 YouTube 觀看'} ↗
            </a>
          </div>
          <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-4xl mx-auto">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={productName}
            />
          </div>
        </div>
      )}
    </section>
  );
}
