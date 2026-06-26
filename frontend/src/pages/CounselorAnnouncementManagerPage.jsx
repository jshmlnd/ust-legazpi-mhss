import { useState, useEffect } from 'react';
import { Trash2, Search, Eye, Heart, Megaphone, PenSquare, RotateCcw, ArchiveRestore, Plus } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import PageShell from '../components/PageShell';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const getTotalReactions = (reactions) => {
  if (!reactions || typeof reactions !== 'object') return 0;
  return Object.values(reactions).reduce((sum, users) => sum + (Array.isArray(users) ? users.length : 0), 0);
};

const EditAnnouncementModal = ({ isOpen, onClose, announcement, onSave }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '');
      setBody(announcement.body || '');
    } else {
      setTitle('');
      setBody('');
    }
  }, [announcement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await onSave({ title: title.trim(), body: body.trim() });
  };

  const isCreate = !announcement;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreate ? 'Create Announcement' : 'Edit Announcement'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title..."
            className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your announcement..."
            rows={5}
            className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-y min-h-[100px]"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">{isCreate ? 'Create' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
};

const CounselorAnnouncementManagerPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [deletedAnnouncements, setDeletedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const [activeRes, deletedRes] = await Promise.all([
        axiosInstance.get('/announcements'),
        axiosInstance.get('/announcements?deleted=true'),
      ]);
      setAnnouncements(activeRes.data);
      setDeletedAnnouncements(deletedRes.data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    const socket = getSocket();
    socket?.on('announcements:updated', fetchAnnouncements);
    return () => socket?.off('announcements:updated', fetchAnnouncements);
  }, []);

  const data = showDeleted ? deletedAnnouncements : announcements;
  const filtered = data.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) || (a.author || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    try {
      for (const id of selected) {
        await axiosInstance.delete(`/announcements/${id}`);
      }
      setAnnouncements((prev) => prev.filter((a) => !selected.has(a._id)));
      setDeletedAnnouncements((prev) => prev.filter((a) => !selected.has(a._id)));
      setSelected(new Set());
      toast.success(`Deleted ${selected.size} announcement(s)`);
    } catch (err) {
      toast.error('Failed to delete announcements');
    }
  };

  const handleDeleteSingle = async (id, title) => {
    try {
      await axiosInstance.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));

      const undo = toast(
        (t) => (
          <div className="flex items-center gap-3">
            <span className="text-sm">Deleted "{title}"</span>
            <button
              onClick={async () => {
                try {
                  await axiosInstance.patch(`/announcements/${id}/restore`);
                  toast.dismiss(t.id);
                  toast.success('Announcement restored');
                  fetchAnnouncements();
                } catch {
                  toast.error('Failed to restore');
                }
              }}
              className="px-3 py-1 text-xs font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 rounded-sm transition-colors"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleRestoreSingle = async (id) => {
    try {
      await axiosInstance.patch(`/announcements/${id}/restore`);
      toast.success('Announcement restored');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to restore announcement');
    }
  };

  const handleCreate = async (data) => {
    try {
      const res = await axiosInstance.post('/announcements', { ...data, author: 'Counseling Office' });
      setAnnouncements((prev) => [res.data, ...prev]);
      setCreateModalOpen(false);
      toast.success('Announcement created');
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const handleEdit = async (data) => {
    if (!editingAnnouncement) return;
    try {
      const res = await axiosInstance.put(`/announcements/${editingAnnouncement._id}`, data);
      setAnnouncements((prev) => prev.map((a) => (a._id === editingAnnouncement._id ? res.data : a)));
      setEditModalOpen(false);
      setEditingAnnouncement(null);
      toast.success('Announcement updated');
    } catch (err) {
      toast.error('Failed to update announcement');
    }
  };

  const engagementRates = announcements
    .filter((a) => a.views > 0)
    .map((a) => Math.min(getTotalReactions(a.reactions) / (a.views * 5), 1));
  const avgEngagement = engagementRates.length > 0
    ? ((engagementRates.reduce((s, r) => s + r, 0) / engagementRates.length) * 100).toFixed(1)
    : '0.0';
  const totalReactions = announcements.reduce((sum, a) => sum + getTotalReactions(a.reactions), 0);
  const mostReacted = announcements.length > 0
    ? announcements.sort((a, b) => getTotalReactions(b.reactions) - getTotalReactions(a.reactions))[0].title
    : '—';

  const metrics = [
    { label: 'Total Announcements', value: String(announcements.length) },
    { label: 'Total Reactions', value: String(totalReactions) },
    { label: 'Avg. Engagement Rate', value: `${avgEngagement}%` },
    { label: 'Most Reactions', value: mostReacted },
  ];

  if (loading) return <PageShell title="Announcement Manager" subtitle="Monitor and manage all campus announcements"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

  return (
    <PageShell
      title="Announcement Manager"
      subtitle="Monitor and manage all campus announcements"
      actions={
        selected.size > 0 ? (
          <button onClick={handleBatchDelete} className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm">
            <Trash2 size={14} /> Delete {selected.size}
          </button>
        ) : !showDeleted ? (
          <button onClick={() => setCreateModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">
            <Plus size={14} /> New Announcement
          </button>
        ) : null
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-sm overflow-hidden mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white px-6 py-5">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">{m.label}</span>
            <p className="mt-1.5 text-lg font-medium text-neutral-900 truncate">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => { setShowDeleted(false); setSelected(new Set()); setSearch(''); }}
          className={`text-[11px] font-semibold tracking-[0.1em] uppercase pb-1 border-b-2 transition-colors ${!showDeleted ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
        >
          Active ({announcements.length})
        </button>
        <button
          onClick={() => { setShowDeleted(true); setSelected(new Set()); setSearch(''); }}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase pb-1 border-b-2 transition-colors ${showDeleted ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
        >
          <ArchiveRestore size={13} /> Deleted ({deletedAnnouncements.length})
        </button>
      </div>

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full max-w-xs pl-9 pr-3 py-2 bg-transparent border border-neutral-200 text-sm rounded-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={showDeleted ? ArchiveRestore : Megaphone} title={showDeleted ? 'No deleted announcements' : 'No announcements found'} description="Try adjusting your search." />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-6 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selected.size === filtered.length) setSelected(new Set());
                        else setSelected(new Set(filtered.map((a) => a._id)));
                      }}
                      className="size-3.5 rounded-sm border-neutral-300 text-neutral-900 focus:ring-0"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Title</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Author</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Date</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">
                    <span className="inline-flex items-center gap-1"><Eye size={11} /> Views</span>
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">
                    <span className="inline-flex items-center gap-1"><Heart size={11} /> Reactions</span>
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Engagement</th>
                  <th className="px-6 py-3.5 w-20" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const totalReactionCount = getTotalReactions(a.reactions);
                  const engagement = a.views > 0 ? Math.min((totalReactionCount / (a.views * 5)) * 100, 100).toFixed(1) : '0.0';
                  return (
                    <tr key={a._id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(a._id)}
                          onChange={() => toggleSelect(a._id)}
                          className="size-3.5 rounded-sm border-neutral-300 text-neutral-900 focus:ring-0"
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-medium text-neutral-900">{a.title}</span>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{a.body}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-neutral-600">{a.author}</td>
                      <td className="px-6 py-3.5 text-sm text-neutral-500">{a.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—')}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600"><Eye size={12} className="text-neutral-400" /> {a.views || 0}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600"><Heart size={12} className="text-neutral-400" /> {totalReactionCount}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-neutral-500">{engagement}%</td>
                      <td className="px-6 py-3.5 text-right">
                        {showDeleted ? (
                          <button onClick={() => handleRestoreSingle(a._id)} className="text-neutral-400 hover:text-green-600 transition-colors" title="Restore">
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-4 justify-end">
                            <button onClick={() => { setEditingAnnouncement(a); setEditModalOpen(true); }} className="text-neutral-400 hover:text-neutral-900 transition-colors" title="Edit">
                              <PenSquare size={14} />
                            </button>
                            <button onClick={() => handleDeleteSingle(a._id, a.title)} className="text-neutral-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditAnnouncementModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingAnnouncement(null); }}
        announcement={editingAnnouncement}
        onSave={handleEdit}
      />

      <EditAnnouncementModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        announcement={null}
        onSave={handleCreate}
      />
    </PageShell>
  );
};

export default CounselorAnnouncementManagerPage;
