import { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Clock, Smile, Meh, Frown, Angry, Heart } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SectionDivider from '../components/SectionDivider';
import toast from 'react-hot-toast';

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
    <div className="bg-white border border-neutral-200 rounded-sm p-5 hover:border-neutral-300 transition-colors">
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
          <div className="flex gap-2">
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

const YourDiary = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  if (loading) return <PageShell title="Your Diary" subtitle="A private space for your thoughts and reflections"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

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
        <div className="lg:col-span-1">
          <MoodOverview entries={entries} />
        </div>
      </div>

      {modalOpen && <EntryForm onSave={handleSave} onClose={() => setModalOpen(false)} />}
    </PageShell>
  );
};

export default YourDiary;
