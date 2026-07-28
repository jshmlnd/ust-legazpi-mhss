import { useState, useEffect, useMemo } from 'react';
import { Book, Plus, Trash2, Clock, Smile, Meh, Frown, Angry, Heart, CalendarDays } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import PageShell from '../components/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const MOODS = [
  { key: 'great', icon: Heart, label: 'Great', color: 'text-emerald-600 bg-emerald-50' },
  { key: 'good', icon: Smile, label: 'Good', color: 'text-blue-600 bg-blue-50' },
  { key: 'okay', icon: Meh, label: 'Okay', color: 'text-amber-600 bg-amber-50' },
  { key: 'low', icon: Frown, label: 'Low', color: 'text-orange-600 bg-orange-50' },
  { key: 'bad', icon: Angry, label: 'Bad', color: 'text-red-600 bg-red-50' },
];

const EntryCard = ({ entry, onDelete }) => {
  const mood = MOODS.find((m) => m.key === entry.mood);
  const MoodIcon = mood?.icon || Meh;

  return (
    <div className="bg-white p-5 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`size-8 rounded-sm flex items-center justify-center shrink-0 ${mood?.color || 'bg-neutral-100 text-neutral-500'}`}>
            {MoodIcon && <MoodIcon size={15} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-neutral-900 truncate">{entry.title}</h3>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
              <span>{entry.date}</span>
              <span className="text-neutral-200">·</span>
              <Clock size={10} /> {entry.time || '—'}
            </div>
          </div>
        </div>
        <button onClick={() => onDelete(entry._id)} className="shrink-0 size-7 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
          <Trash2 size={12} />
        </button>
      </div>
      <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line line-clamp-3">{entry.content}</p>
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
          className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What&apos;s on your mind?"
          rows={8}
          className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-none"
        />
        <div>
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 block mb-2">Mood</span>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const selected = mood === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(m.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm border transition-colors ${
                    selected ? `${m.color} border-transparent` : 'text-neutral-500 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Entry'}</button>
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
    <div className="bg-white border border-neutral-200 rounded-sm p-5">
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 block mb-4">Mood Overview</span>
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
                <span className="text-neutral-400">{count}</span>
              </div>
              <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${
                  m.key === 'great' ? 'bg-emerald-500' : m.key === 'good' ? 'bg-blue-500' :
                  m.key === 'okay' ? 'bg-amber-400' : m.key === 'low' ? 'bg-orange-500' : 'bg-red-500'
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
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 px-4 py-3 rounded-sm">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-neutral-900">Mood Score: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const WeeklyMoodChart = ({ data }) => (
  <div className="bg-white border border-neutral-200 rounded-sm">
    <div className="px-6 pt-6 pb-2">
      <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Mood Trends</span>
      <h3 className="mt-1 text-sm font-medium text-neutral-900">Weekly Mood Overview</h3>
    </div>
    <div className="px-2 pb-4 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} dy={8} />
          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a3a3a3', fontWeight: 500 }} dx={-4} />
          <Tooltip content={<MoodTooltip />} cursor={{ stroke: '#d4d4d4', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2} fill="url(#moodFill)" dot={{ r: 3, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ActivityHeatmap = ({ entries }) => {
  const entryDates = useMemo(() => {
    const dates = new Set();
    entries.forEach((e) => { dates.add(e.date); });
    return dates;
  }, [entries]);

  const weeks = useMemo(() => {
    const result = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 111);

    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let w = 0; w < 16; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        week.push({
          date: dateStr,
          hasEntry: entryDates.has(dateStr),
          isFuture: date > today,
        });
      }
      result.push(week);
    }
    return result;
  }, [entryDates]);

  return (
    <div className="bg-white border border-neutral-200 rounded-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={14} className="text-neutral-500" />
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Activity</span>
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 mr-2 pt-px">
          {['S', 'M', 'T', 'W', 'Th', 'F', 'S'].map((label, i) => (
            <div key={i} className="h-3 min-w-[14px] flex items-center">
              <span className="text-[8px] leading-none text-neutral-400">{label}</span>
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`size-3 rounded-[3px] transition-colors ${
                  day.isFuture
                    ? 'bg-transparent'
                    : day.hasEntry
                    ? 'bg-emerald-500'
                    : 'bg-neutral-100'
                }`}
                title={`${day.date}${day.hasEntry ? ' - Journal entry' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-neutral-400">Less</span>
        <div className="size-3 rounded-[3px] bg-neutral-100" />
        <div className="size-3 rounded-[3px] bg-emerald-500" />
        <span className="text-[9px] text-neutral-400">More</span>
      </div>
    </div>
  );
};

const MOOD_SCORE = { great: 9, good: 7, okay: 5, low: 3, bad: 1 };

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
      const dayMoods = entries.filter((e) => e.date === dateStr);
      const avgScore = dayMoods.length > 0
        ? Math.round(dayMoods.reduce((sum, e) => sum + (MOOD_SCORE[e.mood] || 5), 0) / dayMoods.length)
        : 0;
      result.push({ day: dayNames[date.getDay()], score: avgScore });
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

  if (loading) return <PageShell title="Your Diary" subtitle="A private space for your thoughts and reflections"><PageShellSkeleton showSidebar count={3} /></PageShell>;

  return (
    <PageShell
      title="Your Diary"
      subtitle="A private space for your thoughts and reflections"
      actions={
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
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
              <button onClick={() => setModalOpen(true)} className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">
                Write First Entry
              </button>
            } />
          ) : (
            <div className="space-y-px bg-neutral-200 rounded-sm overflow-hidden">
              {entries.map((e) => <EntryCard key={e._id} entry={e} onDelete={handleDelete} />)}
            </div>
          )}
        </div>
        <div className="lg:col-span-1 space-y-6">
          <MoodOverview entries={entries} />
          <ActivityHeatmap entries={entries} />
        </div>
      </div>

      {modalOpen && <EntryForm onSave={handleSave} onClose={() => setModalOpen(false)} />}
    </PageShell>
  );
};

export default YourDiary;
