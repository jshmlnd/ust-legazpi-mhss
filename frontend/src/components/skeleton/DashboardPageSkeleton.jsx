import SkeletonAvatar from './SkeletonAvatar';
import SkeletonCard from './SkeletonCard';

const DashboardPageSkeleton = ({ className = '' }) => (
  <main className={`min-h-screen bg-neutral-50 pt-[calc(68px+2rem)] pb-20 px-6 lg:px-10 ${className}`}>
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10" aria-hidden="true">
        <div className="space-y-2">
          <div className="skeleton h-8 w-72" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-5 w-28" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-sm overflow-hidden mb-8" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} variant="metric" />
        ))}
      </div>

      <div className="mb-8" aria-hidden="true">
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px flex-1 bg-neutral-200" />
          <div className="skeleton h-3 w-28" />
          <span className="h-px flex-1 bg-neutral-200" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-neutral-200 rounded-sm overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white">
              <div className="px-6 pt-6 pb-2 space-y-2">
                <div className="skeleton h-3 w-32" />
                <div className="skeleton h-4 w-40" />
              </div>
              <div className="px-2 pb-4 h-64 flex items-end px-6">
                <div className="flex-1 space-y-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="flex items-end gap-2">
                      <div className="skeleton h-3 w-8" />
                      <div className="skeleton h-4 flex-1 rounded-sm" style={{ height: `${12 + Math.random() * 48}px` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-neutral-200 rounded-sm overflow-hidden" aria-hidden="true">
        <div className="lg:col-span-2 bg-white">
          <div className="px-6 pt-6 pb-3 flex items-center justify-between">
            <div className="space-y-2">
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-4 w-28" />
            </div>
            <div className="skeleton h-4 w-12" />
          </div>
          <div className="overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 border-t border-neutral-100 flex items-center gap-4">
                <SkeletonAvatar size="sm" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-24" />
                  <div className="skeleton h-3 w-32" />
                </div>
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white p-6 space-y-5">
          <div className="space-y-2">
            <div className="skeleton h-3 w-28" />
            <div className="skeleton h-4 w-36" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-3 w-8" />
              </div>
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
);

export default DashboardPageSkeleton;
