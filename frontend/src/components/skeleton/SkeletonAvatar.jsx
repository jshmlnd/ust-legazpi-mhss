const SIZES = {
  xs: 'size-6',
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
};

const SkeletonAvatar = ({ size = 'md', shape = 'circle', className = '' }) => (
  <div
    className={`skeleton shrink-0 ${SIZES[size] || SIZES.md} ${
      shape === 'circle' ? 'rounded-full' : 'rounded-sm'
    } ${className}`}
    aria-hidden="true"
  />
);

export default SkeletonAvatar;
