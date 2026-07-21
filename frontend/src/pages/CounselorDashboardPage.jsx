import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Loader, MessageSquare, Megaphone, Trash2, RotateCcw } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { PATHS } from '../lib/routes';
import { getSocket } from '../lib/socket';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 px-4 py-3 rounded-sm">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-neutral-900">Score: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const SentimentChart = ({ data }) => (
  <div className="bg-white border border-neutral-200 rounded-sm">
    <div className="px-6 pt-6 pb-2">
      <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Client Engagement &amp; Sentiment</span>
      <h3 className="mt-1 text-sm font-medium text-neutral-900">Weekly Mood Trend</h3>
    </div>
    <div className="px-2 pb-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} dy={8} />
          <YAxis domain={[4, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} dx={-4} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d4', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} fill="url(#sentimentFill)" dot={{ r: 3, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DISTRIBUTION_COLORS = ['#0f766e', '#d4d4d4'];

const SessionChart = ({ data }) => (
  <div className="bg-white border border-neutral-200 rounded-sm">
    <div className="px-6 pt-6 pb-2">
      <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Session Distribution</span>
      <h3 className="mt-1 text-sm font-medium text-neutral-900">Chat vs Face-to-Face</h3>
    </div>
    <div className="px-2 pb-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }} barSize={48}>
          <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} dx={-4} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f5f5' }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.type} fill={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AnalyticsSummary = ({ data }) => (
  <div className="bg-white border border-neutral-200 rounded-sm p-6">
    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Analytics Summary</span>
    <div className="mt-5 space-y-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-neutral-400 mb-2">Peak Appointment Hours</p>
        <p className="text-sm font-medium text-neutral-900">{data.peakHours}</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">Highest appointment volume</p>
      </div>
      <div className="h-px bg-neutral-100" />
      <div>
        <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-neutral-400 mb-2">Most Available Resources</p>
        <p className="text-sm font-medium text-neutral-900">{data.topResources}</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">By resource type count</p>
      </div>
      <div className="h-px bg-neutral-100" />
      <div>
        <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-neutral-400 mb-2">Avg. Session Duration</p>
        <p className="text-sm font-medium text-neutral-900">{data.avgDuration}</p>
        <p className="text-[11px] text-neutral-500 mt-0.5">{data.accessPct}% of students have booked</p>
      </div>
    </div>
  </div>
);

const UpcomingSessions = ({ sessions, onAccept, onDecline, acceptingId, onEndSession, endingSessionId }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-neutral-200 rounded-sm">
      <div className="px-6 pt-6 pb-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Upcoming Sessions</span>
          <h3 className="mt-1 text-sm font-medium text-neutral-900">All Requests</h3>
        </div>
        <span className="text-[11px] font-medium text-neutral-400">{sessions.length} total</span>
      </div>
      {sessions.length === 0 ? (
        <div className="px-6 py-8 text-center text-xs text-neutral-400">No upcoming sessions.</div>
      ) : (
      <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-t border-neutral-100">
              <th className="px-6 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Student ID</th>
              <th className="px-6 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Type</th>
              <th className="px-6 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Time</th>
              <th className="px-6 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Status</th>
              <th className="px-6 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={`${session.id}-${session.date}-${session.time}`} className="border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-3.5 text-sm font-medium text-neutral-900">{session.id}</td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-semibold tracking-[0.05em] uppercase ${session.type === 'Chat' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {session.type === 'Chat' ? 'Chat' : 'Face-to-Face'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-neutral-600">{session.date} {session.time}</td>
                <td className="px-6 py-3.5">
                  {session.status === 'pending' ? (
                    <span className="text-[11px] font-medium text-amber-600">Awaiting</span>
                  ) : session.status === 'active' ? (
                    <span className="text-[11px] font-medium text-emerald-600">Accepted</span>
                  ) : session.status === 'declined' ? (
                    <span className="text-[11px] font-medium text-red-500">Declined</span>
                  ) : session.status === 'completed' ? (
                    <span className="text-[11px] font-medium text-neutral-400">Completed</span>
                  ) : (
                    <span className="text-[11px] font-medium text-neutral-400">{session.status}</span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-right">
                  {session.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onAccept(session)}
                        disabled={acceptingId === session.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50"
                      >
                        {acceptingId === session.id ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                        Accept
                      </button>
                      <button
                        onClick={() => onDecline(session)}
                        disabled={acceptingId === session.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-neutral-500 border border-neutral-300 hover:text-red-600 hover:border-red-300 transition-colors rounded-sm disabled:opacity-50"
                      >
                        <X size={12} />
                        Decline
                      </button>
                    </div>
                  ) : session.status === 'active' ? (
                    <div className="flex items-center justify-end gap-2">
                      {session.type === 'Chat' ? (
                        <button
                          onClick={() => navigate(`${PATHS.MESSAGES}?user=${session.studentId}`)}
                          className="px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                        >
                          Join Chat
                        </button>
                      ) : (
                        <span className="px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm">
                          Approved
                        </span>
                      )}
                      <button
                        onClick={() => onEndSession(session)}
                        disabled={endingSessionId === session.id}
                        className="px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50"
                      >
                        {endingSessionId === session.id ? <Loader size={12} className="animate-spin" /> : 'End'}
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sessions.map((session) => (
          <div key={`card-${session.id}-${session.date}-${session.time}`} className="border border-neutral-100 rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-900">{session.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-semibold tracking-[0.05em] uppercase ${session.type === 'Chat' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {session.type === 'Chat' ? 'Chat' : 'Face-to-Face'}
              </span>
            </div>
            <p className="text-xs text-neutral-500">{session.date} {session.time}</p>
            <div className="flex items-center justify-between">
              {session.status === 'pending' ? (
                <span className="text-[11px] font-medium text-amber-600">Awaiting</span>
              ) : session.status === 'active' ? (
                <span className="text-[11px] font-medium text-emerald-600">Accepted</span>
              ) : session.status === 'declined' ? (
                <span className="text-[11px] font-medium text-red-500">Declined</span>
              ) : (
                <span className="text-[11px] font-medium text-neutral-400">{session.status}</span>
              )}
              <div className="flex items-center gap-2">
                {session.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => onAccept(session)}
                      disabled={acceptingId === session.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50"
                    >
                      {acceptingId === session.id ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                      Accept
                    </button>
                    <button
                      onClick={() => onDecline(session)}
                      disabled={acceptingId === session.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-neutral-500 border border-neutral-300 hover:text-red-600 hover:border-red-300 transition-colors rounded-sm disabled:opacity-50"
                    >
                      <X size={12} />
                      Decline
                    </button>
                  </>
                ) : session.status === 'active' ? (
                  <>
                    {session.type === 'Chat' ? (
                      <button
                        onClick={() => navigate(`${PATHS.MESSAGES}?user=${session.studentId}`)}
                        className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                      >
                        Join Chat
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm">
                        Approved
                      </span>
                    )}
                    <button
                      onClick={() => onEndSession(session)}
                      disabled={endingSessionId === session.id}
                      className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50"
                    >
                      {endingSessionId === session.id ? <Loader size={12} className="animate-spin" /> : 'End'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
};

const ResourceTracking = () => (
  <div className="bg-white border border-neutral-200 rounded-sm p-6">
    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Client Progress</span>
    <h3 className="mt-1 text-sm font-medium text-neutral-900">Resource &amp; Self-Care Completion</h3>
    <div className="mt-5 space-y-5">
      {[{ label: 'Wellness Articles', completed: 0, total: 0 }].map((item) => {
        const pct = Math.round((item.completed / item.total) * 100);
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-600">{item.label}</span>
              <span className="text-[11px] font-medium text-neutral-400">{item.completed}/{item.total}</span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">{pct}% completion rate</p>
          </div>
        );
      })}
    </div>
  </div>
);

const CounselorDashboardPage = () => {
  const { authUser } = useAuthStore();
  const name = authUser?.fullName ?? 'Counselor';
  const [metrics, setMetrics] = useState([]);
  const [weeklySentiment, setWeeklySentiment] = useState([]);
  const [sessionDistribution, setSessionDistribution] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [summaryData, setSummaryData] = useState({ peakHours: '—', topResources: '—', avgDuration: '—', accessPct: 0 });
  const [acceptingId, setAcceptingId] = useState(null);
  const [endingSessionId, setEndingSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '' });
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  const fetchSuggestions = async () => {
    try {
      const res = await axiosInstance.get('/suggestions');
      setSuggestions(res.data);
    } catch { /* ignore */ }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axiosInstance.get('/announcements');
      setAnnouncements(res.data);
    } catch { /* ignore */ }
  };

  const deleteSuggestion = async (id) => {
    try {
      await axiosInstance.delete(`/suggestions/${id}`);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      toast.success('Suggestion removed');
    } catch {
      toast.error('Failed to delete suggestion');
    }
  };

  const restoreSuggestion = async (id) => {
    try {
      await axiosInstance.patch(`/suggestions/${id}/restore`);
      fetchSuggestions();
      toast.success('Suggestion restored');
    } catch {
      toast.error('Failed to restore suggestion');
    }
  };

  const createAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.body.trim()) return;
    setCreatingAnnouncement(true);
    try {
      const res = await axiosInstance.post('/announcements', announcementForm);
      setAnnouncements((prev) => [res.data, ...prev]);
      setAnnouncementForm({ title: '', body: '' });
      toast.success('Announcement created');
    } catch {
      toast.error('Failed to create announcement');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await axiosInstance.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success('Announcement deleted');
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  const restoreAnnouncement = async (id) => {
    try {
      await axiosInstance.patch(`/announcements/${id}/restore`);
      fetchAnnouncements();
      toast.success('Announcement restored');
    } catch {
      toast.error('Failed to restore announcement');
    }
  };

  const handleEndSession = async (session) => {
    setEndingSessionId(session.id);
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { status: 'completed' });
      setUpcomingSessions((prev) =>
        prev.map((s) => (s._id === session._id ? { ...s, status: 'completed' } : s))
      );
      toast.success(`Session ended with ${session.id}`);
    } catch { toast.error('Failed to end session.'); }
    finally { setEndingSessionId(null); }
  };

  const handleAccept = async (session) => {
    setAcceptingId(session.id);
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { status: 'active' });
      setUpcomingSessions((prev) =>
        prev.map((s) => (s._id === session._id ? { ...s, status: 'active' } : s))
      );
      toast.success(`Accepted Chat with ${session.id}`);
    } catch { toast.error('Failed to accept request.'); }
    finally { setAcceptingId(null); }
  };

  const handleDecline = async (session) => {
    setAcceptingId(session.id);
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { status: 'declined' });
      setUpcomingSessions((prev) =>
        prev.map((s) => (s._id === session._id ? { ...s, status: 'declined' } : s))
      );
      toast.success(`Declined Chat with ${session.id}`);
    } catch { toast.error('Failed to decline request.'); }
    finally { setAcceptingId(null); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, sentimentRes, distRes, upcomingRes, summaryRes] = await Promise.all([
          axiosInstance.get('/analytics/dashboard'),
          axiosInstance.get('/analytics/weekly-sentiment'),
          axiosInstance.get('/analytics/session-distribution'),
          axiosInstance.get('/analytics/upcoming-sessions'),
          axiosInstance.get('/analytics/summary'),
        ]);
        const m = metricsRes.data;
        setMetrics([
          { label: 'Total Students', value: String(m.totalStudents), change: 'Across all programs' },
          { label: 'Avg. Sentiment', value: m.avgSentiment, change: 'Weekly average' },
          { label: 'Completed', value: String(m.completedSessions), change: 'Sessions completed' },
          { label: 'Pending', value: String(m.pendingSessions), change: 'Awaiting action' },
        ]);
        setWeeklySentiment(sentimentRes.data);
        setSessionDistribution(distRes.data);
        setUpcomingSessions(upcomingRes.data);
        setSummaryData(summaryRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      }
    };

    fetchData();
    fetchSuggestions();
    fetchAnnouncements();

    const socket = getSocket();
    if (socket) {
      socket.off("appointment:updated", fetchData);
      socket.on("appointment:updated", fetchData);
    }

    const pollInterval = setInterval(fetchData, 15000);

    return () => {
      if (socket) {
        socket.off("appointment:updated", fetchData);
      }
      clearInterval(pollInterval);
    };
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <main className="min-h-screen bg-neutral-50 pt-[calc(68px+2rem)] pb-20 px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
          <div>
            <h1 className="text-2xl font-light tracking-[-0.02em] text-neutral-900">
              {greeting + " Counselor"}, <span className="font-medium">{name}</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-400">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-emerald-700">System Online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-sm overflow-hidden mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white px-6 py-6">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-400">{m.label}</span>
              <p className="mt-2 text-[clamp(1.75rem,3vw,2.5rem)] font-light tracking-[-0.02em] text-neutral-900 leading-none">{m.value}</p>
              <p className="mt-1.5 text-[11px] text-neutral-500">{m.change}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">Data Analytics</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-neutral-200 rounded-sm overflow-hidden">
            <div className="lg:col-span-1">
              <SentimentChart data={weeklySentiment} />
            </div>
            <div className="lg:col-span-1">
              <SessionChart data={sessionDistribution} />
            </div>
            <div className="lg:col-span-1">
              <AnalyticsSummary data={summaryData} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-neutral-200 rounded-sm overflow-hidden">
          <div className="lg:col-span-2">
            <UpcomingSessions sessions={upcomingSessions} onAccept={handleAccept} onDecline={handleDecline} acceptingId={acceptingId} onEndSession={handleEndSession} endingSessionId={endingSessionId} />
          </div>
          <div className="lg:col-span-1">
            <ResourceTracking />
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">Suggestions & Announcements</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200 rounded-sm">
              <div className="px-6 pt-6 pb-3 flex items-center gap-2.5">
                <MessageSquare size={16} className="text-neutral-500" />
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Student Suggestions</span>
                  <h3 className="mt-0.5 text-sm font-medium text-neutral-900">{suggestions.length} submissions</h3>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-neutral-400">No suggestions yet.</div>
                ) : (
                  suggestions.map((s) => (
                    <div key={s._id} className="px-6 py-3 border-t border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-900">{s.message}</p>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            STU-{s.studentId} · {new Date(s.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {s.isDeleted ? (
                            <button onClick={() => restoreSuggestion(s._id)} className="text-neutral-400 hover:text-emerald-600 transition-colors" title="Restore">
                              <RotateCcw size={12} />
                            </button>
                          ) : (
                            <button onClick={() => deleteSuggestion(s._id)} className="text-neutral-400 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-sm">
              <div className="px-6 pt-6 pb-3 flex items-center gap-2.5">
                <Megaphone size={16} className="text-neutral-500" />
                <div>
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Announcements</span>
                  <h3 className="mt-0.5 text-sm font-medium text-neutral-900">{announcements.length} total</h3>
                </div>
              </div>
              <div className="px-6 pb-4 space-y-3">
                <input
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Announcement title"
                  className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
                />
                <textarea
                  value={announcementForm.body}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                  placeholder="Write your announcement..."
                  rows={3}
                  className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-none"
                />
                <button
                  onClick={createAnnouncement}
                  disabled={!announcementForm.title.trim() || !announcementForm.body.trim() || creatingAnnouncement}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 transition-colors rounded-sm"
                >
                  {creatingAnnouncement ? <Loader size={12} className="animate-spin" /> : <Megaphone size={12} />}
                  Post Announcement
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto border-t border-neutral-100">
                {announcements.length === 0 ? (
                  <div className="px-6 py-6 text-center text-xs text-neutral-400">No announcements.</div>
                ) : (
                  announcements.map((a) => (
                    <div key={a._id} className="px-6 py-3 border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-900">{a.title}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {a.isDeleted ? (
                            <button onClick={() => restoreAnnouncement(a._id)} className="text-neutral-400 hover:text-emerald-600 transition-colors" title="Restore">
                              <RotateCcw size={12} />
                            </button>
                          ) : (
                            <button onClick={() => deleteAnnouncement(a._id)} className="text-neutral-400 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default CounselorDashboardPage;
