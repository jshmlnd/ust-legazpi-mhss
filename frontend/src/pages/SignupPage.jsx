import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Eye, EyeOff, HatGlasses, Heart,
  MailCheck, MessageSquare, Moon, Sun, UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { PATHS } from '../lib/routes';
import { toast } from 'react-toastify';
import { usePrefs } from '../lib/prefs';
import { Button, Field } from '../ui';

const LOGO_URL = 'https://ik.imagekit.io/zjkm666/new-ust-logo.png';
const STUDENT_EMAIL_DOMAIN = 'ust-legazpi.edu.ph';
const DEPARTMENTS = ['CEAFA', 'CHS', 'CASE', 'CBMA'];

const INPUT_CLASS =
  'w-full rounded-lg border bg-surface py-3 pl-4 text-sm text-ink ' +
  'placeholder:text-ink-muted transition-colors duration-150 outline-none ' +
  'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

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

const initialForm = {
  studentId: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  email: '',
  department: '',
  program: '',
};

const SignupPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // sent step: link emailed, with resend cooldown mirroring the server's 60s.
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const { signup, resendVerification } = useAuthStore();
  const navigate = useNavigate();

  const resendCounting = resendIn > 0;
  useEffect(() => {
    if (!resendCounting) return undefined;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCounting]);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.studentId.trim().length !== 7) next.studentId = 'Student ID must be exactly 7 characters';
    if (!form.fullName.trim()) next.fullName = 'Please enter your full name';
    const email = form.email.trim().toLowerCase();
    if (!email) next.email = 'Please enter your university email';
    else if (!email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) next.email = `Use your @${STUDENT_EMAIL_DOMAIN} email`;
    if (!form.department) next.department = 'Please select your department';
    if (!form.program.trim()) next.program = 'Please enter your program';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signup({
        studentId: form.studentId.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        department: form.department,
        program: form.program.trim(),
      });
      setMaskedEmail(data?.maskedEmail || form.email.trim());
      setResendIn(60);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const data = await resendVerification(form.email.trim());
      if (data?.maskedEmail) setMaskedEmail(data.maskedEmail);
      if (typeof data?.retryAfterSecs === 'number') {
        setResendIn(data.retryAfterSecs);
        toast.info(`Link already sent — you can resend in ${data.retryAfterSecs}s.`);
      } else {
        setResendIn(60);
        toast.success('A new verification link is on its way. Check your email.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* ── Brand panel (desktop) ── */}
      <section
        className="relative hidden overflow-hidden bg-side lg:flex lg:w-[44%] lg:min-h-screen
          flex-col justify-center gap-12 p-10 xl:p-16"
      >
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
            Join <span className="text-brand-300 font-black">SafeSpace</span>
          </h2>
          <p className="mt-5 text-sm leading-[1.7] text-side-ink-soft">
            Create your account with your university email to book sessions,
            message counselors, and track your wellness — all while keeping
            your identity private.
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

        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-e2 sm:p-8">
            {!maskedEmail ? (
              <div key="signup-form" className="animate-fade-in">
                <h1 className="text-xl font-semibold tracking-tight text-ink">Create an account</h1>
                <p className="mt-1 text-xs text-ink-muted">
                  Students only — a <span className="font-semibold">@{STUDENT_EMAIL_DOMAIN}</span> email is required.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                  <Field label="Student ID" htmlFor="signup-id" required error={errors.studentId}>
                    <input
                      id="signup-id"
                      type="text"
                      inputMode="numeric"
                      maxLength={7}
                      value={form.studentId}
                      onChange={(e) => { if (/^\d*$/.test(e.target.value)) set('studentId', e.target.value); }}
                      placeholder="7-digit ID"
                      className={INPUT_CLASS}
                      autoComplete="username"
                      autoFocus
                      aria-invalid={!!errors.studentId || undefined}
                    />
                  </Field>

                  <Field label="Full Name" htmlFor="signup-name" required error={errors.fullName}>
                    <input
                      id="signup-name"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className={INPUT_CLASS}
                      autoComplete="name"
                      aria-invalid={!!errors.fullName || undefined}
                    />
                  </Field>

                  <Field label="University Email" htmlFor="signup-email" required error={errors.email}>
                    <input
                      id="signup-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder={`you@${STUDENT_EMAIL_DOMAIN}`}
                      className={INPUT_CLASS}
                      autoComplete="email"
                      aria-invalid={!!errors.email || undefined}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Department" htmlFor="signup-dept" required error={errors.department}>
                      <select
                        id="signup-dept"
                        value={form.department}
                        onChange={(e) => set('department', e.target.value)}
                        className={`${INPUT_CLASS} ${form.department ? '' : 'text-ink-muted'}`}
                        aria-invalid={!!errors.department || undefined}
                      >
                        <option value="" disabled>Select</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>
                    <Field label="Program" htmlFor="signup-program" required error={errors.program}>
                      <input
                        id="signup-program"
                        type="text"
                        value={form.program}
                        onChange={(e) => set('program', e.target.value)}
                        placeholder="e.g. BSCS"
                        className={INPUT_CLASS}
                        aria-invalid={!!errors.program || undefined}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Password" htmlFor="signup-password" required error={errors.password}>
                      <div className="relative">
                        <input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={(e) => set('password', e.target.value)}
                          placeholder="Min. 8 characters"
                          className={`${INPUT_CLASS} pr-11`}
                          autoComplete="new-password"
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
                    <Field label="Confirm Password" htmlFor="signup-confirm" required error={errors.confirmPassword}>
                      <input
                        id="signup-confirm"
                        type={showPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => set('confirmPassword', e.target.value)}
                        placeholder="Repeat password"
                        className={INPUT_CLASS}
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirmPassword || undefined}
                      />
                    </Field>
                  </div>

                  <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
                    {loading ? 'Creating account…' : 'Sign Up'}
                    {!loading && <UserPlus className="size-4" aria-hidden="true" />}
                  </Button>

                  <p className="text-center text-xs text-ink-muted">
                    Already have an account?{' '}
                    <Link to={PATHS.LOGIN} className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </form>
              </div>
            ) : (
              <div key="signup-sent" className="flex animate-fade-in flex-col gap-5">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-ink">
                  <MailCheck size={22} aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-ink">Check your email</h1>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    We sent a verification link to {maskedEmail}. Click it within 24 hours
                    to activate your account, then sign in. Can&apos;t find it? Check your spam folder.
                  </p>
                </div>

                <p className="text-center text-xs text-ink-muted">
                  Didn&apos;t get it?{' '}
                  {resendIn > 0 ? (
                    <span className="font-medium tabular-nums" aria-live="polite">
                      Resend available in {resendIn}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="font-medium text-brand-600 hover:text-brand-700
                        disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {resendLoading ? 'Resending…' : 'Resend link'}
                    </button>
                  )}
                </p>

                <Button type="button" size="lg" onClick={() => navigate(PATHS.LOGIN)} className="mt-1 w-full">
                  Back to sign in
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default SignupPage;
