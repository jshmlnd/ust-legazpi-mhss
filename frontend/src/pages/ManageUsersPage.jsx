import { useState, useEffect } from 'react';
import { Pencil, Trash2, Search } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import PageShell from '../components/PageShell';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CEAFA', 'CHS', 'CASE', 'CBMA'];

const inputClass = 'w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors';

const EditUserModal = ({ isOpen, onClose, user, isCounselor, onSave }) => {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (user) {
      setForm({ ...user });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCounselor ? 'Edit Counselor' : 'Edit Student'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Full Name</label>
          <input name="fullName" value={form.fullName || ''} onChange={handleChange} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Email</label>
          <input name="email" type="email" value={form.email || ''} onChange={handleChange} className={inputClass} />
        </div>

        {!isCounselor && (
          <>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Department</label>
                <select name="department" value={form.department || ''} onChange={handleChange} className={inputClass}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Program</label>
                <input name="program" value={form.program || ''} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Year Level</label>
              <input name="yearLevel" type="number" min={1} max={5} value={form.yearLevel || 1} onChange={handleChange} className={inputClass} />
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

const ManageUsersPage = () => {
  const [tab, setTab] = useState('students');
  const [users, setUsers] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, counselorsRes] = await Promise.all([
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/counselors'),
      ]);
      setUsers(usersRes.data);
      setCounselors(counselorsRes.data);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const data = tab === 'students' ? users : counselors;
  const filtered = data.filter((u) => {
    const q = search.toLowerCase();
    return (u.fullName || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
      || (u.studentId || u.counselorId || '').toLowerCase().includes(q);
  });

  const handleEdit = async (form) => {
    const isCounselor = tab === 'counselors';
    const endpoint = isCounselor ? `/admin/counselors/${editingUser._id}` : `/admin/users/${editingUser._id}`;
    try {
      const res = await axiosInstance.put(endpoint, form);
      if (isCounselor) {
        setCounselors((prev) => prev.map((c) => (c._id === editingUser._id ? res.data : c)));
      } else {
        setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? res.data : u)));
      }
      setEditModalOpen(false);
      setEditingUser(null);
      toast.success(`${isCounselor ? 'Counselor' : 'Student'} updated`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id, name) => {
    const isCounselor = tab === 'counselors';
    const endpoint = isCounselor ? `/admin/counselors/${id}` : `/admin/users/${id}`;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(endpoint);
      if (isCounselor) {
        setCounselors((prev) => prev.filter((c) => c._id !== id));
      } else {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      }
      toast.success(`${isCounselor ? 'Counselor' : 'Student'} deleted`);
    } catch {
      toast.error('Delete failed');
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditModalOpen(true);
  };

  return (
    <PageShell title="Manage Users" subtitle="View, edit, or remove system accounts">
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-neutral-200">
          {['students', 'counselors'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(''); }}
              className={`px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors border-b-2 -mb-px ${tab === t ? 'text-neutral-900 border-neutral-900' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}
            >
              {t} ({t === 'students' ? users.length : counselors.length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-xs uppercase tracking-[0.1em] text-neutral-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">ID</th>
                    <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Name</th>
                    <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Email</th>
                    {tab === 'students' && (
                      <>
                        <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Phone</th>
                        <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Dept</th>
                        <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Program</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-neutral-500 font-mono">{u.studentId || u.counselorId}</td>
                      <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{u.email || '—'}</td>
                      {tab === 'students' && (
                        <>
                          <td className="px-4 py-3 text-sm text-neutral-500">{u.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-neutral-500">{u.department || '—'}</td>
                          <td className="px-4 py-3 text-sm text-neutral-500">{u.program || '—'}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(u)} className="size-7 flex items-center justify-center rounded-sm text-neutral-400 hover:text-neutral-900 transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(u._id, u.fullName)} className="size-7 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingUser(null); }}
        user={editingUser}
        isCounselor={tab === 'counselors'}
        onSave={handleEdit}
      />
    </PageShell>
  );
};

export default ManageUsersPage;
