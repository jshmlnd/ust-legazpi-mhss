import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

/* ── shared field wrapper: label + control + helper/error ── */

export const Field = ({ label, htmlFor, required, error, helper, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink">
        {label}
        {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-danger-ink" role="alert">{error}</p>
    ) : helper ? (
      <p className="text-xs text-ink-muted">{helper}</p>
    ) : null}
  </div>
);

const CONTROL_BASE =
  'w-full rounded-lg border bg-surface text-sm text-ink placeholder:text-ink-muted ' +
  'transition-colors duration-150 outline-none ' +
  'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';
const STATE = (error) => (error ? 'border-danger' : 'border-line-strong');
const PAD = 'px-3 py-2.5';

/* ── text input ── */

export const Input = forwardRef(function Input(
  { label, error, helper, required, className = '', id, ...rest }, ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} required={required} error={error} helper={helper} className={className}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        className={`${CONTROL_BASE} ${STATE(error)} ${PAD}`}
        {...rest}
      />
    </Field>
  );
});

/* ── textarea ── */

/* Literal class strings so Tailwind's scanner generates each variant. */
const RESIZE_CLASSES = { none: 'resize-none', y: 'resize-y', x: 'resize-x', both: 'resize-both' };

export const Textarea = forwardRef(function Textarea(
  { label, error, helper, required, rows = 3, resize = 'none', className = '', id, ...rest }, ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} required={required} error={error} helper={helper} className={className}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error || undefined}
        className={`${CONTROL_BASE} ${STATE(error)} ${PAD} ${RESIZE_CLASSES[resize] ?? RESIZE_CLASSES.none}`}
        {...rest}
      />
    </Field>
  );
});

/* ── select ── */

export const Select = forwardRef(function Select(
  { label, error, helper, required, options = [], placeholder, className = '', id, children, ...rest }, ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} htmlFor={inputId} required={required} error={error} helper={helper} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          className={`${CONTROL_BASE} ${STATE(error)} ${PAD} appearance-none pr-9`}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) =>
            typeof opt === 'object'
              ? <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
              : <option key={opt} value={opt}>{opt}</option>,
          )}
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
});

/* ── checkbox ── */

export const Checkbox = ({ label, description, error, className = '', id, ...rest }) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input
        id={inputId}
        type="checkbox"
        aria-invalid={!!error || undefined}
        className="mt-0.5 size-4 rounded border-line-strong text-brand-600 accent-[rgb(var(--c-brand-600))] focus:ring-2 focus:ring-brand-600/30 cursor-pointer"
        {...rest}
      />
      {(label || description) && (
        <label htmlFor={inputId} className="cursor-pointer">
          {label && <span className="block text-sm font-medium text-ink">{label}</span>}
          {description && <span className="block text-xs text-ink-muted mt-0.5">{description}</span>}
        </label>
      )}
    </div>
  );
};

/* ── radio ── */

export const Radio = ({ label, description, className = '', id, ...rest }) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input
        id={inputId}
        type="radio"
        className="mt-0.5 size-4 border-line-strong text-brand-600 accent-[rgb(var(--c-brand-600))] focus:ring-2 focus:ring-brand-600/30 cursor-pointer"
        {...rest}
      />
      {(label || description) && (
        <label htmlFor={inputId} className="cursor-pointer">
          {label && <span className="block text-sm font-medium text-ink">{label}</span>}
          {description && <span className="block text-xs text-ink-muted mt-0.5">{description}</span>}
        </label>
      )}
    </div>
  );
};

/* ── toggle switch ── */

export const Toggle = ({ label, description, checked, onChange, disabled, ariaLabel, className = '', id }) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      {(label || description) && (
        <div>
          {label && <label htmlFor={inputId} className="block text-sm font-medium text-ink cursor-pointer">{label}</label>}
          {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
        </div>
      )}
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={!!checked}
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
          transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600
          disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
          ${checked ? 'bg-brand-600' : 'bg-line-strong'}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-4.5 w-[18px] h-[18px] rounded-full bg-white shadow-e1
            transition-transform duration-200 ${checked ? 'translate-x-[24px]' : 'translate-x-[3px]'}`}
        />
      </button>
    </div>
  );
};

/* ── standalone label (for custom controls) ── */

export const FieldLabel = ({ children, required }) => (
  <span className="block text-xs font-medium text-ink mb-1.5">
    {children}
    {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
  </span>
);
