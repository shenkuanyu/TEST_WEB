import { getDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NewsDetail({ params }) {
  const db = getDB();
  const item = db.prepare('SELECT * FROM news WHERE id=? AND published=1').get(Number(params.id));
  if (!item) notFound();

  return (
    <div className="container py-16 max-w-3xl">
      <Link href="/news" className="text-sm text-gray-500 hover:text-black">← 返回消息列表</Link>
      <article className="mt-6">
        <p className="text-xs tracking-widest text-gray-400">{item.created_at?.slice(0, 10)}</p>
        <h1 className="text-3xl md:text-4xl font-light mt-3 mb-6">{item.title}</h1>
        {item.cover_image && (
          <img src={item.cover_image} alt={item.title} className="w-full rounded-lg mb-8" />
        )}
        <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-loose">
          {item.content}
        </div>
      </article>
    </div>
  );
}
