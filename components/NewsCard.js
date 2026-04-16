import Link from 'next/link';

export default function NewsCard({ item }) {
  const date = item.created_at?.slice(0, 10);
  return (
    <Link href={`/news/${item.id}`} className="card group block">
      <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
        <img
          src={item.cover_image || '/uploads/placeholder.svg'}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
      </div>
      <div className="p-4">
        <p className="text-xs tracking-widest text-gray-400">{date}</p>
        <h3 className="text-gray-900 font-medium mt-2 line-clamp-2">{item.title}</h3>
        {item.summary && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.summary}</p>}
      </div>
    </Link>
  );
}
