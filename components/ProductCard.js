import Link from 'next/link';
import Image from 'next/image';

export default function ProductCard({ product }) {
  const src = product.image || '/uploads/placeholder.svg';
  return (
    <Link href={`/products/${product.id}`} className="card group block">
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center">
        <Image
          src={src}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="text-gray-900 font-medium">{product.name}</h3>
        {product.summary && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.summary}</p>
        )}
        {product.price > 0 && (
          <p className="mt-2 text-gray-900 font-semibold">NT$ {Number(product.price).toLocaleString()}</p>
        )}
      </div>
    </Link>
  );
}
