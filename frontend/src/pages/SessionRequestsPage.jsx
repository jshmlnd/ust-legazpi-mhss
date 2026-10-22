import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, Check, Clock, FileText, MessageSquare, Pencil, RefreshCw, Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../ui/PageShell';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import EmptyState from '../ui/EmptyState';
import { PageShellSkeleton } from '../components/skeleton';
import ActionLevelModal from '../components/modals/ActionLevelModal';
import SessionFeedbackModal from '../components/SessionFeedbackModal';
import { axiosInstance } from '../lib/axios';
import { PATHS } from '../lib/routes';
import { getSocket } from '../lib/socket';

/* ─────────────────────── request rows (moved from dashboard) ─────────────────────── */

// "Action taken" levels recorded on an appointment (backend actionTaken enum).
const ACTION_TONES = { gca: 'success', referred: 'info', adjunct: 'warning' };
const actionTakenLabel = (session) => {
  if (session.actionTaken === 'gca') return 'Level 1 - GCA (Admitted)';
  if (session.actionTaken === 'referred') {
    return `Level 2 - Referred (Referred to ${session.counselorName || 'counselor'}${session.referredByName ? ` by ${session.referredByName}` : ''})`;
  }
  if (session.actionTaken === 'adjunct') return 'Level 3 - Adjunct';
  return null;
};

const ACTIONABLE = ['active', 'on-going', 'confirmed'];

const getRowActions = (session) => {
  if (session.status === 'pending') {
    return [
      { key: 'admit', label: 'Admit', icon: Check, variant: 'primary', onClick: 'admit' },
    ];
  }
  if (ACTIONABLE.includes(session.status)) {
    return session.type === 'Chat'
      ? [{ key: 'join', label: 'Join Chat', icon: MessageSquare, variant: 'primary', to: `${PATHS.MESSAGES}?user=${session.studentId}` }]
      : [{ key: 'view', label: 'View', icon: CalendarDays, variant: 'secondary', to: `${PATHS.COUNSELOR_SCHEDULE}?date=${session.date}` }];
  }
  if (['completed', 'ended'].includes(session.status)) {
    return [{
      key: 'summary',
      label: session.summary ? 'Review' : 'Document',
      icon: FileText,
      variant: 'secondary',
      onClick: 'summary',
    }];
  }
  return null;
};

const actionTakenShortLabel = (session) => {
  if (session.actionTaken === 'gca') return 'Level 1 - Admitted';
  if (session.actionTaken === 'referred') return 'Level 2 - Referred';
  if (session.actionTaken === 'adjunct') return 'Level 3 - Adjunct';
  return null;
};

const TypeBadge = ({ type }) => (
  <StatusBadge
    tone={type === 'Chat' ? 'brand' : 'warning'}
    className="whitespace-nowrap"
    title={type === 'Chat' ? 'Chat' : 'Face-to-Face'}
  >
    {type === 'Chat' ? 'Chat' : 'Face-to-Face'}
  </StatusBadge>
);

const RiskBadge = ({ risk = 'Minimal' }) => (
  <StatusBadge tone={risk === 'Urgent' ? 'danger' : risk === 'High' ? 'warning' : 'neutral'}>{risk}</StatusBadge>
);

const RequestsTable = ({ sessions, error, onRetry, onAdmit, onEditLevel, onSummary, busy, onClearAll, clearingAll }) => {
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
            onClick={() => {
              if (a.onClick === 'admit') onAdmit(session);
              else if (a.onClick === 'summary') onSummary(session);
              else navigate(a.to);
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
    );
  };

  const renderActionTaken = (session) => {
    const label = actionTakenLabel(session);
    const shortLabel = actionTakenShortLabel(session);
    const editable = ACTIONABLE.includes(session.status);
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        {label ? (
          <StatusBadge
            tone={ACTION_TONES[session.actionTaken]}
            preserveCase
            className="min-w-0 max-w-full truncate"
            title={label}
          >
            {shortLabel}
          </StatusBadge>
        ) : (
          <span className="text-xs text-ink-muted">—</span>
        )}
        {editable && (
          <Button
            size="sm"
            variant="tertiary"
            icon={Pencil}
            aria-label={`Change action taken for ${session.studentName || session.id}`}
            onClick={() => onEditLevel(session)}
            className="!px-2 shrink-0"
          />
        )}
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
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-32" />
                <col className="w-36" />
                <col />
                <col className="w-24" />
                <col className="w-44" />
                <col className="w-72" />
                <col className="w-52" />
              </colgroup>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Student</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Type</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Concern</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Risk</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Time</th>
                  <th scope="col" className="px-5 py-3 text-xs font-semibold text-ink-muted">Action taken</th>
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
                    <td className="px-5 py-3.5 max-w-56 text-sm text-ink-soft truncate" title={session.concern}>{session.concern || '—'}</td>
                    <td className="px-5 py-3.5"><RiskBadge risk={session.concernRisk} /></td>
                    <td className="px-5 py-3.5 text-sm text-ink-soft whitespace-nowrap">{session.date} {session.time}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap overflow-hidden">{renderActionTaken(session)}</td>
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
                {session.concern && <p className="text-xs text-ink-soft line-clamp-2">{session.concern}</p>}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={session.concernRisk} />
                    {renderActionTaken(session)}
                  </div>
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
const RISK_ORDER = { Urgent: 0, High: 1, Low: 2, Minimal: 3 };

const sortSessions = (list) => [...list].sort((a, b) =>
  (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  || (RISK_ORDER[a.concernRisk] ?? 3) - (RISK_ORDER[b.concernRisk] ?? 3)
);

const SessionRequestsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [busy, setBusy] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const [counselors, setCounselors] = useState([]);
  const [levelSession, setLevelSession] = useState(null);
  const [levelChoice, setLevelChoice] = useState('gca');
  const [referredId, setReferredId] = useState('');
  const [savingLevel, setSavingLevel] = useState(false);
  const [summarySession, setSummarySession] = useState(null);

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

    axiosInstance.get('/appointments/counselors')
      .then((res) => { if (!cancelled) setCounselors(res.data ?? []); })
      .catch(() => {});

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

  const handleAdmit = async (session) => {
    setBusy({ id: session._id, action: 'admit' });
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { status: 'active', actionTaken: 'gca' });
      setSessions((prev) => prev.map((s) => (s._id === session._id ? { ...s, status: 'active', actionTaken: 'gca' } : s)));
      toast.success(`Admitted request from ${session.studentName || session.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to admit request.');
    } finally {
      setBusy(null);
    }
  };

  const openLevelEditor = (session) => {
    setLevelSession(session);
    setLevelChoice(session.actionTaken || 'gca');
    setReferredId(counselors[0] ? String(counselors[0]._id) : '');
  };

  const saveLevel = async () => {
    if (!levelSession) return;
    if (levelChoice === 'referred' && !referredId) {
      toast.error('Choose a counselor to refer to.');
      return;
    }
    setSavingLevel(true);
    try {
      await axiosInstance.patch(`/appointments/${levelSession._id}`, levelChoice === 'referred'
        ? { actionTaken: 'referred', counselorId: Number(referredId) }
        : { actionTaken: levelChoice });
      if (levelChoice === 'referred') {
        const name = counselors.find((c) => String(c._id) === referredId)?.fullName || 'the counselor';
        setSessions((prev) => prev.filter((s) => s._id !== levelSession._id));
        toast.success(`Referred to ${name} — the request moved to their list.`);
      } else {
        setSessions((prev) => prev.map((s) => (s._id === levelSession._id ? { ...s, actionTaken: levelChoice } : s)));
        toast.success('Action taken updated.');
      }
      setLevelSession(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update action taken.');
    } finally {
      setSavingLevel(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all requests? This will hide them for you but keep student records intact.')) return;
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

  const handleSummarySaved = (saved) => {
    setSessions((prev) => prev.map((session) => (
      session._id === summarySession?._id
        ? {
          ...session,
          summary: saved.summary,
          summaryGeneratedAt: saved.generatedAt,
          summaryEditedAt: saved.editedAt,
          summaryGeneratedByAi: saved.generatedByAi,
        }
        : session
    )));
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
        onAdmit={handleAdmit}
        onEditLevel={openLevelEditor}
        onSummary={setSummarySession}
        busy={busy}
        onClearAll={handleClearAll}
        clearingAll={clearingAll}
      />

      <ActionLevelModal
        isOpen={!!levelSession}
        onClose={() => setLevelSession(null)}
        levelSession={levelSession}
        levelChoice={levelChoice}
        setLevelChoice={setLevelChoice}
        referredId={referredId}
        setReferredId={setReferredId}
        counselors={counselors}
        savingLevel={savingLevel}
        saveLevel={saveLevel}
      />

      <SessionFeedbackModal
        key={summarySession?._id || 'session-summary'}
        open={!!summarySession}
        onClose={() => setSummarySession(null)}
        appointment={summarySession}
        isStudent={false}
        onSaved={handleSummarySaved}
      />
    </PageShell>
  );
};

export default SessionRequestsPage;
