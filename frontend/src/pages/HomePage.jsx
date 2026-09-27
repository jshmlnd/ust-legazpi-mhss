import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { MoveRight, Pencil, Sparkles } from 'lucide-react';
import { axiosInstance } from "../lib/axios";
import { PATHS } from '../lib/routes';
import Modal from '../ui/Modal';
import RoleGate from '../components/RoleGate';
import { getCheckInSuggestion, dismissCheckInBanner } from '../lib/sessionLoop';
import { toast } from 'react-toastify';

const MOODS = [
  { value: 'great', label: 'Great', face: '😄' },
  { value: 'good', label: 'Good', face: '🙂' },
  { value: 'okay', label: 'Okay', face: '😐' },
  { value: 'low', label: 'Low', face: '😞' },
  { value: 'bad', label: 'Bad', face: '😣' },
];

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Streak = consecutive days ending today (or yesterday, so a streak isn't
// "broken" until a full day is skipped) with at least one diary entry.
// Entries carry a 'MM-DD-YYYY' date string; computed frontend-only.
const computeStreak = (entries) => {
  const days = new Set(
    entries
      .map((e) => {
        const [mm, dd, yyyy] = (e.date || '').split('-').map(Number);
        return mm && dd && yyyy ? `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}` : null;
      })
      .filter(Boolean)
  );
  if (days.size === 0) return 0;
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const DEFAULT_NOTICE = {
  tag: "NOTICE",
  text: "Counseling services are available for walk-in appointments every Monday and Thursday, 8:00 AM – 4:00 PM at the Office of Guidance and Testing.",
  linkHref: "/university-updates",
  linkLabel: "Read latest updates",
};

const HomePage = () => {
  const { authUser } = useAuthStore();

  const firstName = authUser?.fullName?.split(" ")[0] ?? "Student";
  const genid = authUser?.dynamicId;

  const [notice, setNotice] = useState(DEFAULT_NOTICE);
  const [noticeEditOpen, setNoticeEditOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ text: '' });
  const [savingNotice, setSavingNotice] = useState(false);

  // ── Daily mood check-in (journal data, no schema change) ──
  const isStudent = authUser?.userType?.toLowerCase() === 'student';
  const [entries, setEntries] = useState([]);
  const [moodSaving, setMoodSaving] = useState(false);
  const [moodSaved, setMoodSaved] = useState(null);

  useEffect(() => {
    if (!isStudent) return;
    axiosInstance.get('/journal').then((res) => setEntries(res.data)).catch(() => {});
  }, [isStudent]);

  // "Check in again?" — last completed session was 3–7 days ago, no follow-up
  const [appointments, setAppointments] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    if (!isStudent) return;
    axiosInstance.get('/appointments').then((res) => setAppointments(res.data)).catch(() => {});
  }, [isStudent]);
  const checkInSuggestion = bannerDismissed ? null : getCheckInSuggestion(appointments);

  const streak = computeStreak(entries);
  const todayKey = dayKey(new Date());
  const checkedInToday = entries.some((e) => {
    const [mm, dd, yyyy] = (e.date || '').split('-').map(Number);
    return mm && dd && yyyy ? `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}` === todayKey : false;
  });

  const handleMoodCheckIn = async (mood) => {
    setMoodSaving(true);
    try {
      const res = await axiosInstance.post('/journal', {
        title: 'Daily mood check-in',
        content: `Feeling ${mood} today.`,
        mood,
      });
      setEntries((prev) => [res.data, ...prev]);
      setMoodSaved(mood);
      toast.success(streak > 0 ? `Checked in — ${streak + 1}-day streak! 🔥` : 'Checked in — day 1! Start a streak.');
    } catch {
      toast.error('Could not save your check-in.');
    } finally {
      setMoodSaving(false);
    }
  };

  useEffect(() => {
    axiosInstance.get('/notice').then((res) => {
      if (res.data) setNotice(res.data);
    }).catch(() => {});
  }, []);

  const handleSaveNotice = async () => {
    if (!noticeForm.text.trim()) return;
    setSavingNotice(true);
    try {
      const res = await axiosInstance.put('/notice', { ...noticeForm, tag: 'NOTICE', linkHref: '/university-updates', linkLabel: 'Read latest updates' });
      setNotice(res.data);
      setNoticeEditOpen(false);
      toast.success('Notice updated');
    } catch {
      toast.error('Failed to update notice');
    } finally {
      setSavingNotice(false);
    }
  };

  const openNoticeEdit = () => {
    setNoticeForm({ text: notice.text });
    setNoticeEditOpen(true);
  };

  return (
    <main className="relative py-24 overflow-hidden">
      <div className="home-bg-overlay absolute inset-0 -z-10 bg-surface/70" />
      <div className="mx-auto max-w-[1200px] pb-28 px-4 sm:px-6 lg:px-10">
        {/* ──────── SECTION 1: HERO ──────── */}
        <section className="relative min-h-[50vh] flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-semibold text-brand-fg bg-brand-600 rounded-lg">Your ID: STU-{genid}</span>
            <span className="text-xs text-ink-muted">Counselors only see your name if you allow it in <Link to={PATHS.MY_ACCOUNT} className="underline underline-offset-2 hover:text-ink">Preferences</Link></span>
          </div>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.03em] text-ink">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},{` `}
            <span className="font-medium">{firstName}</span>
          </h1>
          <p className="mt-5 max-w-[580px] text-base leading-[1.7] text-ink-soft tracking-[-0.01em]">
            Welcome to the UST-Legazpi Mental Health Support System. Your well-being is our priority — access counseling
            services, schedule appointments, and explore resources designed to support you.
          </p>
          {checkInSuggestion && (
            <div className="mt-8 bg-brand-soft border border-brand-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-ink">Check in again?</p>
              <p className="text-xs text-ink-muted mt-0.5">
                It's been a few days since your session on {checkInSuggestion.date}. {checkInSuggestion.counselorName || 'Your counselor'} is here whenever you're ready.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Link
                  to={PATHS.SESSIONS}
                  className="px-4 py-1.5 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
                >
                  Book follow-up
                </Link>
                <button
                  onClick={() => {
                    dismissCheckInBanner();
                    setBannerDismissed(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {/* Daily mood check-in — students only */}
          {isStudent && (
            <div className="mt-8 bg-surface/80 backdrop-blur-xl border border-line rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand-600" />
                    How are you today?
                  </h2>
                  {streak > 0 && (
                    <span className="px-2.5 py-1 text-xs font-semibold text-brand-fg bg-brand-600 rounded-lg whitespace-nowrap">
                      🔥 {streak}-day streak
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">
                  {checkedInToday || moodSaved
                    ? 'Logged for today — see you tomorrow.'
                    : 'One tap logs your mood in your diary.'}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2 w-full sm:w-[560px] sm:max-w-full">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => !moodSaving && !moodSaved && !checkedInToday && handleMoodCheckIn(m.value)}
                    disabled={moodSaving || !!moodSaved || checkedInToday}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-colors disabled:cursor-default ${
                      moodSaved === m.value
                        ? 'bg-brand-600 text-brand-fg border-brand-600'
                        : checkedInToday || moodSaved
                          ? 'bg-canvas border-line opacity-60'
                          : 'bg-canvas border-line hover:border-brand-600 hover:bg-brand-soft'
                    }`}
                    aria-label={`Feeling ${m.label}`}
                  >
                    <span className="text-xl leading-none" aria-hidden="true">{m.face}</span>
                    <span className="text-[10px] font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Announcement Card — tag on its own line on mobile, beside the
              text from sm up; edit affordance sits at the top-right. */}
          <div className="mt-10 border-l-2 border-brand-600 pl-5 pr-3 sm:pr-5 py-4 backdrop-blur-xl rounded-lg relative group">
            <RoleGate roles={['counselor']}>
              <button
                onClick={openNoticeEdit}
                className="absolute right-3 sm:right-4 top-3 size-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-line transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                title="Edit notice"
                aria-label="Edit notice"
              >
                <Pencil size={12} />
              </button>
            </RoleGate>
            <div className="flex flex-col sm:flex-row sm:items-start gap-2.5 sm:gap-4">
              <span className="self-start shrink-0 px-2.5 py-1 text-xs font-semibold text-brand-fg bg-brand-600 rounded-lg">
                {notice.tag}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-[1.6] text-ink-soft">{notice.text}</p>
                {notice.linkLabel && (
                  <Link
                    to={notice.linkHref}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink border-b border-brand-600/30 hover:border-brand-600 transition-colors"
                  >
                    {notice.linkLabel}
                    <span className="text-sm leading-none"><MoveRight className="size-4" /></span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal isOpen={noticeEditOpen} onClose={() => setNoticeEditOpen(false)} title="Edit Notice">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveNotice(); }} className="space-y-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            Shown to students at the top of their home page. Keep it short and actionable.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Notice Text</label>
            <textarea
              value={noticeForm.text}
              onChange={(e) => setNoticeForm({ text: e.target.value })}
              rows={4}
              className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setNoticeEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingNotice}
              className="px-5 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50"
            >
              {savingNotice ? 'Saving...' : 'Save Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
};

export default HomePage;
