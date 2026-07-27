import SkeletonCard from './SkeletonCard';

const COL_CLASSES = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

const SkeletonGrid = ({ columns = 3, count = 6, variant = 'default', className = '' }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-2 ${COL_CLASSES[columns] || 'lg:grid-cols-3'} gap-6 ${className}`}
    aria-hidden="true"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} variant={variant} />
    ))}
  </div>
);

export default SkeletonGrid;
