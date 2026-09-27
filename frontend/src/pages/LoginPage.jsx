import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft, ArrowRight, Eye, EyeOff, HatGlasses, Heart, MessageSquare, Moon, Shield, Sun,
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

const BRAND_PANEL_POINTS = [
  { icon: HatGlasses, label: 'Anonymous identity' },
  { icon: MessageSquare, label: 'Connect with counselors' },
  { icon: Heart, label: 'Private mental health tracking' },
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

  const { login, verifyTwoFactor, isLoggingIn } = useAuthStore();
  const navigate = useNavigate();

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
          <h2 className="text-4xl font-normal leading-[1.1] tracking-tight text-side-ink xl:text-5xl">
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
              {step === 'credentials' ? (
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
                  </form>
                </>
              ) : (
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
