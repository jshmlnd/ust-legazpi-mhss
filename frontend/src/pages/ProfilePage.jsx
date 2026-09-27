import { useState, useEffect } from 'react';
import { Shield, Mail, Hash, Building2, BookOpen, Eye, EyeOff, Check, X, Loader, Pencil, KeyRound, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import { usePrefs } from '../lib/prefs';
import PageShell from '../ui/PageShell';
import { Toggle, PinInput } from '../ui';
import SectionDivider from '../components/SectionDivider';
import AvatarUpload from '../components/AvatarUpload';
import { toast } from 'react-toastify';

const StrengthBar = ({ score }) => {
  const levels = [
    { label: 'Weak', color: 'bg-danger-soft0', width: '25%', textColor: 'text-danger-ink' },
    { label: 'Fair', color: 'bg-orange-500', width: '50%', textColor: 'text-orange-600' },
    { label: 'Good', color: 'bg-warning-soft0', width: '75%', textColor: 'text-warning-ink' },
    { label: 'Strong', color: 'bg-brand-soft0', width: '100%', textColor: 'text-brand-soft-ink' },
  ];
  const level = levels[Math.min(score, 3)];

  return (
    <div>
      <div className="h-1 bg-line rounded-full overflow-hidden mt-1.5">
        <div className={`h-full rounded-full transition-all duration-500 ${level.color}`} style={{ width: level.width }} />
      </div>
      <p className={`text-xs font-medium mt-1 ${level.textColor}`}>{level.label} password</p>
    </div>
  );
};

const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const ValidationRule = ({ passes, label }) => (
  <div className={`flex items-center gap-2 text-xs ${passes ? 'text-brand-soft-ink' : 'text-ink-muted'}`}>
    {passes ? <Check size={12} /> : <X size={12} />}
    {label}
  </div>
);

const SecurityCard = ({ onGoToPreferences }) => {
  const { authUser } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [hasPin, setHasPin] = useState(!!authUser?.pin);
  const totpOn = !!authUser?.totpEnabled;
  const twoFAEnabled = !!authUser?.twoFactorEnabled;
  // A second factor (authenticator app, PIN 2FA, or a plain PIN) gates the
  // password form until verified. TOTP-only accounts verify with a code.
  const needsVerification = hasPin || twoFAEnabled || totpOn;
  // Modes: 'setup' | 'verify' | 'change-verify' | 'change-set' | 'remove-verify'
  const [pinMode, setPinMode] = useState(needsVerification ? 'verify' : 'setup');
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);

  // Render-time adjustment (avoids setState-in-effect): when the account's
  // PIN existence changes externally (e.g. 2FA toggled in Preferences while
  // this card is mounted), realign hasPin and the PIN mode during render.
  const [lastSeenPin, setLastSeenPin] = useState(!!authUser?.pin);
  if (lastSeenPin !== !!authUser?.pin) {
    const pinExists = !!authUser?.pin;
    setLastSeenPin(pinExists);
    setHasPin(pinExists);
    setPinMode((m) => {
      if (pinExists && m === 'setup') return 'verify';
      // No PIN left: drop to setup only when no other factor gates the form.
      if (!pinExists && m !== 'setup' && !totpOn && !twoFAEnabled) return 'setup';
      return m;
    });
  }

  // Password change is gated while any second factor is active (PIN 2FA or
  // authenticator app) until the user verifies it with the current code.
  const pinSatisfied = (!twoFAEnabled && !totpOn) || pinVerified;

  const strength = getPasswordStrength(form.newPassword);
  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;
  const hasMinLength = form.newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(form.newPassword);
  const hasNumber = /[0-9]/.test(form.newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.newPassword);

  const canSubmit = form.currentPassword.length > 0 && form.newPassword.length >= 8 && passwordsMatch && pinSatisfied;
  const isChangeSet = pinMode === 'change-set';
  const canSetPin = pinMode === 'setup' || isChangeSet
    ? pinValue.length >= 6 && pinValue === pinConfirm
    : pinValue.length >= 4; // verify modes: 4–6 digit PINs and 6-digit TOTP codes

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const resetPinInputs = () => { setPinValue(''); setPinConfirm(''); };

  const handleSetPin = async () => {
    setPinLoading(true);
    setStatus(null);
    try {
      await axiosInstance.post('/auth/pin', { pin: pinValue });
      setHasPin(true);
      useAuthStore.setState((s) => ({ authUser: s.authUser ? { ...s.authUser, pin: pinValue } : s.authUser }));
      setPinMode('verify');
      resetPinInputs();
      setStatus({ type: 'success', message: 'PIN set successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to set PIN.' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    setPinLoading(true);
    setStatus(null);
    try {
      // /auth/pin/verify accepts a TOTP code when the authenticator app is
      // enrolled (server-side precedence), otherwise the account PIN.
      await axiosInstance.post('/auth/pin/verify', { pin: pinValue });
      setPinVerified(true);
      setStatus({ type: 'success', message: 'Verified. You can now change your password.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to verify PIN.' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePinVerify = async () => {
    setPinLoading(true);
    setStatus(null);
    try {
      // PIN management always requires the actual PIN, never a TOTP code.
      await axiosInstance.post('/auth/pin/verify', { pin: pinValue, expect: 'pin' });
      setPinMode('change-set');
      resetPinInputs();
      setStatus({ type: 'success', message: 'Current PIN verified. Enter your new PIN below.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Incorrect PIN.' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleRemovePin = async () => {
    setPinLoading(true);
    setStatus(null);
    try {
      await axiosInstance.delete('/auth/pin', { data: { pin: pinValue } });
      setHasPin(false);
      useAuthStore.setState((s) => ({ authUser: s.authUser ? { ...s.authUser, pin: '', twoFactorEnabled: false } : s.authUser }));
      setPinMode('setup');
      resetPinInputs();
      setStatus({ type: 'success', message: 'PIN removed successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Incorrect PIN.' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setStatus(null);

    try {
      await axiosInstance.put('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setStatus({ type: 'success', message: 'Password updated successfully.' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPinVerified(false);
      setPinValue('');
      setPinMode('verify');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 pr-9 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors';

  const pinLabel = pinMode === 'setup'
    ? 'Set a PIN (required to change password)'
    : pinMode === 'verify'
      ? totpOn
        ? 'Enter the code from your authenticator app to unlock password change'
        : 'Enter your PIN to unlock password change'
      : pinMode === 'change-verify'
        ? totpOn
          ? 'Enter an authenticator code to authorize the change'
          : 'Enter current PIN to authorize change'
        : pinMode === 'remove-verify'
          ? 'Enter current PIN to remove PIN'
          : 'Set your new PIN';

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="size-9 rounded-lg bg-line flex items-center justify-center text-ink-muted">
          <Shield size={16} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink">Security Settings</h3>
          <p className="text-xs text-ink-muted">{(twoFAEnabled || totpOn) ? 'Verify your second factor, then change your password' : 'Change your password'}</p>
        </div>
      </div>

      {status && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-xs font-medium border ${
          status.type === 'success' ? 'bg-brand-soft text-brand-soft-ink border-brand-200' : 'bg-danger-soft text-danger-ink border-danger/30'
        }`}>
          {status.message}
        </div>
      )}

      {/* 2FA verification section — shown while any second factor gates the
          password form; accepts an authenticator code (TOTP) or the PIN. */}
      {((twoFAEnabled || hasPin || totpOn) && !pinVerified) && (
      <div className="mb-5 pb-5 border-b border-line">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={14} className="text-ink-muted" />
          <span className="text-xs font-semibold text-ink-muted">{pinLabel}</span>
        </div>

        {pinMode === 'setup' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSetPin(); }} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">New PIN</label>
              <PinInput value={pinValue} onChange={setPinValue} ariaLabel="New PIN digits" className="max-w-xs" />
              <p className="text-xs text-ink-muted">Use 4–6 digits.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">Confirm PIN</label>
              <PinInput value={pinConfirm} onChange={setPinConfirm} error={pinValue.length > 0 && pinValue !== pinConfirm} ariaLabel="Confirm PIN digits" className="max-w-xs" />
            </div>
            {pinValue.length > 0 && pinValue !== pinConfirm && <p className="text-xs text-danger">PINs do not match</p>}
            <button type="submit" disabled={!canSetPin || pinLoading} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg">
              {pinLoading ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
              Set PIN
            </button>
          </form>
        ) : pinMode === 'change-verify' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleChangePinVerify(); }} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">Current PIN</label>
              <PinInput value={pinValue} onChange={setPinValue} ariaLabel="Current PIN digits" className="max-w-xs" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={!canSetPin || pinLoading} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg">
                {pinLoading ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
                Verify Current PIN
              </button>
              <button type="button" onClick={() => { setPinMode('verify'); resetPinInputs(); }} className="text-xs font-medium text-ink-muted hover:text-ink transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : pinMode === 'change-set' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSetPin(); }} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">New PIN</label>
              <PinInput value={pinValue} onChange={setPinValue} ariaLabel="New PIN digits" className="max-w-xs" />
              <p className="text-xs text-ink-muted">Use 4–6 digits.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">Confirm New PIN</label>
              <PinInput value={pinConfirm} onChange={setPinConfirm} error={pinValue.length > 0 && pinValue !== pinConfirm} ariaLabel="Confirm New PIN digits" className="max-w-xs" />
            </div>
            {pinValue.length > 0 && pinValue !== pinConfirm && <p className="text-xs text-danger">PINs do not match</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={!canSetPin || pinLoading} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg">
                {pinLoading ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
                Update PIN
              </button>
              <button type="button" onClick={() => { setPinMode('verify'); resetPinInputs(); }} className="text-xs font-medium text-ink-muted hover:text-ink transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : pinMode === 'remove-verify' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleRemovePin(); }} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">Current PIN</label>
              <PinInput value={pinValue} onChange={setPinValue} ariaLabel="Current PIN digits" className="max-w-xs" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={!canSetPin || pinLoading} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-danger hover:bg-danger/90 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg">
                {pinLoading ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
                Confirm Remove PIN
              </button>
              <button type="button" onClick={() => { setPinMode('verify'); resetPinInputs(); }} className="text-xs font-medium text-ink-muted hover:text-ink transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyPin(); }} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">{totpOn ? 'Authenticator code' : 'Enter PIN'}</label>
              <PinInput value={pinValue} onChange={setPinValue} ariaLabel={totpOn ? 'Authenticator code digits' : 'PIN digits'} className="max-w-xs" />
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={!canSetPin || pinLoading} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg">
                {pinLoading ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
                {totpOn ? 'Verify code' : 'Verify PIN'}
              </button>
              {hasPin && (
                <button type="button" onClick={() => { setPinMode('change-verify'); resetPinInputs(); }} className="text-xs pl-5 font-medium text-ink-muted hover:text-ink transition-colors">
                  Change PIN
                </button>
              )}
              {hasPin && !totpOn && (
                <button type="button" onClick={() => { setPinMode('remove-verify'); resetPinInputs(); }} className="text-xs pl-5 font-medium text-danger hover:text-danger-ink transition-colors">
                  Remove PIN
                </button>
              )}
            </div>
          </form>
        )}
      </div>
      )}

      {/* Locked-state panel — populates the card while the password form is
          gated behind PIN verification (2FA on, PIN not yet verified). */}
      {!pinSatisfied && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-canvas rounded-lg p-4">
            <Shield size={16} className="text-ink-muted shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Two-Factor Authentication (2FA) is protecting this account</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Password settings stay locked until you verify, so they can't be changed without it.
              </p>
              {onGoToPreferences && (
                <button type="button" onClick={onGoToPreferences} className="text-xs font-medium text-brand-600 hover:underline mt-2">
                  Manage 2FA in Preferences
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-muted mb-2">Security tips</p>
            <ul className="space-y-1.5">
              {[
                "Never share your PIN or password — the counseling team will never ask for them.",
                "Use a password you don't use on any other site.",
                "Change or remove your PIN anytime with the actions above.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-ink-muted">
                  <Check size={12} className="text-brand-soft-ink shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Password Section — shown automatically unless 2FA requires PIN */}
      {pinSatisfied && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Current Password</label>
            <div className="relative">
              <input name="currentPassword" type={show.current ? 'text' : 'password'} value={form.currentPassword} onChange={handleChange} placeholder="Enter current password" className={inputClass} />
              <button type="button" onClick={() => setShow((p) => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft">
                {show.current ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">New Password</label>
            <div className="relative">
              <input name="newPassword" type={show.new ? 'text' : 'password'} value={form.newPassword} onChange={handleChange} placeholder="Enter new password" className={inputClass} />
              <button type="button" onClick={() => setShow((p) => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft">
                {show.new ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {form.newPassword.length > 0 && <StrengthBar score={strength} />}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Confirm New Password</label>
            <div className="relative">
              <input name="confirmPassword" type={show.confirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} placeholder="Confirm new password" className={inputClass} />
              <button type="button" onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-soft">
                {show.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {form.confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-danger mt-0.5">Passwords do not match</p>
            )}
          </div>

          {form.newPassword.length > 0 && (
            <div className="bg-canvas rounded-lg p-3 space-y-1.5">
              <ValidationRule passes={hasMinLength} label="At least 8 characters" />
              <ValidationRule passes={hasUpper} label="One uppercase letter" />
              <ValidationRule passes={hasNumber} label="One number" />
              <ValidationRule passes={hasSpecial} label="One special character" />
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong disabled:cursor-not-allowed transition-colors rounded-lg"
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const PreferencesCard = () => {
  const { authUser, totpSetup, totpConfirm, totpDisable } = useAuthStore();
  const { prefs, togglePref } = usePrefs(authUser?._id);
  const isStudent = authUser?.userType?.toLowerCase() === 'student';
  const [showName, setShowName] = useState(!!authUser?.showNameToCounselor);
  const [savingVisibility, setSavingVisibility] = useState(false);

  // Render-time adjustment (avoids setState-in-effect): resync when the
  // server-reported visibility changes underneath us.
  const [lastSeenShowName, setLastSeenShowName] = useState(!!authUser?.showNameToCounselor);
  if (lastSeenShowName !== !!authUser?.showNameToCounselor) {
    setLastSeenShowName(!!authUser?.showNameToCounselor);
    setShowName(!!authUser?.showNameToCounselor);
  }

  const handleToggleVisibility = async (checked) => {
    setShowName(checked);
    setSavingVisibility(true);
    try {
      const res = await axiosInstance.put('/auth/profile-details', { showNameToCounselor: checked });
      useAuthStore.setState((s) => ({ authUser: s.authUser ? { ...s.authUser, showNameToCounselor: res.data.showNameToCounselor } : s.authUser }));
      toast.success(checked ? 'Your name will be visible to counselors.' : 'You are now anonymous to counselors.');
    } catch {
      setShowName((v) => !v);
      toast.error('Failed to update visibility.');
    } finally {
      setSavingVisibility(false);
    }
  };

  // ── Authenticator app (TOTP) enrollment state ──
  const totpOn = !!authUser?.totpEnabled;
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [totpPhase, setTotpPhase] = useState('loading'); // 'loading' | 'qr' | 'disable'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [totpError, setTotpError] = useState(null);
  const [savingTotp, setSavingTotp] = useState(false);
  const [disableWithPin, setDisableWithPin] = useState(false);

  // Match the app-wide modal behavior: Escape closes the TOTP dialog.
  useEffect(() => {
    if (showTotpModal) {
      const handleKey = (e) => { if (e.key === 'Escape') setShowTotpModal(false); };
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [showTotpModal]);

  const startTotpSetup = async () => {
    setShowTotpModal(true);
    setTotpPhase('loading');
    setTotpToken('');
    setTotpError(null);
    try {
      const data = await totpSetup();
      setQrDataUrl(data.qrDataUrl);
      setTotpSecret(data.secret);
      setTotpPhase('qr');
    } catch (err) {
      setShowTotpModal(false);
      toast.error(err.response?.data?.message || 'Failed to start authenticator setup.');
    }
  };

  const confirmTotpSetup = async () => {
    if (totpToken.length !== 6) {
      setTotpError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setSavingTotp(true);
    setTotpError(null);
    try {
      await totpConfirm(totpToken);
      setShowTotpModal(false);
      toast.success('Authenticator app enabled.');
    } catch (err) {
      setTotpError(err.response?.data?.message || 'Incorrect code. Try again.');
      setTotpToken('');
    } finally {
      setSavingTotp(false);
    }
  };

  const startTotpDisable = () => {
    setShowTotpModal(true);
    setTotpPhase('disable');
    setTotpToken('');
    setTotpError(null);
    setDisableWithPin(false);
  };

  const confirmTotpDisable = async () => {
    if (totpToken.length < 4) {
      setTotpError(disableWithPin ? 'Enter your PIN.' : 'Enter the 6-digit code from your authenticator app.');
      return;
    }
    setSavingTotp(true);
    setTotpError(null);
    try {
      await totpDisable(disableWithPin ? { pin: totpToken } : { token: totpToken });
      setShowTotpModal(false);
      toast.success('Authenticator app disabled.');
    } catch (err) {
      setTotpError(err.response?.data?.message || 'Failed to disable authenticator.');
      setTotpToken('');
    } finally {
      setSavingTotp(false);
    }
  };

  const items = [
    { key: 'sessionReminders', title: 'Session Reminders', desc: 'Email me before scheduled counseling sessions.' },
    { key: 'messageNotifications', title: 'Message Notifications', desc: 'Notify me when I receive new chat messages.' },
    { key: 'switchmode', title: 'Dark Mode', desc: 'Switch between light and dark appearance.' },
  ];

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="size-9 rounded-lg bg-line flex items-center justify-center text-ink-muted">
          <Settings size={16} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink">Preferences</h3>
          <p className="text-xs text-ink-muted">Personalize your experience</p>
        </div>
      </div>

      <div className="divide-y divide-line">
        {isStudent && (
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Show full name to counselor</p>
              <p className="text-xs text-ink-muted mt-0.5">Otherwise counselors only see your Dynamic ID.</p>
            </div>
            <Toggle
              checked={showName}
              disabled={savingVisibility}
              onChange={(checked) => handleToggleVisibility(checked)}
              ariaLabel="Show my name to counselor"
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Two-Factor Authentication</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {totpOn
                ? 'A code from your authenticator app is required at sign-in.'
                : 'Add a second sign-in step using Google Authenticator or any TOTP app.'}
            </p>
          </div>
          {totpOn ? (
            <button
              type="button"
              onClick={startTotpDisable}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-danger border border-danger/30 hover:bg-danger-soft transition-colors rounded-lg"
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              onClick={startTotpSetup}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
            >
              <KeyRound size={12} />
              Set up
            </button>
          )}
        </div>

        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{it.title}</p>
              <p className="text-xs text-ink-muted mt-0.5">{it.desc}</p>
            </div>
            <Toggle
              checked={!!prefs[it.key]}
              onChange={() => togglePref(it.key)}
              ariaLabel={it.title}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-muted mt-4">Preferences are saved on this device.</p>

      {showTotpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-side/40 px-4">
          <div className="absolute inset-0" onClick={() => setShowTotpModal(false)} aria-hidden="true" />
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
                    onClick={() => setShowTotpModal(false)}
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
                  {authUser?.pin ? ', or use your PIN instead.' : '.'}
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
                {authUser?.pin && (
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
                    onClick={() => setShowTotpModal(false)}
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
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { authUser, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const TABS = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'preferences', label: 'Preferences' },
  ];

  if (!authUser) return null;

  const isStudent = authUser.userType?.toLowerCase() === 'student';
  const isCounselor = authUser.userType?.toLowerCase() === 'counselor';

  const meta = [
    { icon: Mail, label: 'Email', value: authUser.email },
    ...(isStudent ? [{ icon: Hash, label: 'Student ID', value: authUser.studentId }] : []),
    ...(isCounselor ? [{ icon: Hash, label: 'Counselor ID', value: authUser.counselorId }] : []),
    { icon: Building2, label: 'Department', value: authUser.department },
    { icon: BookOpen, label: 'Program', value: authUser.program },
  ];

  const handleUpload = async (base64) => {
    try {
      await updateProfile(base64);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to update profile picture');
    }
  };

  const handleRemove = async () => {
    try {
      await updateProfile('');
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove profile picture');
    }
  };

  const startEditing = () => {
    setEditForm({
      fullName: authUser.fullName || '',
      email: authUser.email || '',
      department: authUser.department || '',
      program: authUser.program || '',
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/auth/profile-details', editForm);
      toast.success('Profile updated');
      setEditing(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="My Account" description="Manage your profile and account settings">
      <div className="mb-6 border-b border-line">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === t.key
                  ? 'border-brand-600 text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink-soft'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <div className="bg-surface border border-line rounded-lg p-6">
            <div className="flex items-center gap-4 mb-5">
              <AvatarUpload
                profilePic={authUser.profilePic}
                fullName={authUser.fullName}
                onUpload={handleUpload}
                onRemove={handleRemove}
                size="lg"
              />
              <div>
                <h2 className="text-base font-medium text-ink">{authUser.fullName || 'User'}</h2>
                <span className="text-xs text-ink-muted">
                  {isCounselor ? 'Counselor' : 'Student'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <SectionDivider label="Details" />
              {isCounselor && !editing && (
                <button
                  onClick={startEditing}
                  className="size-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink-soft hover:bg-line transition-colors"
                  title="Edit profile"
                  aria-label="Edit profile"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                {[
                  { key: 'fullName', label: 'Full Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'department', label: 'Department' },
                  { key: 'program', label: 'Program' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-semibold text-ink-muted">{label}</label>
                    <input
                      value={editForm[key] || ''}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2 text-ink focus:border-brand-600 outline-none transition-colors"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditing(false)} className="flex-1 px-4 py-2 text-xs font-semibold text-ink-soft bg-line hover:bg-line transition-colors rounded-lg">
                    Cancel
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:bg-line-strong transition-colors rounded-lg">
                    {saving ? <Loader size={12} className="animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {meta.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
                      <Icon size={14} className="text-ink-muted shrink-0" />
                      <span className="text-xs text-ink-muted w-24 shrink-0">{item.label}</span>
                      <span className="text-sm text-ink truncate">{item.value || '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <SecurityCard onGoToPreferences={() => setActiveTab('preferences')} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-surface border border-line rounded-lg p-4">
              <div className="size-8 rounded-lg bg-line flex items-center justify-center text-ink-muted mb-3">
                <Shield size={14} />
              </div>
              <p className="text-sm font-medium text-ink">Protected sign-in</p>
              <p className="text-xs text-ink-muted mt-1">
                2FA adds a second step at login. Enable it anytime in Preferences.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-4">
              <div className="size-8 rounded-lg bg-line flex items-center justify-center text-ink-muted mb-3">
                <EyeOff size={14} />
              </div>
              <p className="text-sm font-medium text-ink">Identity protection</p>
              <p className="text-xs text-ink-muted mt-1">
                Your identity stays private — you control what counselors can see in Preferences.
              </p>
            </div>
            <div className="bg-surface border border-line rounded-lg p-4">
              <div className="size-8 rounded-lg bg-line flex items-center justify-center text-ink-muted mb-3">
                <KeyRound size={14} />
              </div>
              <p className="text-sm font-medium text-ink">Keep credentials safe</p>
              <p className="text-xs text-ink-muted mt-1">
                Never share your password. The counseling team will never ask for them.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && <PreferencesCard />}
    </PageShell>
  );
};

export default ProfilePage;
