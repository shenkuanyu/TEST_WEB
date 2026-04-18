import Link from 'next/link';

export default function ProductCard({ product }) {
  return (
    <Link href={`/products/${product.id}`} className="card group block">
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center">
        <img
          src={product.image || '/uploads/placeholder.svg'}
          alt={product.name}
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-500"
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
