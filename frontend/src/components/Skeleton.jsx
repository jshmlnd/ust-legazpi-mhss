const Skeleton = ({ className = "", count = 1, circle = false }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-neutral-200 ${
            circle ? "rounded-full" : "rounded-sm"
          } ${className}`}
        />
      ))}
    </>
  );
};

export const SkeletonCard = () => (
  <div className="bg-white border border-neutral-200 rounded-sm p-6">
    <Skeleton className="h-4 w-1/3 mb-4" />
    <Skeleton className="h-8 w-1/2 mb-2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white border border-neutral-200 rounded-sm">
    <div className="px-6 pt-6 pb-3">
      <Skeleton className="h-4 w-1/4 mb-2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <div className="px-6 pb-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-t border-neutral-100">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" circle />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonPage = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-1/2" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-sm overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white px-6 py-6">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    <SkeletonTable rows={4} />
  </div>
);

export default Skeleton;
