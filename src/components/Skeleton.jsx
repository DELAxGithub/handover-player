export function Skeleton({ className = '' }) {
  return (
    <div className={`skeleton rounded ${className}`} />
  );
}

export function CommentSkeleton() {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-full h-3 mb-1.5" />
      <Skeleton className="w-3/4 h-3" />
    </div>
  );
}

export function CommentListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}
