import ProductCard from '@/components/ProductCard';
import { getDB } from '@/lib/db';
import Link from 'next/link';
import { getLocale, pickI18n } from '@/lib/i18n';
import { getSiteMeta } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata() {
  const site = getSiteMeta();
  const locale = getLocale();
  const isEn = locale === 'en';
  const brand = site.code === 'machines' ? 'POSHTECH | ' : '';
  const domain = site.code === 'machines'
    ? 'https://machines.poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';
  return {
    title: isEn
      ? `${brand}Products — ${site.brand_en}`
      : `產品資訊 — ${site.brand_zh}`,
    description: isEn ? site.seo_description_en : site.seo_description_zh,
    alternates: {
      canonical: `${domain}/products`,
    },
    openGraph: {
      title: isEn
        ? `${brand}Products — ${site.brand_en}`
        : `產品資訊 — ${site.brand_zh}`,
      description: isEn ? site.seo_description_en : site.seo_description_zh,
      url: `${domain}/products`,
    },
  };
}

export default function ProductsPage({ searchParams }) {
  const db = getDB();
  const locale = getLocale();
  const isEn = locale === 'en';
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const cat = searchParams?.cat ? Number(searchParams.cat) : null;

  const sql = cat
    ? 'SELECT * FROM products WHERE published=1 AND category_id=? ORDER BY sort_order, id DESC'
    : 'SELECT * FROM products WHERE published=1 ORDER BY sort_order, id DESC';
  const raw = cat ? db.prepare(sql).all(cat) : db.prepare(sql).all();

  const products = raw.map(p => ({
    ...p,
    name: pickI18n(p, 'name', locale),
    summary: pickI18n(p, 'summary', locale),
  }));

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container text-center">
          <p className="section-sub mb-3">PRODUCTS</p>
          <h1 className="section-title">{isEn ? 'Products' : '產品資訊'}</h1>
        </div>
      </section>

      <section className="container py-12">
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Link href="/products" className={`px-4 py-1.5 rounded-full text-sm ${!cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {isEn ? 'All' : '全部'}
          </Link>
          {cats.map(c => (
            <Link
              key={c.id}
              href={`/products?cat=${c.id}`}
              className={`px-4 py-1.5 rounded-full text-sm ${cat === c.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {isEn && c.name_en ? c.name_en : c.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-center text-gray-400 py-20">{isEn ? 'No products yet' : '目前尚無產品'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
