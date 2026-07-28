const SkeletonText = ({ lines = 3, className = '', width }) => (
  <div className={`space-y-2.5 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`skeleton h-3.5 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        style={i === 0 && width ? { width } : undefined}
      />
    ))}
  </div>
);

export default SkeletonText;
