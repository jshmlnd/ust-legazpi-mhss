import { toast } from 'react-toastify';

/**
 * confirmAction — promise-based confirmation rendered as a toast.
 * Resolves true/false. Used for destructive or sign-out actions.
 */
export const confirmAction = ({
  title = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
}) =>
  new Promise((resolve) => {
    toast(({ closeToast }) => (
      <div className="flex flex-col gap-3 py-1">
        <span className="text-sm text-ink">{title}</span>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => { closeToast(); resolve(false); }}
            className="px-3 py-1.5 text-xs font-medium text-ink-soft border border-line-strong rounded-md
              hover:bg-line transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { closeToast(); resolve(true); }}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors ${
              danger ? 'bg-danger hover:bg-danger/90' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ), { autoClose: false, closeOnClick: false, draggable: false, closeButton: false });
  });
