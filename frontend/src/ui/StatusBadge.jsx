/**
 * StatusBadge — semantic status pill. Maps common app statuses to tones,
 * or pass tone explicitly: brand | success | warning | danger | info | neutral.
 */
const MAP = {
  // appointment / session statuses
  pending: 'warning',
  awaiting: 'warning',
  confirmed: 'success',
  approved: 'success',
  active: 'success',
  'on-going': 'success',
  ongoing: 'success',
  paused: 'info',
  completed: 'neutral',
  ended: 'neutral',
  archived: 'neutral',
  cancelled: 'neutral',
  canceled: 'neutral',
  declined: 'danger',
  expired: 'danger',

  // generic tones
  brand: 'brand',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

const TONES = {
  brand: 'bg-brand-soft text-brand-soft-ink border-brand-200',
  success: 'bg-success-soft text-success-ink border-success/25',
  warning: 'bg-warning-soft text-warning-ink border-warning/25',
  danger: 'bg-danger-soft text-danger-ink border-danger/25',
  info: 'bg-info-soft text-info-ink border-info/25',
  neutral: 'bg-line text-ink-soft border-line',
};

const StatusBadge = ({ status, tone, children, className = '' }) => {
  const resolved = tone || MAP[String(status).toLowerCase()] || 'neutral';
  const dot = { brand: 'bg-brand-500', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info', neutral: 'bg-ink-muted' }[resolved];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium
        border rounded-full capitalize ${TONES[resolved]} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {children ?? status}
    </span>
  );
};

export default StatusBadge;
