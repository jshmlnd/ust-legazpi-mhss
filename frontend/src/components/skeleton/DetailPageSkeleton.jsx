import SkeletonText from './SkeletonText';
import SkeletonAvatar from './SkeletonAvatar';

const DetailPageSkeleton = ({ className = '' }) => (
  <main className={`min-h-screen bg-neutral-50 pt-12 pb-20 px-6 lg:px-10 ${className}`}>
    <div className="mx-auto max-w-[1440px]">
      <div className="flex items-center gap-2 mb-6" aria-hidden="true">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-4" />
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-3 w-4" />
        <div className="skeleton h-3 w-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="skeleton h-64 md:h-80 w-full rounded-sm" />

          <div className="space-y-3" aria-hidden="true">
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-5 w-16 rounded-full" />
              ))}
            </div>
            <div className="skeleton h-8 w-3/4" />
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="sm" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-2.5 w-32" />
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-6" aria-hidden="true">
            <SkeletonText lines={8} />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-4" aria-hidden="true">
            <div className="skeleton h-4 w-28" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonAvatar size="md" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-t border-neutral-100">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-3 w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-sm p-5 space-y-3" aria-hidden="true">
            <div className="skeleton h-4 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="skeleton size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </main>
);

export default DetailPageSkeleton;
