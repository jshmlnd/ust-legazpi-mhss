import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, Heart, MessageCircle, MoveRight, ShieldCheck } from 'lucide-react';
import { axiosInstance } from "../lib/axios";
import { PATHS } from '../lib/routes';
import Modal from '../ui/Modal';
import { getCheckInSuggestion, dismissCheckInBanner } from '../lib/sessionLoop';
import UniversityUpdates from './UniversityUpdates';


const DEFAULT_NOTICE = {
  tag: "NOTICE",
  text: "Counseling services are available for walk-in appointments every Monday and Thursday, 8:00 AM – 4:00 PM at the Office of Guidance and Testing.",
  linkHref: "/university-updates",
  linkLabel: "Read latest updates",
};

const QUICK_LINKS = [
  { label: 'Sessions', description: 'Schedule counseling', path: PATHS.SESSIONS, icon: CalendarDays },
  { label: 'Messages', description: 'Talk to a counselor', path: PATHS.MESSAGES, icon: MessageCircle },
  { label: 'Self-Care', description: 'Explore wellness tools', path: PATHS.SELF_CARE, icon: Heart },
  { label: 'Resources', description: 'Find helpful support', path: PATHS.RESOURCES, icon: BookOpen },
];

const HomePage = () => {
  const { authUser } = useAuthStore();

  const firstName = authUser?.fullName?.split(" ")[0] ?? "Student";
  const genid = authUser?.dynamicId;

  const [notice, setNotice] = useState(DEFAULT_NOTICE);
  const [actionModal, setActionModal] = useState(null);

  const isStudent = authUser?.userType?.toLowerCase() === 'student';

  // "Check in again?" — last completed session was 3–7 days ago, no follow-up
  const [appointments, setAppointments] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    if (!isStudent) return;
    axiosInstance.get('/appointments').then((res) => setAppointments(res.data)).catch(() => {});
  }, [isStudent]);
  const checkInSuggestion = bannerDismissed ? null : getCheckInSuggestion(appointments);
  const hasActiveChatSession = appointments.some(
    (appointment) => appointment.type === 'Chat' && ['active', 'confirmed', 'on-going'].includes(appointment.status)
  );

  useEffect(() => {
    axiosInstance.get('/notice').then((res) => {
      if (res.data) setNotice(res.data);
    }).catch(() => {});
  }, []);


  return (
    <main className="relative overflow-hidden">
      <div className="home-bg-overlay absolute inset-0 -z-10 bg-surface/70" />
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        <section className="relative overflow-hidden rounded-3xl bg-side px-6 py-8 shadow-e3 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full bg-brand-400/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-warning/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-side-ink">
                Student ID · STU-{genid}
              </span>
              <h1 className="mt-4 max-w-2xl text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-side-ink">
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {firstName}.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-side-ink-soft sm:text-base">
                Use this space to connect with counselors, schedule sessions, and find support for your well-being.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setActionModal('book')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-semibold text-side hover:bg-brand-300 transition-colors">
                  Book a session <ArrowUpRight size={16} />
                </button>
                <button type="button" onClick={() => setActionModal('message')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-side-ink hover:bg-white/10 transition-colors">
                  Message a counselor
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm lg:p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-400/15 text-brand-300">
                <ShieldCheck size={20} />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-side-ink">Your privacy matters</h2>
              <p className="mt-2 text-xs leading-6 text-side-ink-soft">
                Counselors only see your name when you allow it in your account preferences.
              </p>
              <Link to={`${PATHS.MY_ACCOUNT}?tab=preferences`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200">
                Review preferences <MoveRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section aria-label="Quick links" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map(({ label, description, path, icon: Icon }) => (
            <Link key={path} to={path} className="group rounded-2xl border border-line bg-surface p-4 shadow-e1 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-e2">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-ink">
                  <Icon size={17} />
                </span>
                <ArrowUpRight size={15} className="text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <h2 className="mt-2.5 text-sm font-semibold text-ink">{label}</h2>
              <p className="mt-1 hidden text-xs text-ink-muted sm:block">{description}</p>
            </Link>
          ))}
        </section>

        {checkInSuggestion && (
          <section className="mt-8 rounded-2xl border border-brand-200 bg-brand-soft p-5 shadow-e1">
            <p className="text-sm font-semibold text-ink">Ready for a follow-up?</p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              It's been a few days since your session on {checkInSuggestion.date}. {checkInSuggestion.counselorName || 'Your counselor'} is here whenever you're ready.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Link to={PATHS.SESSIONS} className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-brand-fg hover:bg-brand-700">Book follow-up</Link>
              <button onClick={() => { dismissCheckInBanner(); setBannerDismissed(true); }} className="px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink">Not now</button>
            </div>
          </section>
        )}

        <UniversityUpdates embedded limit={3} notice={notice} />
      </div>

      <Modal
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        title={actionModal === 'book' ? 'Book a Session' : 'Message a Counselor'}
        description={actionModal === 'book'
          ? 'Choose how you would like to connect.'
          : hasActiveChatSession
            ? 'Your active chat session is ready.'
            : 'Messaging requires an accepted chat session.'}
      >
        {actionModal === 'book' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to={PATHS.SESSIONS} state={{ openSessionModal: 'face-to-face' }} onClick={() => setActionModal(null)} className="group rounded-xl border border-line p-4 hover:border-brand-400 hover:bg-brand-soft transition-colors">
              <CalendarDays size={20} className="text-brand-600" />
              <h3 className="mt-3 text-sm font-semibold text-ink">Face-to-face</h3>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Choose an available counselor, date, and time.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">View availability <ArrowUpRight size={13} /></span>
            </Link>
            <Link to={PATHS.SESSIONS} state={{ openSessionModal: 'chat' }} onClick={() => setActionModal(null)} className="group rounded-xl border border-line p-4 hover:border-brand-400 hover:bg-brand-soft transition-colors">
              <MessageCircle size={20} className="text-brand-600" />
              <h3 className="mt-3 text-sm font-semibold text-ink">Chat session</h3>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Request a private online conversation with a counselor.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">Request session <ArrowUpRight size={13} /></span>
            </Link>
          </div>
        ) : hasActiveChatSession ? (
          <div>
            <div className="rounded-xl border border-brand-200 bg-brand-soft p-4">
              <p className="text-sm font-medium text-ink">Active chat session found</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Continue your private conversation with your counselor.</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Link to={PATHS.MESSAGES} onClick={() => setActionModal(null)} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-brand-fg hover:bg-brand-700">Open messages</Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-medium text-ink">No active chat session</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">Request a chat session and wait for a counselor to accept it before messaging.</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Link to={PATHS.SESSIONS} state={{ openSessionModal: 'chat' }} onClick={() => setActionModal(null)} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-brand-fg hover:bg-brand-700">Request chat session</Link>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default HomePage;
