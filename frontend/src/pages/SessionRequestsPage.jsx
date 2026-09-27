import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, Check, Clock, MessageSquare, RefreshCw, Trash2, X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../ui/PageShell';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { PageShellSkeleton } from '../components/skeleton';
import { axiosInstance } from '../lib/axios';
import { confirmAction } from '../lib/confirm';
import { PATHS } from '../lib/routes';
import { getSocket } from '../lib/socket';

/* ─────────────────────── request rows (moved from dashboard) ─────────────────────── */

const STATUS_LABELS = {
  pending: 'Pending',
  'on-going': 'On-going',
  paused: 'Paused',
  ended: 'Ended',
  confirmed: 'Approved',
  active: 'Accepted',
  declined: 'Declined',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ACTIONABLE = ['active', 'on-going', 'confirmed'];

const getRowActions = (session) => {
  if (session.status === 'pending') {
    return [
      { key: 'accept', label: 'Accept', icon: Check, variant: 'primary', onClick: 'accept' },
      { key: 'decline', label: 'Decline', icon: X, variant: 'secondary', onClick: 'decline' },
    ];
  }
  if (ACTIONABLE.includes(session.status)) {
    return session.type === 'Chat'
      ? [{ key: 'join', label: 'Join Chat', icon: MessageSquare, variant: 'primary', to: `${PATHS.MESSAGES}?user=${session.studentId}` }]
      : [{ key: 'view', label: 'View', icon: CalendarDays, variant: 'secondary', to: `${PATHS.COUNSELOR_SCHEDULE}?date=${session.date}` }];
  }
  return null;
};

const TypeBadge = ({ type }) => (
  <StatusBadge tone={type === 'Chat' ? 'brand' : 'warning'}>{type === 'Chat' ? 'Chat' : 'Face-to-Face'}</StatusBadge>
);

const RequestsTable = ({ sessions, error, onRetry, onAccept, onDecline, busy, onClearAll, clearingAll }) => {
  const navigate = useNavigate();
  const pendingCount = sessions.filter((s) => s.status === 'pending').length;

  const renderActions = (session) => {
    const actions = getRowActions(session);
    if (!actions) return null;
    const isBusy = busy?.id === session._id;
    return (
      <div className="flex items-center justify-end gap-2">
        {actions.map((a) => (
          <Button
            key={a.key}
            size="sm"
            variant={a.variant}
            icon={a.icon}
            disabled={isBusy && busy.action !== a.key}
            loading={isBusy && busy.action === a.key}
            onClick={() => (a.onClick === 'accept' ? onAccept(session) : a.onClick === 'decline' ? onDecline(session) : navigate(a.to))}
          >
            {a.label}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Card
      title="Session Requests"
      description={sessions.length > 0 ? `${pendingCount} pending · ${sessions.length} total` : 'Appointment and chat requests from students'}
      actions={
        sessions.length > 0 && (
          <Button size="sm" variant="danger-outline" icon={Trash2} loading={clearingAll} onClick={onClearAll}>
            Clear All
          </Button>
        )
      }
      bodyClassName="!px-0 !py-0"
    >
      {error ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="flex items-center gap-2 text-sm text-danger-ink">
            <AlertTriangle size={16} aria-hidden="true" />
            Couldn&apos;t load session requests.
          </div>
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>Try again</Button>
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarDays}
          title="No session requests"
          description="Requests will appear here when students book appointments or start chats."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Student</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Type</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Time</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Status</th>
                  <th scope="col" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id} className="border-b border-line last:border-b-0 hover:bg-canvas/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-ink">{session.studentName || session.id}</p>
                      {session.studentName && <p className="text-xs text-ink-muted">{session.id}</p>}
                    </td>
                    <td className="px-5 py-3.5"><TypeBadge type={session.type} /></td>
                    <td className="px-5 py-3.5 text-sm text-ink-soft whitespace-nowrap">{session.date} {session.time}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={session.status}>{STATUS_LABELS[session.status] ?? session.status}</StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-right">{renderActions(session)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-line">
            {sessions.map((session) => (
              <div key={`card-${session._id}`} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{session.studentName || session.id}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                      <Clock size={12} aria-hidden="true" />
                      {session.date} {session.time}
                    </p>
                  </div>
                  <TypeBadge type={session.type} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={session.status}>{STATUS_LABELS[session.status] ?? session.status}</StatusBadge>
                  {renderActions(session)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

/* ──────────────────────────────── page ──────────────────────────────── */

const STATUS_ORDER = { pending: 0, active: 1, 'on-going': 1, confirmed: 1, paused: 2, declined: 3, ended: 4, completed: 4, cancelled: 5 };

const sortSessions = (list) => [...list].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

const SessionRequestsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [busy, setBusy] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  // Loader lives inside the mount effect (where the react-hooks rules can
  // verify no setState happens synchronously) and is exposed via ref so the
  // retry button, socket handler, and poll can reuse the same fetch.
  const loaders = useRef({});

  useEffect(() => {
    let cancelled = false;

    const fetchRequests = async () => {
      try {
        const res = await axiosInstance.get('/analytics/upcoming-sessions');
        if (cancelled) return;
        setSessions(sortSessions(res.data ?? []));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch session requests:', err);
        setError('Could not load session requests.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loaders.current = { requests: fetchRequests };
    fetchRequests();

    const socket = getSocket();
    const handleUpdated = () => loaders.current.requests?.();
    if (socket) socket.on('appointment:updated', handleUpdated);
    const poll = setInterval(() => loaders.current.requests?.(), 15000);

    return () => {
      cancelled = true;
      if (socket) socket.off('appointment:updated', handleUpdated);
      clearInterval(poll);
    };
  }, []);

  const retryRequests = () => {
    setRefreshing(true);
    Promise.resolve(loaders.current.requests?.()).finally(() => setRefreshing(false));
  };

  const handleAccept = async (session) => {
    setBusy({ id: session._id, action: 'accept' });
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { status: 'active' });
      setSessions((prev) => prev.map((s) => (s._id === session._id ? { ...s, status: 'active' } : s)));
      toast.success(`Accepted request from ${session.studentName || session.id}`);
    } catch {
      toast.error('Failed to accept request.');
    } finally {
      setBusy(null);
    }
  };

  const handleDecline = async (session) => {
    setBusy({ id: session._id, action: 'decline' });
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { status: 'declined' });
      setSessions((prev) => prev.map((s) => (s._id === session._id ? { ...s, status: 'declined' } : s)));
      toast.success(`Declined request from ${session.studentName || session.id}`);
    } catch {
      toast.error('Failed to decline request.');
    } finally {
      setBusy(null);
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirmAction({
      title: 'Clear all requests? This will hide them for you but keep student records intact.',
      confirmLabel: 'Clear',
    });
    if (!confirmed) return;
    setClearingAll(true);
    try {
      await axiosInstance.post('/appointments/clear-all');
      setSessions([]);
      toast.success('All requests cleared');
    } catch {
      toast.error('Failed to clear requests.');
    } finally {
      setClearingAll(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Session Requests" description="Appointment and chat requests from students">
        <PageShellSkeleton count={3} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Session Requests"
      description="Appointment and chat requests from students"
      actions={
        <Button size="sm" variant="secondary" icon={RefreshCw} loading={refreshing} onClick={retryRequests}>
          Refresh
        </Button>
      }
    >
      <RequestsTable
        sessions={sessions}
        error={error && sessions.length === 0 ? error : null}
        onRetry={retryRequests}
        onAccept={handleAccept}
        onDecline={handleDecline}
        busy={busy}
        onClearAll={handleClearAll}
        clearingAll={clearingAll}
      />
    </PageShell>
  );
};

export default SessionRequestsPage;
