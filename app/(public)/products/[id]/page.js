import { getDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductGallery from '@/components/ProductGallery';
import ProductTabs from '@/components/ProductTabs';
import { mdToHtml } from '@/lib/markdown';
import { getLocale, pickI18n } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const db = getDB();
  const locale = getLocale();
  const site = getSiteMeta();
  const p = db.prepare('SELECT * FROM products WHERE id=? AND published=1').get(Number(params.id));
  if (!p) return {};
  const name = pickI18n(p, 'name', locale);
  const summary = pickI18n(p, 'summary', locale);
  const isEn = locale === 'en';
  const brandPrefix = site.code === 'machines' ? 'POSHTECH | ' : 'Jeouyang | ';
  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  // 取得分類名稱作為關鍵字
  let catName = '';
  if (p.category_id) {
    const cat = db.prepare('SELECT name, name_en FROM categories WHERE id=?').get(p.category_id);
    if (cat) catName = isEn && cat.name_en ? cat.name_en : cat.name;
  }

  const baseKeywords = site.code === 'machines'
    ? 'POSHTECH, 久洋機械, CNC, machining center, 加工中心, Taiwan'
    : 'POSHTECH, 久洋零組件, 工具機零件, machine tool parts, Taiwan';
  const productKeywords = [name, p.model_code, catName].filter(Boolean).join(', ');

  const descFallback = isEn
    ? `${name}${p.model_code ? ` (${p.model_code})` : ''} — ${site.code === 'machines' ? 'POSHTECH CNC machining center, manufactured in Taiwan' : 'Jeouyang precision machine tool component'}`
    : `${name}${p.model_code ? ` (${p.model_code})` : ''} — ${site.code === 'machines' ? '久洋機械 POSHTECH 台灣製造 CNC 加工中心' : '久洋零組件 高品質工具機零件'}`;

  return {
    title: `${brandPrefix}${name}${p.model_code ? ` ${p.model_code}` : ''}`,
    description: summary || descFallback,
    keywords: `${productKeywords}, ${baseKeywords}`,
    alternates: {
      canonical: `${domain}/products/${params.id}`,
    },
    robots: { index: false, follow: false },
    openGraph: {
      title: `${brandPrefix}${name}`,
      description: summary || descFallback,
      images: p.image ? [`${domain}${p.image}`] : undefined,
      type: 'website',
      url: `${domain}/products/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandPrefix}${name}`,
      description: summary || descFallback,
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

function FileTypeIcon({ filename }) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const size = 36;

  // PDF 圖示
  if (ext === 'pdf') return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#E53935" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#EF5350" />
      <path d="M22 6v8h8" fill="#E53935" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">PDF</text>
    </svg>
  );

  // Word 圖示
  if (['doc', 'docx'].includes(ext)) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#1565C0" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#1E88E5" />
      <path d="M22 6v8h8" fill="#1565C0" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">DOC</text>
    </svg>
  );

  // Excel 圖示
  if (['xls', 'xlsx', 'csv'].includes(ext)) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#2E7D32" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#43A047" />
      <path d="M22 6v8h8" fill="#2E7D32" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">XLS</text>
    </svg>
  );

  // CAD 圖示（DWG / DXF / STEP / STP / IGES / IGS）
  if (['dwg', 'dxf', 'step', 'stp', 'iges', 'igs', 'sat', 'x_t', 'x_b', '3dm'].includes(ext)) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#F57C00" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#FB8C00" />
      <path d="M22 6v8h8" fill="#F57C00" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">CAD</text>
    </svg>
  );

  // 圖片圖示
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#7B1FA2" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#9C27B0" />
      <path d="M22 6v8h8" fill="#7B1FA2" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">IMG</text>
    </svg>
  );

  // ZIP / RAR 壓縮檔
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#455A64" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#607D8B" />
      <path d="M22 6v8h8" fill="#455A64" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">ZIP</text>
    </svg>
  );

  // 通用檔案圖示
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="2" width="32" height="36" rx="3" fill="#78909C" />
      <path d="M12 6h10l8 8v20a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#90A4AE" />
      <path d="M22 6v8h8" fill="#78909C" />
      <text x="20" y="29" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="bold" fontFamily="Arial">FILE</text>
    </svg>
  );
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

  const domain = site.code === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  // 產品層級 Schema.org（含 offers 以符合 Google 要求）
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.summary || product.description,
    sku: product.model_code || undefined,
    image: images.length ? images.map(i => `${domain}${i.image}`) : (product.image ? [`${domain}${product.image}`] : []),
    url: `${domain}/products/${id}`,
    brand: {
      '@type': 'Brand',
      name: site.code === 'machines' ? 'POSHTECH' : 'Jeouyang',
    },
    manufacturer: { '@id': 'https://jeouyang.com.tw/#organization' },
    category: product.category_name,
    offers: {
      '@type': 'Offer',
      url: `${domain}/products/${id}`,
      priceCurrency: 'TWD',
      price: Number(product.price) > 0 ? Number(product.price) : undefined,
      availability: 'https://schema.org/InStock',
      seller: { '@id': 'https://jeouyang.com.tw/#organization' },
      // B2B 產品若無標價，使用 priceSpecification 表示「請洽詢」
      ...(Number(product.price) <= 0 ? {
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'TWD',
          price: '0',
          description: isEn ? 'Contact us for pricing' : '歡迎來電詢價',
        },
      } : {}),
    },
  };

  // 麵包屑結構化資料 — 幫助 Google 搜尋結果顯示導覽路徑
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : '首頁', item: domain },
      { '@type': 'ListItem', position: 2, name: isEn ? 'Products' : '產品資訊', item: `${domain}/products` },
      ...(product.category_name ? [{
        '@type': 'ListItem', position: 3,
        name: product.category_name,
        item: `${domain}/products?cat=${product.category_id}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: product.category_name ? 4 : 3,
        name: product.name,
        item: `${domain}/products/${id}`,
      },
    ],
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
                    <a key={d.id} href={d.file_path} target="_blank" rel="noreferrer" download
                       className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:border-brand hover:bg-gray-50 transition group">
                      <FileTypeIcon filename={d.file_path || d.label} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-brand truncate">{d.label}</div>
                        <div className="text-xs text-gray-500">
                          {(d.file_path || '').split('.').pop().toUpperCase()}
                          {d.file_size ? ` · ${fmtSize(d.file_size)}` : ''}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
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

        {/* 分頁切換：產品介紹 / 規格 / 配備 / 影片 */}
        <ProductTabs
          descriptionHtml={product.description ? mdToHtml(product.description) : null}
          specsHtml={product.specs_md ? mdToHtml(product.specs_md) : null}
          accessories={
            (stdAccessories.length > 0 || optAccessories.length > 0 || applications.length > 0) ? (
              <div>
                {applications.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-light mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                      {isEn ? 'Applications' : '適用產業'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {applications.map((app, i) => (
                        <span key={i} className="px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-medium">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
              </div>
            ) : null
          }
          videoId={videoId}
          videoUrl={product.video_url}
          productName={product.name}
          isEn={isEn}
        />

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
        {/* 麵包屑結構化資料 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </div>
    </div>
  );
}
