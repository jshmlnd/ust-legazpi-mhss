import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

/**
 * e3 elevation modal: scrim + centered panel, ESC + scrim-click to close,
 * scroll lock, ARIA dialog semantics. Focus moves into the panel on open
 * (unless a child auto-focused, e.g. a PIN input) and returns to the
 * previously focused element on close.
 *
 * Focus and key handling are separate effects on purpose: pages pass an
 * inline `onClose` whose identity changes on every parent render (e.g.
 * while typing in a modal form). Keydown re-subscription is harmless, but
 * re-running focus logic would steal focus from the field being typed in.
 */
const Modal = ({ isOpen, onClose, title, description, children, footer, wide = false }) => {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Focus management — only on open/close transitions.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement;
    if (panelRef.current && !panelRef.current.contains(document.activeElement)) {
      panelRef.current.focus();
    }
    return () => {
      const el = previouslyFocusedRef.current;
      if (el instanceof HTMLElement) el.focus();
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  // Scroll lock + ESC to close.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[8vh] pb-10 px-4 sm:px-6 animate-fade-in">
      <div className="absolute inset-0 bg-ink/45" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[84vh] flex flex-col bg-raised border border-line
          rounded-xl shadow-e3 animate-modal-in focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div className="px-4 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
