import SkeletonCard from './SkeletonCard';
import SkeletonText from './SkeletonText';

const PageShellSkeleton = ({ columns, count, showCalendar = false, showSidebar = false, className = '' }) => (
  <main className={`min-h-screen bg-neutral-50 pt-12 pb-20 px-6 lg:px-10 ${className}`}>
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10" aria-hidden="true">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>
        <div className="skeleton h-9 w-28 rounded-sm" />
      </div>

      {showCalendar && (
        <div className="mb-8 bg-white border border-neutral-200 rounded-sm p-5" aria-hidden="true">
          <div className="skeleton h-4 w-20 mb-4" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-full" />
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="skeleton h-8 w-full rounded-sm" />
            ))}
          </div>
        </div>
      )}

      {showSidebar ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4" aria-hidden="true">
            <div className="skeleton h-4 w-32" />
            {Array.from({ length: count || 3 }).map((_, i) => (
              <SkeletonCard key={i} variant="content" />
            ))}
          </div>
          <div className="space-y-4" aria-hidden="true">
            <div className="skeleton h-4 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} variant="content" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-px bg-neutral-200 rounded-sm overflow-hidden" aria-hidden="true">
          {Array.from({ length: count || 4 }).map((_, i) => (
            <SkeletonCard key={i} variant="content" />
          ))}
        </div>
      )}
    </div>
  </main>
);

export default PageShellSkeleton;
