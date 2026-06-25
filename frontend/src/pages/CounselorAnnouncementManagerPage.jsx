import { useState, useEffect } from 'react';
import { BarChart3, Trash2, Search, Eye, MousePointerClick, Calendar, Megaphone } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import PageShell from '../components/PageShell';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import SectionDivider from '../components/SectionDivider';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'date', label: 'Date', render: (row) => row.date || (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—') },
  {
    key: 'views', label: 'Views',
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-sm text-neutral-900">
        <Eye size={12} className="text-neutral-400" /> {row.views}
      </span>
    ),
  },
  {
    key: 'clicks', label: 'Clicks',
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-sm text-neutral-900">
        <MousePointerClick size={12} className="text-neutral-400" /> {row.clicks || 0}
      </span>
    ),
  },
  {
    key: 'ctr', label: 'CTR',
    render: (row) => {
      const ctr = row.views > 0 ? (((row.clicks || 0) / row.views) * 100).toFixed(1) : '0.0';
      return <span className="text-sm text-neutral-600">{ctr}%</span>;
    },
  },
];

const CounselorAnnouncementManagerPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axiosInstance.get('/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter((a) =>
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
      setSelected(new Set());
      toast.success(`Deleted ${selected.size} announcement(s)`);
    } catch (err) {
      toast.error('Failed to delete announcements');
    }
  };

  const handleDeleteSingle = async (id) => {
    try {
      await axiosInstance.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success('Announcement deleted');
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const totalViews = announcements.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalClicks = announcements.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

  const metrics = [
    { label: 'Total Announcements', value: String(announcements.length) },
    { label: 'Total Views', value: String(totalViews) },
    { label: 'Avg. Click Rate', value: `${avgCtr}%` },
    { label: 'Most Viewed', value: announcements.length > 0 ? announcements.sort((a, b) => (b.views || 0) - (a.views || 0))[0].title : '—' },
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
        ) : null
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 rounded-sm overflow-hidden mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white px-6 py-5">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">{m.label}</span>
            <p className="mt-1.5 text-lg font-medium text-neutral-900 truncate">{m.value}</p>
          </div>
        ))}
      </div>

      <SectionDivider label="All Announcements" />

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
        <EmptyState icon={Megaphone} title="No announcements found" description="Try adjusting your search or create a new announcement." />
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
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Views</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Clicks</th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">CTR</th>
                  <th className="px-6 py-3.5 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
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
                      <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600"><MousePointerClick size={12} className="text-neutral-400" /> {a.clicks || 0}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-neutral-500">{a.views > 0 ? (((a.clicks || 0) / a.views) * 100).toFixed(1) : '0.0'}%</td>
                    <td className="px-6 py-3.5 text-right">
                      <button onClick={() => handleDeleteSingle(a._id)} className="text-neutral-400 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default CounselorAnnouncementManagerPage;
