import { KeyRound, Loader } from 'lucide-react';
import { PinInput } from '../../ui';

const TotpModal = ({
  isOpen,
  onClose,
  totpPhase,
  qrDataUrl,
  totpSecret,
  totpToken,
  setTotpToken,
  setTotpError,
  totpError,
  savingTotp,
  confirmTotpSetup,
  authUser,
  disableWithPin,
  setDisableWithPin,
  confirmTotpDisable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-side/40 px-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Two-factor authentication" className="relative bg-surface rounded-lg p-6 w-full max-w-sm">
        {totpPhase === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader size={20} className="animate-spin text-ink-muted" />
            <p className="text-xs text-ink-muted">Generating your secret…</p>
          </div>
        ) : totpPhase === 'qr' ? (
          <>
            <h4 className="text-sm font-medium text-ink mb-1">Set up authenticator app</h4>
            <p className="text-xs text-ink-muted mb-4">
              Scan the QR code with Google Authenticator, Authy, or any TOTP app. Can't scan?
              Enter this key manually:
            </p>
            <div className="flex justify-center mb-3">
              {qrDataUrl
                ? <img src={qrDataUrl} alt="Authenticator QR code" width={220} height={220} className="rounded-lg border border-line" />
                : <Loader size={20} className="animate-spin" />}
            </div>
            <div className="bg-canvas rounded-lg px-3 py-2 mb-4">
              <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-0.5">Manual entry key</p>
              <p className="text-xs font-mono text-ink break-all select-all">{totpSecret}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Enter the 6-digit code to confirm</label>
              <PinInput
                value={totpToken}
                onChange={(v) => { setTotpToken(v); setTotpError(null); }}
                error={!!totpError}
                autoFocus
                ariaLabel="Authenticator code digits"
              />
            </div>
            {totpError && <p className="text-xs text-danger mt-2">{totpError}</p>}
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-xs font-semibold text-ink-soft bg-line hover:bg-line transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTotpSetup}
                disabled={savingTotp || totpToken.length !== 6}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                {savingTotp ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
                Confirm & enable
              </button>
            </div>
          </>
        ) : (
          <>
            <h4 className="text-sm font-medium text-ink mb-1">Disable authenticator app</h4>
            <p className="text-xs text-ink-muted mb-4">
              Enter the current 6-digit code from your authenticator app to turn off TOTP 2FA
              {authUser?.hasPin ? ', or use your PIN instead.' : '.'}
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">
                {disableWithPin ? 'Account PIN' : 'Authenticator code'}
              </label>
              <PinInput
                key={disableWithPin ? 'pin' : 'totp'}
                value={totpToken}
                onChange={(v) => { setTotpToken(v); setTotpError(null); }}
                error={!!totpError}
                autoFocus
                ariaLabel={disableWithPin ? 'PIN digits' : 'Authenticator code digits'}
              />
            </div>
            {authUser?.hasPin && (
              <button
                type="button"
                onClick={() => { setDisableWithPin((v) => !v); setTotpToken(''); setTotpError(null); }}
                className="text-xs font-medium text-ink-muted hover:text-ink transition-colors mt-2"
              >
                {disableWithPin ? 'Use authenticator code instead' : 'Use PIN instead'}
              </button>
            )}
            {totpError && <p className="text-xs text-danger mt-2">{totpError}</p>}
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-xs font-semibold text-ink-soft bg-line hover:bg-line transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTotpDisable}
                disabled={savingTotp || totpToken.length < 4}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-danger hover:bg-danger/90 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg"
              >
                {savingTotp ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
                Disable
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TotpModal;
