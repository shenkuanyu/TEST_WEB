import NewsCard from '@/components/NewsCard';
import { getDB } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: '最新消息' };

export default function NewsPage() {
  const db = getDB();
  const news = db.prepare('SELECT * FROM news WHERE published=1 ORDER BY id DESC').all();

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container text-center">
          <p className="section-sub mb-3">NEWS</p>
          <h1 className="section-title">最新消息</h1>
        </div>
      </section>
      <section className="container py-12">
        {news.length === 0 ? (
          <p className="text-center text-gray-400 py-20">目前尚無消息</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map(n => <NewsCard key={n.id} item={n} />)}
          </div>
        )}
      </section>
    </div>
  );
}
