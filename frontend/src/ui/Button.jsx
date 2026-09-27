import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-brand-600 text-brand-fg hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600/40 disabled:text-brand-fg/70 shadow-e1',
  secondary:
    'bg-surface text-ink border border-line-strong hover:border-ink-muted hover:bg-canvas active:bg-line disabled:opacity-50 disabled:pointer-events-none',
  tertiary:
    'bg-transparent text-brand-soft-ink hover:bg-brand-soft active:bg-brand-100 disabled:opacity-50 disabled:pointer-events-none dark:hover:bg-brand-soft/60',
  destructive:
    'bg-danger text-white hover:bg-danger/90 active:bg-danger/80 disabled:opacity-50 disabled:pointer-events-none',
  'danger-outline':
    'bg-transparent text-danger-ink border border-danger/40 hover:bg-danger-soft active:bg-danger/20 disabled:opacity-50 disabled:pointer-events-none',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  children,
  className = '',
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-medium whitespace-nowrap
      transition-colors duration-150 select-none
      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600
      disabled:cursor-not-allowed
      ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...rest}
  >
    {loading ? (
      <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin shrink-0" aria-hidden="true" />
    ) : (
      Icon && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" aria-hidden="true" />
    )}
    {children}
    {!loading && IconRight && <IconRight size={size === 'sm' ? 14 : 16} className="shrink-0" aria-hidden="true" />}
  </button>
);

export default Button;
