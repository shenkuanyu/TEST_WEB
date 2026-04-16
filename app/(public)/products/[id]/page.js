import { getDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductGallery from '@/components/ProductGallery';
import { mdToHtml } from '@/lib/markdown';
import { getLocale, pickI18n } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const db = getDB();
  const locale = getLocale();
  const site = getSiteMeta();
  const p = db.prepare('SELECT * FROM products WHERE id=? AND published=1').get(Number(params.id));
  if (!p) return {};
  const name = pickI18n(p, 'name', locale);
  const summary = pickI18n(p, 'summary', locale);
  const brandPrefix = site.code === 'machines' ? 'POSHTECH | ' : '';
  return {
    title: `${brandPrefix}${name}`,
    description: summary || `${name} — ${site.code === 'machines' ? 'POSHTECH CNC machining center' : 'Jeouyang machine tool component'}`,
    openGraph: {
      title: `${brandPrefix}${name}`,
      description: summary,
      images: p.image ? [p.image] : undefined,
    },
  };
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function parseFeatures(raw) {
  if (!raw) return [];
  try {
    const a = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(a) ? a : [];
  } catch {
    return String(raw).split('\n').map(s => s.trim()).filter(Boolean);
  }
}
function fmtSize(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function ProductDetail({ params }) {
  const db = getDB();
  const id = Number(params.id);
  const locale = getLocale();
  const site = getSiteMeta();
  const isEn = locale === 'en';

  const raw = db.prepare(`
    SELECT p.*, c.name AS category_name, c.name_en AS category_name_en
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id=? AND p.published=1
  `).get(id);
  if (!raw) notFound();

  // 套用 i18n：從 _en 欄位挑英文、否則回中文
  const product = {
    ...raw,
    name:         pickI18n(raw, 'name',        locale),
    summary:      pickI18n(raw, 'summary',     locale),
    description:  pickI18n(raw, 'description', locale),
    specs_md:     pickI18n(raw, 'specs_md',    locale),
    features:     isEn && raw.features_en ? raw.features_en : raw.features,
    applications: isEn && raw.applications_en ? raw.applications_en : raw.applications,
    standard_accessories: isEn && raw.standard_accessories_en ? raw.standard_accessories_en : raw.standard_accessories,
    optional_accessories: isEn && raw.optional_accessories_en ? raw.optional_accessories_en : raw.optional_accessories,
    category_name: isEn && raw.category_name_en ? raw.category_name_en : raw.category_name,
  };

  const images = db.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY sort_order, id').all(id);
  const downloads = db.prepare('SELECT * FROM product_downloads WHERE product_id=? ORDER BY sort_order, id').all(id);
  const features = parseFeatures(product.features);
  const applications = parseFeatures(product.applications);
  const stdAccessories = parseFeatures(product.standard_accessories);
  const optAccessories = parseFeatures(product.optional_accessories);
  const videoId = extractYouTubeId(product.video_url);

  // 產品層級 Schema.org
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary || product.description,
    sku: product.model_code || undefined,
    image: images.length ? images.map(i => i.image) : (product.image ? [product.image] : []),
    brand: {
      '@type': 'Brand',
      name: site.code === 'machines' ? 'POSHTECH' : 'Jeouyang',
    },
    manufacturer: { '@id': 'https://jeouyang.com.tw/#organization' },
    category: product.category_name,
  };

  const galleryImages = images.length
    ? images
    : (product.image ? [{ id: 0, image: product.image, caption: product.name }] : []);

  const related = db.prepare(`
    SELECT id, name, name_en, model_code, image, summary, summary_en
      FROM products
     WHERE category_id=? AND id<>? AND published=1
     ORDER BY sort_order, id DESC
     LIMIT 3
  `).all(product.category_id, id);

  return (
    <div>
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-brand">產品資訊</Link>
          {product.category_name && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/products?cat=${product.category_id}`} className="hover:text-brand">{product.category_name}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.name}</span>
        </div>
      </div>

      <div className="container py-10 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          <ProductGallery images={galleryImages} />

          <div>
            {product.model_code && (
              <p className="inline-block px-3 py-1 text-xs font-semibold tracking-widest bg-brand/10 text-brand rounded mb-3">
                {product.model_code}
              </p>
            )}
            {product.category_name && (
              <p className="section-sub mb-2">{product.category_name}</p>
            )}
            <h1 className="text-3xl md:text-4xl font-light mb-3 leading-tight">{product.name}</h1>
            {product.summary && (
              <p className="text-base md:text-lg text-gray-600 mb-6 leading-relaxed">{product.summary}</p>
            )}

            {Number(product.price) > 0 && (
              <p className="text-2xl font-semibold text-brand mb-6">
                NT$ {Number(product.price).toLocaleString()}
              </p>
            )}

            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded">
                    <span className="text-brand">✓</span>
                    {f}
                  </span>
                ))}
              </div>
            )}

            {downloads.length > 0 && (
              <div className="border-t pt-5 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📥</span> 產品型錄 / 規格書下載
                </p>
                <div className="space-y-2">
                  {downloads.map(d => (
                    <a key={d.id} href={d.file_path} target="_blank" rel="noreferrer"
                       className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:border-brand hover:bg-gray-50 transition group">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-brand truncate">{d.label}</div>
                        <div className="text-xs text-gray-500">{fmtSize(d.file_size)}</div>
                      </div>
                      <span className="text-brand">↓</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link href={`/contact?product=${encodeURIComponent(product.name)}`} className="btn-primary">產品詢價</Link>
              <Link href="/products" className="btn-outline">繼續瀏覽</Link>
            </div>
          </div>
        </div>

        {videoId && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-light">產品影片</h2>
              <a href={product.video_url} target="_blank" rel="noreferrer" className="text-sm text-gray-500 hover:text-brand">在 YouTube 觀看 ↗</a>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-4xl mx-auto">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={product.name}
              />
            </div>
          </section>
        )}

        <section className="mt-16 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-light mb-5 pb-3 border-b border-gray-200">
              {isEn ? 'Product Introduction' : '產品介紹'}
            </h2>
            {product.description ? (
              <div className="md-content text-gray-700" dangerouslySetInnerHTML={{ __html: mdToHtml(product.description) }} />
            ) : (
              <p className="text-gray-500 whitespace-pre-line leading-relaxed">
                {isEn ? '(No description yet)' : '（暫無詳細介紹）'}
              </p>
            )}

            {/* 適用產業 */}
            {applications.length > 0 && (
              <>
                <h3 className="text-xl font-light mt-10 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                  <span>🎯</span> {isEn ? 'Applications' : '適用產業'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {applications.map((app, i) => (
                    <span key={i} className="px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-medium">
                      {app}
                    </span>
                  ))}
                </div>
              </>
            )}

            {/* 標配 + 選配 配備 */}
            {(stdAccessories.length > 0 || optAccessories.length > 0) && (
              <>
                <h3 className="text-xl font-light mt-10 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                  <span>🔧</span> {isEn ? 'Equipment & Accessories' : '配備清單'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {stdAccessories.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        {isEn ? 'Standard Accessories' : '標準配備'}
                      </h4>
                      <ul className="space-y-1.5 text-sm text-gray-700">
                        {stdAccessories.map((a, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {optAccessories.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand rounded-full" />
                        {isEn ? 'Optional Accessories' : '選購配備'}
                      </h4>
                      <ul className="space-y-1.5 text-sm text-gray-700">
                        {optAccessories.map((a, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-brand mt-0.5">＋</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {product.specs_md && (
              <>
                <h2 className="text-2xl font-light mt-10 mb-5 pb-3 border-b border-gray-200">
                  {isEn ? 'Specifications' : '規格'}
                </h2>
                <div className="md-content text-gray-700" dangerouslySetInnerHTML={{ __html: mdToHtml(product.specs_md) }} />
              </>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg sticky top-28">
              <h3 className="text-sm font-semibold tracking-widest text-gray-500 mb-4">QUICK INFO</h3>
              <dl className="space-y-3 text-sm">
                {product.model_code && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <dt className="text-gray-500">型號</dt>
                    <dd className="font-medium font-mono">{product.model_code}</dd>
                  </div>
                )}
                {product.category_name && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <dt className="text-gray-500">分類</dt>
                    <dd className="font-medium">{product.category_name}</dd>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-gray-500">圖片數</dt>
                  <dd className="font-medium">{galleryImages.length}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <dt className="text-gray-500">下載檔</dt>
                  <dd className="font-medium">{downloads.length}</dd>
                </div>
              </dl>
              <Link href={`/contact?product=${encodeURIComponent(product.name)}`} className="btn-primary w-full !justify-center mt-5">
                立即詢價
              </Link>
            </div>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-200">
            <h2 className="text-2xl font-light mb-6">相關產品</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {related.map(r => {
                const rName = pickI18n(r, 'name', locale);
                const rSummary = pickI18n(r, 'summary', locale);
                return (
                <Link key={r.id} href={`/products/${r.id}`} className="card group block">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={r.image || '/uploads/placeholder.svg'} alt={rName} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-4">
                    {r.model_code && <p className="text-xs font-mono text-brand mb-1">{r.model_code}</p>}
                    <h3 className="text-gray-900 font-medium">{rName}</h3>
                    {rSummary && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{rSummary}</p>}
                  </div>
                </Link>
              );
            })}
            </div>
          </section>
        )}

        {/* 產品層級 Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      </div>
    </div>
  );
}
