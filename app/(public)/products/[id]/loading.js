export default function Loading() {
  return (
    <div className="container py-16">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-20 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-200 rounded w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
