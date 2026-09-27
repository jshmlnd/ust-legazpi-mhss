const Spinner = ({ size = 20, className = '' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-2 border-line border-t-brand-600 ${className}`}
    style={{ width: size, height: size }}
  />
);

export default Spinner;
