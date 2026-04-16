export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-brand rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">載入中...</p>
      </div>
    </div>
  );
}
