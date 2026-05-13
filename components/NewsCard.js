import Link from 'next/link';
import Image from 'next/image';

export default function NewsCard({ item }) {
  const date = item.created_at?.slice(0, 10);
  const src = item.cover_image || '/uploads/placeholder.svg';
  return (
    <Link href={`/news/${item.id}`} className="card group block">
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
        <Image
          src={src}
          alt={item.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
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
