import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarPlus, RefreshCw, User, Users } from 'lucide-react';
import PageShell from '../ui/PageShell';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { PageShellSkeleton } from '../components/skeleton';
import { axiosInstance } from '../lib/axios';
import BookingModal from '../components/modals/BookingModal';

/* Fallback for counselors an admin hasn't assigned a college to yet. */
const DEPARTMENT = 'Office of Guidance and Testing';

/* "Busy" from /message/users means the counselor is currently inside a
   face-to-face session — phrase it the way a student would read it. */
const CounselorCard = ({ counselor, onBook }) => {
  const inSession = counselor.status === 'Busy';
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-e1 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-e2">
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-50 via-brand-soft to-brand-100">
        <div className="absolute inset-x-6 top-1/2 h-px bg-brand-200/80" aria-hidden="true" />
        <div className="absolute left-8 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brand-500" aria-hidden="true" />
        <div className="absolute right-8 top-1/2 size-2 -translate-y-1/2 rounded-full bg-brand-300" aria-hidden="true" />
        <span className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700/70">Support route</span>
      </div>

      <div className="relative px-5 pb-5">
        <div className="-mt-10 flex items-end justify-between gap-3">
          {counselor.profilePic ? (
            <img
              src={counselor.profilePic}
              alt={`${counselor.fullName} profile photo`}
              loading="lazy"
              className="size-24 rounded-2xl border-4 border-surface object-cover shadow-e1"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-surface bg-brand-600 text-brand-fg shadow-e1">
              <User size={30} aria-hidden="true" />
            </div>
          )}
          <StatusBadge tone={inSession ? 'warning' : 'success'}>
            {inSession ? 'In session' : 'Available'}
          </StatusBadge>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Counselor</p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-ink">{counselor.fullName}</h3>
          <p className="mt-2 text-xs font-medium leading-relaxed text-ink-soft">{counselor.department || DEPARTMENT} Department</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{inSession ? 'May respond after the current session.' : 'Ready to support your next step.'}</p>
        </div>

        <Button size="md" variant="primary" icon={CalendarPlus} onClick={() => onBook()} className="mt-5 w-full">
          Book session
        </Button>
      </div>
    </article>
  );
};

const CounselorListPage = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingCounselor, setBookingCounselor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/message/users');
        if (cancelled) return;
        setCounselors(res.data ?? []);
        setError(null);
      } catch {
        if (cancelled) return;
        setError('Could not load counselors.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  if (loading) {
    return (
      <PageShell title="Meet our Counselors" description="The counselors of the Office of Guidance and Testing">
        <PageShellSkeleton count={3} />
      </PageShell>
    );
  }

  // Available counselors first, then alphabetically.
  const sorted = [...counselors].sort((a, b) =>
    (a.status === 'Busy' ? 1 : 0) - (b.status === 'Busy' ? 1 : 0)
    || (a.fullName || '').localeCompare(b.fullName || ''),
  );

  return (
    <PageShell
      title="Meet our Counselors"
      description="Book a chat or face-to-face session with the counselor you're most comfortable with — sessions start once your request is admitted."
    >
      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load counselors"
          description={error}
          action={<Button size="sm" variant="secondary" icon={RefreshCw} onClick={retry}>Try again</Button>}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No counselors yet"
          description="Counselor accounts will appear here once the Office of Guidance and Testing registers them."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {sorted.map((counselor) => (
            <CounselorCard
              key={counselor._id}
              counselor={counselor}
              onBook={() => setBookingCounselor(counselor)}
            />
          ))}
        </div>
      )}

      {bookingCounselor && (
        <BookingModal counselor={bookingCounselor} onClose={() => setBookingCounselor(null)} />
      )}
    </PageShell>
  );
};

export default CounselorListPage;
