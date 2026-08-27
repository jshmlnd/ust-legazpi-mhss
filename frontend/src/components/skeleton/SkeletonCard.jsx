import SkeletonAvatar from './SkeletonAvatar';

const SkeletonCard = ({ variant = 'default', className = '' }) => {
  if (variant === 'content') {
    return (
      <div className={`bg-white border border-neutral-200 rounded-sm p-5 space-y-4 ${className}`} aria-hidden="true">
        <div className="flex items-start gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-3 w-1/4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === 'metric') {
    return (
      <div className={`bg-white px-6 py-6 ${className}`} aria-hidden="true">
        <div className="skeleton h-3 w-20 mb-3" />
        <div className="skeleton h-8 w-16 mb-2" />
        <div className="skeleton h-3 w-24" />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-neutral-200 rounded-sm overflow-hidden ${className}`} aria-hidden="true">
      <div className="skeleton h-32 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-12 rounded-full" />
        </div>
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-8 w-20 rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
