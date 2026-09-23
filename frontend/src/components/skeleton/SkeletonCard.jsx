import SkeletonAvatar from './SkeletonAvatar';

const SkeletonCard = ({ className = '' }) => (
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

export default SkeletonCard;
