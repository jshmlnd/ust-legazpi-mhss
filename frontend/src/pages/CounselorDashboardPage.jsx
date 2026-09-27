import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, CalendarDays, ClipboardCheck, Clock,
  Pencil, RefreshCw, UserCheck,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-toastify';
import PageShell from '../ui/PageShell';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Textarea } from '../ui';
import SectionDivider from '../components/SectionDivider';
import { PageShellSkeleton } from '../components/skeleton';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { PATHS } from '../lib/routes';
import { getSocket } from '../lib/socket';

/* Theme-aware charts — shared palette hook lives in lib/useChartTheme. */
import { useChartTheme } from '../lib/useChartTheme';

/* ──────────────────────── weekly sessions trend ──────────────────────── */

const TrendTooltip = ({ active, payload, label, colors }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-raised border border-line rounded-lg px-3.5 py-2.5 shadow-e2">
      <p className="text-[11px] font-semibold text-ink-muted">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-ink">
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: colors?.[p.dataKey] ?? p.color }} aria-hidden="true" />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const SessionsTrendChart = ({ data }) => {
  const theme = useChartTheme();
  const series = { chat: { name: 'Chat', color: theme.brand }, f2f: { name: 'Face-to-Face', color: theme.warning } };

  return (
    <Card
      title="Weekly Sessions Trend"
      description="Chat & Face-to-Face sessions per day"
      footer={
        <Link
          to={PATHS.SESSION_REQUESTS}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-soft-ink hover:underline"
        >
          View session requests <ArrowRight size={12} aria-hidden="true" />
        </Link>
      }
    >
      {data.length === 0 ? (
        <EmptyState compact icon={CalendarDays} title="No sessions yet" description="Trends will appear once students start booking appointments." />
      ) : (
        <>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.muted} strokeOpacity={0.6} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={theme.tick} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={theme.tick} dx={-4} />
                <Tooltip
                  content={<TrendTooltip colors={{ chat: theme.brand, f2f: theme.warning }} />}
                  cursor={{ stroke: theme.muted, strokeWidth: 1 }}
                />
                <Line
                  type="monotone" dataKey="chat" name={series.chat.name} stroke={series.chat.color} strokeWidth={2}
                  dot={{ r: 3, fill: series.chat.color, stroke: theme.dotStroke, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: series.chat.color, stroke: theme.dotStroke, strokeWidth: 2 }}
                />
                <Line
                  type="monotone" dataKey="f2f" name={series.f2f.name} stroke={series.f2f.color} strokeWidth={2} strokeDasharray="6 3"
                  dot={{ r: 3, fill: series.f2f.color, stroke: theme.dotStroke, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: series.f2f.color, stroke: theme.dotStroke, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-center gap-5">
            {Object.entries(series).map(([key, s]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                {s.name}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

/* ───────────────────────────── metric tiles ───────────────────────────── */

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <div className="bg-surface px-6 py-6">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <Icon size={15} className="text-ink-muted/70 shrink-0" aria-hidden="true" />
    </div>
    <p className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-light tracking-[-0.02em] text-ink leading-none">{value}</p>
    <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
  </div>
);

/* ──────────────────────────── homepage notice ──────────────────────────── */

const NoticeCard = ({ notice, form, onChange, onSave, saving, loading, error, onRetry }) => (
  <Card
    title="Notice Management"
    description="Shown to students at the top of their home page."
    actions={
      notice && (
        <Button size="sm" icon={Pencil} loading={saving} disabled={!form.text.trim() || form.text === (notice.text || '')} onClick={onSave}>
          Save
        </Button>
      )
    }
  >
    {loading ? (
      <div className="space-y-2" aria-hidden="true">
        <div className="skeleton h-10 w-full rounded-lg" />
        <div className="skeleton h-4 w-40" />
      </div>
    ) : error ? (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex items-center gap-2 text-sm text-danger-ink">
          <AlertTriangle size={16} aria-hidden="true" />
          {error}
        </div>
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={onRetry}>Try again</Button>
      </div>
    ) : (
      <Textarea
        value={form.text}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        resize="y"
        aria-label="Homepage notice text"
        className="max-w-2xl"
        placeholder="Write the notice students will see..."
      />
    )}
  </Card>
);

/* ──────────────────────────────── page ──────────────────────────────── */

const CounselorDashboardPage = () => {
  const { authUser } = useAuthStore();
  const name = authUser?.fullName ?? 'Counselor';

  const [metrics, setMetrics] = useState(null);
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notice, setNotice] = useState(null);
  const [noticeForm, setNoticeForm] = useState({ text: '' });
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeError, setNoticeError] = useState(null);
  const [savingNotice, setSavingNotice] = useState(false);

  // Loaders live inside the mount effect (where the react-hooks rules can
  // verify no setState happens synchronously) and are exposed via ref so the
  // retry buttons, socket handler, and poll can reuse the same fetches.
  const loaders = useRef({});

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const [metricsRes, trendRes] = await Promise.all([
          axiosInstance.get('/analytics/dashboard'),
          axiosInstance.get('/analytics/weekly-sessions'),
        ]);
        if (cancelled) return;
        const m = metricsRes.data;
        setMetrics([
          { icon: UserCheck, label: 'Active Students', value: String(m.activeStudents ?? 0), hint: 'With at least one session' },
          { icon: Activity, label: 'Avg. Active Students (Monthly Average)', value: m.avgActiveStudents > 0 ? String(m.avgActiveStudents) : '—', hint: 'Distinct students per month, last 6 months' },
          { icon: ClipboardCheck, label: 'Completed', value: String(m.completedSessions), hint: 'Sessions completed' },
          { icon: Clock, label: 'Pending', value: String(m.pendingSessions), hint: 'Awaiting action' },
        ]);
        setWeeklySessions(trendRes.data ?? []);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch dashboard:', err);
        setError('Could not load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchNotice = async () => {
      try {
        const res = await axiosInstance.get('/notice');
        if (cancelled) return;
        setNotice(res.data);
        // Pre-fill the editor with the current text so Save only enables on real edits.
        setNoticeForm({ text: res.data.text || '' });
        setNoticeError(null);
      } catch {
        if (cancelled) return;
        setNoticeError("Couldn't load the notice.");
      } finally {
        if (!cancelled) setNoticeLoading(false);
      }
    };

    loaders.current = { dashboard: fetchDashboard, notice: fetchNotice };
    fetchDashboard();
    fetchNotice();

    const socket = getSocket();
    const handleUpdated = () => loaders.current.dashboard?.();
    if (socket) socket.on('appointment:updated', handleUpdated);
    const poll = setInterval(() => loaders.current.dashboard?.(), 15000);

    return () => {
      cancelled = true;
      if (socket) socket.off('appointment:updated', handleUpdated);
      clearInterval(poll);
    };
  }, []);

  const retryDashboard = () => {
    loaders.current.dashboard?.();
  };

  const retryNotice = () => {
    setNoticeLoading(true);
    loaders.current.notice?.();
  };

  const handleSaveNotice = async () => {
    if (!noticeForm.text.trim()) return;
    setSavingNotice(true);
    try {
      const res = await axiosInstance.put('/notice', {
        ...noticeForm,
        tag: 'NOTICE',
        linkHref: PATHS.UNIVERSITY_UPDATES,
        linkLabel: 'Read latest updates',
      });
      setNotice(res.data);
      setNoticeForm({ text: res.data.text || '' });
      toast.success('Notice updated');
    } catch {
      toast.error('Failed to update notice');
    } finally {
      setSavingNotice(false);
    }
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <PageShell title={`${greeting}, ${name}`} description={dateStr}>
        <PageShellSkeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${greeting}, ${name}`}
      description={dateStr}
      actions={
        <>
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-soft0/60 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-soft0" />
          </span>
        </>
      }
    >
      {error && !metrics && (
        <div className="mb-6 flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-10">
          <div className="flex items-center gap-2 text-sm text-danger-ink">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={retryDashboard}>Try again</Button>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-lg overflow-hidden mb-8">
            {metrics.map((m) => (
              <StatCard key={m.label} icon={m.icon} label={m.label} value={m.value} hint={m.hint} />
            ))}
          </div>

          <SectionDivider label="DATA ANALYTICS & NOTICE" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <SessionsTrendChart data={weeklySessions} />
            <NoticeCard
              notice={notice}
              form={noticeForm}
              onChange={(text) => setNoticeForm({ text })}
              onSave={handleSaveNotice}
              saving={savingNotice}
              loading={noticeLoading}
              error={noticeError}
              onRetry={retryNotice}
            />
          </div>
        </>
      )}
    </PageShell>
  );
};

export default CounselorDashboardPage;
