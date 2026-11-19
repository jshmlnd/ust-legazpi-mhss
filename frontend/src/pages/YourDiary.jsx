import { useState, useEffect } from 'react';
import { Book, Plus, Pencil, Trash2, Clock, Meh } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';
import EntryForm, { MOODS } from '../components/modals/EntryForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Entries store "MM-DD-YYYY"; show "Nov 16, 2026". Falls back to createdAt.
const formatEntryDate = (raw, createdAt) => {
  const mdy = String(raw || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const d = mdy ? new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2])) : new Date(raw || createdAt || NaN);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const PAGE_SIZE = 5;

const Pagination = ({ page, totalPages, total, onChange }) => {
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const btn = 'h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-40 disabled:pointer-events-none';
  return (
    <nav aria-label="Diary pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink-muted">Showing {from}–{to} of {total}</p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className={`${btn} text-ink-soft hover:bg-line`}>
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${btn} ${n === page ? 'bg-brand-600 text-brand-fg' : 'text-ink-soft hover:bg-line'}`}
          >
            {n}
          </button>
        ))}
        <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} className={`${btn} text-ink-soft hover:bg-line`}>
          Next
        </button>
      </div>
    </nav>
  );
};

const EntryCard = ({ entry, onEdit, onDelete }) => {
  const mood = MOODS.find((m) => m.key === entry.mood);
  const MoodIcon = mood?.icon || Meh;

  const shownDate = formatEntryDate(entry.date, entry.createdAt);

  return (
    <article className="!rounded-[1.25rem] border border-line bg-surface p-5 shadow-e1 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${mood?.color || 'bg-line text-ink-muted'}`}>
          {MoodIcon && <MoodIcon size={18} aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-ink truncate">{entry.title}</h3>
              {(shownDate || entry.time) && (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                  {shownDate && <span>{shownDate}</span>}
                  {shownDate && entry.time && <span aria-hidden="true">·</span>}
                  {entry.time && <span className="inline-flex items-center gap-1"><Clock size={11} aria-hidden="true" />{entry.time}</span>}
                  {mood && <span className="sr-only">Mood: {mood.label || mood.key}</span>}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(entry)}
              aria-label={`Edit entry "${entry.title}"`}
              title="Edit"
              className="size-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-line transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(entry)}
              aria-label={`Delete entry "${entry.title}"`}
              title="Delete"
              className="size-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger-ink hover:bg-danger-soft transition-colors"
            >
              <Trash2 size={14} />
            </button>
            </div>
          </div>
          {entry.content && (
            <p className="mt-3 text-sm text-ink-soft leading-relaxed whitespace-pre-line line-clamp-3">{entry.content}</p>
          )}
        </div>
      </div>
    </article>
  );
};

const MoodOverview = ({ entries }) => {
  const counts = {};
  MOODS.forEach((m) => { counts[m.key] = 0; });
  entries.forEach((e) => { if (counts[e.mood] !== undefined) counts[e.mood]++; });
  const total = entries.length || 1;

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <span className="text-xs font-semibold text-ink-muted block mb-4">Total Entries</span>
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
                <div className={`h-full rounded-full transition-all duration-500 ${m.bar}`} style={{ width: `${pct}%` }} />
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
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  // Clamp after deletes so the last page never comes up empty.
  const currentPage = Math.min(page, totalPages);

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
      if (editing) {
        const res = await axiosInstance.patch(`/journal/${editing._id}`, entry);
        setEntries((prev) => prev.map((e) => (e._id === editing._id ? res.data : e)));
        toast.success('Entry updated');
        return true;
      }
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

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/journal/${pendingDelete._id}`);
      setEntries((prev) => prev.filter((e) => e._id !== pendingDelete._id));
      toast.success('Entry deleted');
      setPendingDelete(null);
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageShell title="My Diary" description="A private space for your thoughts and reflections"><PageShellSkeleton showSidebar count={3} /></PageShell>;

  return (
    <PageShell
      title="My Diary"
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
          {entries.length === 0 ? (
            <EmptyState icon={Book} title="No journal entries yet" description="Start writing to track your emotions and thoughts over time." action={
              <button onClick={() => setModalOpen(true)} className="px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg">
                Write First Entry
              </button>
            } />
          ) : (
            <>
              <div className="space-y-3">
                {entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((e) => (
                  <EntryCard key={e._id} entry={e} onEdit={(entry) => { setEditing(entry); setModalOpen(true); }} onDelete={setPendingDelete} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination page={currentPage} totalPages={totalPages} total={entries.length} onChange={setPage} />
              )}
            </>
          )}
        </div>
        <div className="lg:col-span-1 space-y-6">
          <MoodOverview entries={entries} />
        </div>
      </div>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => { if (!deleting) setPendingDelete(null); }}
        title="Delete this entry?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>Keep entry</Button>
            <Button variant="destructive" icon={Trash2} onClick={confirmDelete} loading={deleting}>Delete</Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">{pendingDelete?.title}</span> will be permanently removed. This can&apos;t be undone.
        </p>
      </Modal>

      {modalOpen && <EntryForm key={editing?._id ?? 'new'} initial={editing} onSave={handleSave} onClose={() => { setModalOpen(false); setEditing(null); }} />}
    </PageShell>
  );
};

export default YourDiary;
