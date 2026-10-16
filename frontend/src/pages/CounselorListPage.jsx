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
   face-to-face session — phrase it the way a student would read it.
   Card = portrait photo with a frosted-glass details panel over the bottom. */
const CounselorCard = ({ counselor, onBook }) => {
  const inSession = counselor.status === 'Busy';
  return (
    <article className="group relative isolate flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-line bg-line shadow-e1 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2 sm:aspect-[4/5] sm:min-h-0">
      {counselor.profilePic ? (
        <img
          src={counselor.profilePic}
          alt={`${counselor.fullName} profile photo`}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-800">
          <User size={48} className="text-brand-fg/40" aria-hidden="true" />
        </div>
      )}

      {/* Keep the details legible without hiding the counselor's portrait. */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" aria-hidden="true" />

      <div className="relative mt-auto mx-3 mb-3 rounded-xl border border-line-strong/50 bg-surface/80 p-4 shadow-e1 backdrop-blur-xs sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Counselor</p>
            <h3 className="mt-1 truncate text-base font-semibold tracking-[-0.01em] text-ink">{counselor.fullName}</h3>
          </div>
          <StatusBadge tone={inSession ? 'warning' : 'success'}>
            {inSession ? 'In session' : 'Available'}
          </StatusBadge>
        </div>
        <p className="mt-3 text-xs font-medium leading-relaxed text-ink-soft">{counselor.department || DEPARTMENT} Department</p>
        <p className="mt-1 text-xs text-ink-muted">{inSession ? 'May respond after the current session.' : 'Ready to support your next step.'}</p>
        <Button size="md" variant="primary" icon={CalendarPlus} onClick={() => onBook()} className="mt-4 w-full">
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
