import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft, ArrowRight, Eye, EyeOff, HatGlasses, Heart, KeyRound, Mail, MessageSquare, Moon, Sun,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { PATHS } from '../lib/routes';
import { toast } from 'react-toastify';
import { usePrefs } from '../lib/prefs';
import { Button, Field, PinInput } from '../ui';

const LOGO_URL = 'https://ik.imagekit.io/zjkm666/new-ust-logo.png';

const INPUT_CLASS =
  'w-full rounded-lg border bg-surface py-3 pl-4 text-sm text-ink ' +
  'placeholder:text-ink-muted transition-colors duration-150 outline-none ' +
  'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const PIN_LENGTH = 6;
const OTP_LENGTH = 6;

const BRAND_PANEL_POINTS = [
  { icon: HatGlasses, label: 'Privacy First' },
  { icon: MessageSquare, label: 'Online Sessions' },
  { icon: Heart, label: 'Mental Wellness' },
];

const LogoTile = ({ size = 'size-11' }) => (
  <span className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-white shadow-e2`}>
    <img src={LOGO_URL} alt="UST-Legazpi logo" className="size-3/4" />
  </span>
);

const ThemeToggle = () => {
  const { prefs, togglePref } = usePrefs(null);
  const dark = !!(prefs.calmMode || prefs.switchmode);
  return (
    <button
      type="button"
      onClick={() => togglePref('switchmode')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="absolute right-4 top-4 z-10 flex items-center justify-center size-9 rounded-md
        text-ink-muted hover:text-ink hover:bg-line transition-colors"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const LoginPage = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [errors, setErrors] = useState({});

  const [step, setStep] = useState('credentials');
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [twoFactorType, setTwoFactorType] = useState('pin'); // 'pin' | 'totp'
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState(null);
  const [pinEpoch, setPinEpoch] = useState(0); // bump to remount PinInput and refocus box 1

  // Forgot-password flow: credentials → emailed OTP → new password.
  const [resetId, setResetId] = useState('');
  const [resetErrors, setResetErrors] = useState({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetOtpError, setResetOtpError] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [resendIn, setResendIn] = useState(0); // seconds until resend unlocks
  const [resendLoading, setResendLoading] = useState(false);

  const { login, verifyTwoFactor, isLoggingIn, requestPasswordReset, verifyResetCode, resetPassword } = useAuthStore();
  const navigate = useNavigate();

  // Resend cooldown ticker — mirrors the backend's 60s OTP resend cooldown,
  // and syncs to the server's retryAfterSecs whenever the server reports one.
  const resendCounting = resendIn > 0;
  useEffect(() => {
    if (!resendCounting) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCounting]);

  const goToApp = (user) => {
    const isCounselor = user?.userType?.toLowerCase() === 'counselor';
    const isAdministrator = user?.userType?.toLowerCase() === 'administrator';
    navigate(isCounselor ? PATHS.DASHBOARD : isAdministrator ? PATHS.ADMIN : PATHS.HOME);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!studentId.trim()) nextErrors.id = 'Please enter your Student / Counselor ID';
    if (!password) nextErrors.password = 'Please enter your password';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const data = await login(studentId.trim(), password);
      if (data?.twoFactorRequired) {
        setTwoFactorToken(data.twoFactorToken);
        setTwoFactorType(data.twoFactorType === 'totp' ? 'totp' : 'pin');
        setStep('pin');
        setPin('');
        setPinError(null);
        return;
      }
      goToApp(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    const isTotp = twoFactorType === 'totp';
    if (!pin) {
      setPinError(isTotp ? 'Enter the 6-digit code from your authenticator app' : 'Please enter your PIN');
      return;
    }
    if (isTotp && pin.length !== 6) {
      setPinError('Authenticator codes are 6 digits');
      return;
    }
    if (!isTotp && pin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    setPinLoading(true);
    setPinError(null);
    try {
      const data = await verifyTwoFactor(twoFactorToken, pin, twoFactorType);
      goToApp(data);
    } catch (error) {
      setPinError(error.message || (isTotp ? 'Incorrect authenticator code' : 'Incorrect PIN'));
      setPin('');
      setPinEpoch((n) => n + 1);
    } finally {
      setPinLoading(false);
    }
  };

  const backToCredentials = () => {
    setStep('credentials');
    setTwoFactorToken(null);
    setPin('');
    setPinError(null);
  };

  /* ── Forgot password ── */

  const startForgotPassword = () => {
    setResetId('');
    setResetErrors({});
    setResetOtp('');
    setResetOtpError(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setMaskedEmail(null);
    setResendIn(0);
    setResendLoading(false);
    setStep('forgot-id');
  };

  // Step 2: verify the emailed code first — the new-password form is only
  // rendered after the backend confirms the code (without consuming it).
  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    if (resetOtp.length !== OTP_LENGTH) {
      setResetErrors({ otp: 'Enter the 6-digit code from your email' });
      return;
    }
    setResetLoading(true);
    setResetErrors({});
    setResetOtpError(null);
    try {
      const data = await verifyResetCode(resetId.trim(), resetOtp);
      if (data?.maskedEmail) setMaskedEmail(data.maskedEmail);
      setStep('forgot-password');
    } catch (error) {
      setResetOtpError(error.message || 'Invalid or expired code');
      setResetOtp('');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: code already verified — submit the new password.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!newPassword) nextErrors.password = 'Please enter a new password';
    else if (newPassword.length < 8) nextErrors.password = 'New password must be at least 8 characters';
    if (confirmNewPassword !== newPassword) nextErrors.confirm = 'Passwords do not match';
    setResetErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setResetLoading(true);
    setResetOtpError(null);
    try {
      await resetPassword(resetId.trim(), resetOtp, newPassword);
      setStep('forgot-done');
    } catch (error) {
      // The code can still fail at the final call (expired while typing, or
      // the server rejected it) — send the user back to re-verify.
      setStep('forgot-otp');
      setResetOtpError(error.message || 'Code expired. Please verify again.');
      setResetOtp('');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!resetId.trim()) {
      setResetErrors({ id: 'Please enter your Student / Counselor ID' });
      return;
    }
    setResetLoading(true);
    setResetErrors({});
    try {
      const data = await requestPasswordReset(resetId.trim());
      if (data?.maskedEmail) setMaskedEmail(data.maskedEmail);
      // Start the resend cooldown immediately (server enforces 60s; if we
      // re-requested an in-flight code, the server tells us the time left).
      setResendIn(typeof data?.retryAfterSecs === 'number' ? data.retryAfterSecs : 60);
      setStep('forgot-otp');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendIn > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const data = await requestPasswordReset(resetId.trim());
      if (data?.maskedEmail) setMaskedEmail(data.maskedEmail);
      setResetOtp('');
      setResetOtpError(null);
      setResetErrors({});
      if (typeof data?.retryAfterSecs === 'number') {
        // Server cooldown still active — no new email went out; sync the timer.
        setResendIn(data.retryAfterSecs);
        toast.info(`Code already sent — you can resend in ${data.retryAfterSecs}s.`);
      } else {
        setResendIn(60);
        toast.success('A new code is on its way. Check your email.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const backToSignIn = () => {
    setStep('credentials');
    setResetId('');
    setResetErrors({});
    setResetOtp('');
    setResetOtpError(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setMaskedEmail(null);
    setResendIn(0);
    setResendLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* ── Brand panel (desktop) ── */}
      <section
        className="relative hidden overflow-hidden bg-side lg:flex lg:w-[44%] lg:min-h-screen
          flex-col justify-center gap-12 p-10 xl:p-16"
      >
        {/* decorative glows + motif */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-side-active blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-80 rounded-full bg-side-hover blur-3xl" />
          <Activity className="absolute -bottom-10 -right-10 size-64 text-side-line" strokeWidth={1} />
        </div>

        <div className="relative flex items-center gap-3">
          <LogoTile />
          <div>
            <p className="text-sm font-semibold text-side-ink">UST-Legazpi</p>
            <p className="text-xs text-side-ink-muted">Mental Health Support System</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-medium leading-[1.1] tracking-tight text-side-ink xl:text-6xl">
            Welcome to <span className="text-brand-300 font-black">SafeSpace</span>
          </h2>
          <p className="mt-5 text-sm leading-[1.7] text-side-ink-soft">
            A University of Santo Tomas - Legazpi Mental Health Support website, a safe, anonymous
            space for your mental wellness. Connect with counselors, access mental health resources,
            and track your emotional and mental health — all while keeping your identity private.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {BRAND_PANEL_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-side-hover text-side-ink">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-side-ink">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Mobile brand band ── */}
      <div className="flex items-center gap-3 bg-side px-5 py-4 lg:hidden">
        <LogoTile size="size-10" />
        <div>
          <p className="text-sm font-semibold text-side-ink">UST-Legazpi · SafeSpace</p>
          <p className="text-xs text-side-ink-muted">Mental Health Support System</p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <section className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:py-16">
        <ThemeToggle />

        <div className="w-full max-w-sm animate-fade-in">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-e2 sm:p-8">
            <div key={step} className="animate-fade-in">
              {step === 'credentials' && (
                <>
                  <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in</h1>
                  <p className="mt-1 text-xs text-ink-muted">
                    Enter your credentials to access your SafeSpace account.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
                    <Field
                      label="Student / Counselor ID"
                      htmlFor="login-id"
                      required
                      error={errors.id}
                    >
                      <input
                        id="login-id"
                        type="text"
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          setErrors((prev) => ({ ...prev, id: undefined }));
                        }}
                        placeholder="Enter your ID"
                        className={INPUT_CLASS}
                        autoComplete="username"
                        autoFocus
                        aria-invalid={!!errors.id || undefined}
                      />
                    </Field>

                    <Field
                      label="Password"
                      htmlFor="login-password"
                      required
                      error={errors.password}
                      helper={capsLockOn ? 'Caps Lock is on' : undefined}
                    >
                      <div className="relative">
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors((prev) => ({ ...prev, password: undefined }));
                          }}
                          onKeyUp={(e) => setCapsLockOn(e.getModifierState?.('CapsLock') ?? false)}
                          onBlur={() => setCapsLockOn(false)}
                          placeholder="Enter your password"
                          className={`${INPUT_CLASS} pr-11`}
                          autoComplete="current-password"
                          aria-invalid={!!errors.password || undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center
                            justify-center rounded-md text-ink-muted hover:text-ink transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </Field>

                    <Button type="submit" size="lg" loading={isLoggingIn} className="mt-1 w-full">
                      {isLoggingIn ? 'Signing in…' : 'Sign In'}
                      {!isLoggingIn && <ArrowRight className="size-4" aria-hidden="true" />}
                    </Button>
                    <button
                      type="button"
                      onClick={startForgotPassword}
                      className="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-muted
                        hover:text-ink transition-colors"
                    >
                      <KeyRound className="size-3.5" aria-hidden="true" />
                      Forgot password?
                    </button>
                  </form>
                </>
              )}
              {step === 'pin' && (
                <form onSubmit={handleVerifyPin} className="flex flex-col gap-5">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-ink">
                      Two-step verification
                    </h1>
                    <p className="mt-1 text-xs text-ink-muted">
                      {twoFactorType === 'totp'
                        ? 'Open your authenticator app and enter the current 6-digit code for Freebuff.'
                        : 'Enter the PIN you set up for your account.'}
                    </p>
                  </div>

                  <PinInput
                    key={pinEpoch}
                    value={pin}
                    onChange={(v) => { setPin(v); setPinError(null); }}
                    length={PIN_LENGTH}
                    error={!!pinError}
                    autoFocus
                    label={twoFactorType === 'totp' ? 'Authenticator code' : 'PIN'}
                    ariaLabel={twoFactorType === 'totp' ? 'Authenticator code digits' : 'PIN digits'}
                  />
                  {pinError && (
                    <p className="-mt-3 text-xs text-danger-ink" role="alert">{pinError}</p>
                  )}

                  <Button type="submit" size="lg" loading={pinLoading} className="mt-1 w-full">
                    {pinLoading ? 'Verifying…' : twoFactorType === 'totp' ? 'Verify code' : 'Verify PIN'}
                  </Button>

                  <button
                    type="button"
                    onClick={backToCredentials}
                    className="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-muted
                      hover:text-ink transition-colors"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Back to sign in
                  </button>
                </form>
              )}
              {step === 'forgot-id' && (
                <form onSubmit={handleRequestReset} className="flex flex-col gap-5">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-ink">Forgot password?</h1>
                    <p className="mt-1 text-xs text-ink-muted">
                      Enter your Student or Counselor ID and we'll email a one-time code to the address on file.
                    </p>
                  </div>

                  <Field label="Student / Counselor ID" htmlFor="reset-id" required error={resetErrors.id}>
                    <input
                      id="reset-id"
                      type="text"
                      value={resetId}
                      onChange={(e) => {
                        setResetId(e.target.value);
                        setResetErrors((prev) => ({ ...prev, id: undefined }));
                      }}
                      placeholder="Enter your ID"
                      className={INPUT_CLASS}
                      autoComplete="username"
                      autoFocus
                      aria-invalid={!!resetErrors.id || undefined}
                    />
                  </Field>

                  <Button type="submit" size="lg" loading={resetLoading} className="mt-1 w-full">
                    {resetLoading ? 'Sending code…' : 'Send code'}
                    {!resetLoading && <Mail className="size-4" aria-hidden="true" />}
                  </Button>

                  <button
                    type="button"
                    onClick={backToSignIn}
                    className="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-muted
                      hover:text-ink transition-colors"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Back to sign in
                  </button>
                </form>
              )}
              {step === 'forgot-otp' && (
                <form onSubmit={handleVerifyResetCode} className="flex flex-col gap-5">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-ink">Check your email</h1>
                    <p className="mt-1 text-xs text-ink-muted">
                      We sent a 6-digit code to {maskedEmail || 'your university email'}. It expires in 10 minutes.
                      Can't find it? Check your spam folder.
                    </p>
                  </div>

                  <PinInput
                    value={resetOtp}
                    onChange={(v) => { setResetOtp(v); setResetOtpError(null); setResetErrors((prev) => ({ ...prev, otp: undefined })); }}
                    length={OTP_LENGTH}
                    error={!!resetOtpError || !!resetErrors.otp}
                    autoFocus
                    label="Reset code"
                    ariaLabel="Reset code digits"
                  />
                  {(resetOtpError || resetErrors.otp) && (
                    <p className="-mt-3 text-xs text-danger-ink" role="alert">{resetOtpError || resetErrors.otp}</p>
                  )}

                  <Button type="submit" size="lg" loading={resetLoading} className="mt-1 w-full">
                    {resetLoading ? 'Verifying…' : 'Verify code'}
                  </Button>

                  <p className="-mt-2 text-center text-xs text-ink-muted">
                    Didn't get it?{' '}
                    {resendIn > 0 ? (
                      <span className="font-medium tabular-nums" aria-live="polite">
                        Resend available in {resendIn}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendLoading}
                        className="font-medium text-brand-600 hover:text-brand-700
                          disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendLoading ? 'Resending…' : 'Resend code'}
                      </button>
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={backToSignIn}
                    className="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-muted
                      hover:text-ink transition-colors"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Back to sign in
                  </button>
                </form>
              )}
              {step === 'forgot-password' && (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-ink">Set a new password</h1>
                    <p className="mt-1 text-xs text-ink-muted">
                      Code verified for {maskedEmail || resetId} — now choose a new password (min. 8 characters).
                    </p>
                  </div>

                  <Field
                    label="New password"
                    htmlFor="reset-new-password"
                    required
                    error={resetErrors.password}
                  >
                    <div className="relative">
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setResetErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        placeholder="At least 8 characters"
                        className={`${INPUT_CLASS} pr-11`}
                        autoComplete="new-password"
                        aria-invalid={!!resetErrors.password || undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        aria-pressed={showNewPassword}
                        className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center
                          justify-center rounded-md text-ink-muted hover:text-ink transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>

                  <Field
                    label="Confirm new password"
                    htmlFor="reset-confirm-password"
                    required
                    error={resetErrors.confirm}
                  >
                    <input
                      id="reset-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setResetErrors((prev) => ({ ...prev, confirm: undefined }));
                      }}
                      placeholder="Re-enter your new password"
                      className={INPUT_CLASS}
                      autoComplete="new-password"
                      aria-invalid={!!resetErrors.confirm || undefined}
                    />
                  </Field>

                  <Button type="submit" size="lg" loading={resetLoading} className="mt-1 w-full">
                    {resetLoading ? 'Resetting…' : 'Reset password'}
                  </Button>

                  <button
                    type="button"
                    onClick={backToSignIn}
                    className="mx-auto flex items-center gap-1.5 text-xs font-medium text-ink-muted
                      hover:text-ink transition-colors"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Back to sign in
                  </button>
                </form>
              )}
              {step === 'forgot-done' && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-ink">Password reset</h1>
                    <p className="mt-1 text-xs text-ink-muted">
                      Your password has been updated{maskedEmail ? ` — a confirmation was sent to ${maskedEmail}` : ''}. You can now sign in with your new password.
                    </p>
                  </div>

                  <Button type="button" size="lg" onClick={backToSignIn} className="mt-1 w-full">
                    Back to sign in
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">
            Having trouble? Contact the Office of Guidance and Testing.
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
