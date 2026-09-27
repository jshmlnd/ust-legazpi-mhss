import { useEffect, useRef } from 'react';

/**
 * PinInput — 6-digit OTP-style PIN entry as individual masked boxes.
 *
 * The PIN value is always left-packed: typing/pasting fills from the first
 * box, deleting shifts digits down. Supports paste (full or partial), typing
 * into a filled box (replaces just that digit), auto-advance on type,
 * Backspace deletes the digit before the caret when a box is empty, and
 * Arrow keys move between boxes.
 *
 * Fully controlled: pass `value` (digits only) and receive updates through
 * `onChange`. Accessibility: each box is labeled via `label` ("digit n"),
 * error state sets aria-invalid on every box, and the group is announced
 * with the provided `ariaLabel`.
 */
const PinInput = ({
  value,
  onChange,
  length = 6,
  error = false,
  disabled = false,
  autoFocus = false,
  onComplete,
  label = 'PIN',
  ariaLabel = 'PIN digits',
  className = '',
}) => {
  const refs = useRef([]);

  const digits = (value || '').toString().replace(/\D/g, '').slice(0, length);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focusBox = (i) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  const handleChange = (index, raw) => {
    const typed = raw.replace(/\D/g, '');
    if (!typed) {
      // Cleared the visible digit — remove it and shift the tail left.
      onChange(digits.slice(0, index) + digits.slice(index + 1));
      return;
    }
    // Replace the digit(s) at `index`, keeping any digits after the insertion.
    const next = (digits.slice(0, index) + typed + digits.slice(index + typed.length)).slice(0, length);
    onChange(next);
    focusBox(Math.max(next.length, index));
    if (onComplete && next.length === length) onComplete(next);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        // Remove the digit in this box and shift the tail left.
        onChange(digits.slice(0, index) + digits.slice(index + 1));
      } else if (index > 0) {
        onChange(digits.slice(0, index - 1) + digits.slice(index));
        focusBox(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index, e) => {
    const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    const next = (digits.slice(0, index) + pasted + digits.slice(index + pasted.length)).slice(0, length);
    onChange(next);
    focusBox(next.length);
    if (onComplete && next.length === length) onComplete(next);
  };

  const boxClass = (isError) =>
    'h-12 w-full rounded-lg border bg-surface text-center text-lg font-semibold text-ink ' +
    'outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ' +
    'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 ' +
    (isError ? 'border-danger' : 'border-line-strong');

  return (
    <div
      className={`grid gap-2 ${className}`}
      style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
      role="group"
      aria-label={ariaLabel}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          value={digits[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`${label} digit ${i + 1}`}
          aria-invalid={error || undefined}
          disabled={disabled}
          className={boxClass(error)}
        />
      ))}
    </div>
  );
};

export default PinInput;
