/**
 * Icon-only button. `label` is required (aria-label) — no ambiguous
 * icon-only controls without an accessible name.
 */
const IconButton = ({ icon: Icon, label, size = 16, tone = 'default', className = '', ...rest }) => {
  const tones = {
    default: 'text-ink-muted hover:text-ink hover:bg-line',
    brand: 'text-brand-soft-ink hover:bg-brand-soft dark:hover:bg-brand-soft/60',
    danger: 'text-danger-ink hover:bg-danger-soft',
    onDark: 'text-side-ink-soft hover:text-side-ink hover:bg-side-hover',
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center size-9 shrink-0 rounded-md
        transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none
        ${tones[tone]} ${className}`}
      {...rest}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  );
};

export default IconButton;
