import { useState, useEffect, useMemo } from 'react';
import { Book, Plus, Trash2, Clock, Smile, Meh, Frown, Angry, Heart, CalendarDays } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useChartTheme } from '../lib/useChartTheme';

/* Days without entries are pushed with `empty: true` and no score, so
   recharts (with connectNulls=false on <Area>) renders a gap in the line
   instead of dragging the trend down to zero. */

const MOODS = [
  { key: 'great', icon: Heart, label: 'Great', color: 'text-brand-soft-ink bg-brand-soft' },
  { key: 'good', icon: Smile, label: 'Good', color: 'text-info-ink bg-info-soft' },
  { key: 'okay', icon: Meh, label: 'Okay', color: 'text-warning-ink bg-warning-soft' },
  { key: 'low', icon: Frown, label: 'Low', color: 'text-orange-600 bg-orange-50' },
  { key: 'bad', icon: Angry, label: 'Bad', color: 'text-danger-ink bg-danger-soft' },
];

const EntryCard = ({ entry, onDelete }) => {
  const mood = MOODS.find((m) => m.key === entry.mood);
  const MoodIcon = mood?.icon || Meh;

  return (
    <div className="bg-surface p-5 hover:bg-canvas transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${mood?.color || 'bg-line text-ink-muted'}`}>
            {MoodIcon && <MoodIcon size={15} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-ink truncate">{entry.title}</h3>
            <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
              <span>{entry.date}</span>
              <span className="text-ink-muted">·</span>
              <Clock size={10} /> {entry.time || '—'}
            </div>
          </div>
        </div>
        <button onClick={() => onDelete(entry._id)} className="shrink-0 size-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger-ink hover:bg-danger-soft transition-colors" title="Delete">
          <Trash2 size={12} />
        </button>
      </div>
      <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-line line-clamp-3">{entry.content}</p>
    </div>
  );
};

const EntryForm = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('okay');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const ok = await onSave({ title: title.trim(), content: content.trim(), mood });
    if (!ok) { setSaving(false); return; }
    setTitle(''); setContent(''); setMood('okay');
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="New Journal Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What&apos;s on your mind?"
          rows={8}
          className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors resize-none"
        />
        <div>
          <span className="text-xs font-semibold text-ink-muted block mb-2">Mood</span>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const selected = mood === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(m.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    selected ? `${m.color} border-transparent` : 'text-ink-muted border-line hover:border-line-strong'
                  }`}
                >
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Entry'}</button>
        </div>
      </form>
    </Modal>
  );
};

const MoodOverview = ({ entries }) => {
  const counts = {};
  MOODS.forEach((m) => { counts[m.key] = 0; });
  entries.forEach((e) => { if (counts[e.mood] !== undefined) counts[e.mood]++; });
  const total = entries.length || 1;

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <span className="text-xs font-semibold text-ink-muted block mb-4">Total Mood Overview</span>
      <div className="space-y-3">
        {MOODS.map((m) => {
          const Icon = m.icon;
          const count = counts[m.key] || 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={m.key}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`inline-flex items-center gap-1.5 font-medium ${m.color.split(' ')[0]}`}>
                  <Icon size={13} /> {m.label}
                </span>
                <span className="text-ink-muted">{count}</span>
              </div>
              <div className="h-1 bg-line rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${
                  m.key === 'great' ? 'bg-brand-soft0' : m.key === 'good' ? 'bg-info-soft0' :
                  m.key === 'okay' ? 'bg-warning' : m.key === 'low' ? 'bg-orange-500' : 'bg-danger-soft0'
                }`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MoodTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  if (point?.payload?.empty) {
    return (
      <div className="bg-surface border border-line px-4 py-3 rounded-lg">
        <p className="text-xs font-semibold text-ink-muted mb-0.5">{label}</p>
        <p className="text-xs text-ink-muted">No entries this day</p>
      </div>
    );
  }
  if (point?.value == null) return null;
  return (
    <div className="bg-surface border border-line px-4 py-3 rounded-lg">
      <p className="text-xs font-semibold text-ink-muted mb-1">{label}</p>
      <p className="text-sm font-medium text-ink">Mood Score: {point.value}</p>
    </div>
  );
};

const WeeklyMoodChart = ({ data }) => {
  const theme = useChartTheme();
  const daysWithEntries = data.filter((d) => !d.empty);
  const weekAvg = daysWithEntries.length > 0
    ? Math.round(
        (daysWithEntries.reduce((sum, d) => sum + d.score, 0) / daysWithEntries.length) * 10,
      ) / 10
    : null;

  return (
    <div className="bg-surface border border-line rounded-lg">
      <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-ink-muted">Weekly Mood Trend</span>
          <h3 className="mt-1 text-sm font-medium text-ink">Last 7 days</h3>
        </div>
        {weekAvg != null && (
          <div className="text-right">
            <span className="text-lg font-semibold text-ink">{weekAvg}</span>
            <span className="block text-xs text-ink-muted">week average</span>
          </div>
        )}
      </div>
      <div className="px-2 pb-4 h-52">
        {daysWithEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <CalendarDays size={20} className="text-ink-muted" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">No entries in the last 7 days</p>
            <p className="text-xs text-ink-muted max-w-[260px]">
              Write an entry and your daily mood average will chart here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.brand} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={theme.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={theme.tick} dy={8} />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 5, 10]}
                axisLine={false}
                tickLine={false}
                tick={theme.tick}
                width={32}
              />
              <Tooltip
                content={<MoodTooltip />}
                cursor={{ stroke: theme.muted, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={theme.brand}
                strokeWidth={2}
                fill="url(#moodFill)"
                connectNulls={false}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload?.empty || cx == null || cy == null) return null;
                  return <circle cx={cx} cy={cy} r={3} fill={theme.brand} stroke={theme.dotStroke} strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: theme.brand, stroke: theme.dotStroke, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

const MOOD_SCORE = { great: 9, good: 7, okay: 5, low: 3, bad: 1 };

// The backend stores entry.date as MM-DD-YYYY, but older entries (or any
// ISO date) may be YYYY-MM-DD. Normalize both to YYYY-MM-DD so the weekly
// chart actually matches entries to days.
const toISODate = (raw) => {
  if (!raw) return null;
  const mdy = String(raw).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1]}-${mdy[2]}`;
  const iso = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? null
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const YourDiary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const weeklyMoodData = useMemo(() => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayMoods = entries.filter((e) => toISODate(e.date) === dateStr);
      if (dayMoods.length === 0) {
        result.push({ day: dayNames[date.getDay()], date: dateStr, empty: true });
        continue;
      }
      const avgScore = Math.round(
        (dayMoods.reduce((sum, e) => sum + (MOOD_SCORE[e.mood] || 5), 0) / dayMoods.length) * 10,
      ) / 10;
      result.push({ day: dayNames[date.getDay()], date: dateStr, score: avgScore });
    }
    return result;
  }, [entries]);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axiosInstance.get('/journal');
        setEntries(res.data);
      } catch (err) {
        console.error('Failed to fetch journal entries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const handleSave = async (entry) => {
    try {
      const res = await axiosInstance.post('/journal', entry);
      setEntries((prev) => [res.data, ...prev]);
      toast.success('Entry saved');
      return true;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save entry';
      toast.error(msg);
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/journal/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  if (loading) return <PageShell title="Your Diary" description="A private space for your thoughts and reflections"><PageShellSkeleton showSidebar count={3} /></PageShell>;

  return (
    <PageShell
      title="Your Diary"
      description="A private space for your thoughts and reflections"
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
        >
          <Plus size={14} /> New Entry
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="mb-6">
            <WeeklyMoodChart data={weeklyMoodData} />
          </div>
          {entries.length === 0 ? (
            <EmptyState icon={Book} title="No journal entries yet" description="Start writing to track your emotions and thoughts over time." action={
              <button onClick={() => setModalOpen(true)} className="px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg">
                Write First Entry
              </button>
            } />
          ) : (
            <div className="space-y-px bg-line rounded-lg overflow-hidden">
              {entries.map((e) => <EntryCard key={e._id} entry={e} onDelete={handleDelete} />)}
            </div>
          )}
        </div>
        <div className="lg:col-span-1 space-y-6">
          <MoodOverview entries={entries} />
        </div>
      </div>

      {modalOpen && <EntryForm onSave={handleSave} onClose={() => setModalOpen(false)} />}
    </PageShell>
  );
};

export default YourDiary;
