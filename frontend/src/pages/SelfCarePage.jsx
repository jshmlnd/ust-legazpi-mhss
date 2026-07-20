import { useState, useEffect, useCallback } from 'react';
import { Plus, Sparkles, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import RoleGate from '../components/RoleGate';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const ActivityItem = ({ activity }) => (
  <li className="flex items-start gap-2 py-1.5">
    <span className="size-1.5 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
    <span className="text-sm text-neutral-600 leading-relaxed">{activity.label}</span>
  </li>
);

const ModuleCard = ({ module, onDelete, isCounselor }) => {
  const [expanded, setExpanded] = useState(false);
  const total = module.activities.length;

  return (
    <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-sm bg-neutral-100 flex items-center justify-center">
              <Sparkles size={14} className="text-neutral-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-900">{module.title}</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">{total} {total === 1 ? 'activity' : 'activities'}</p>
            </div>
          </div>
          {isCounselor && (
            <button
              onClick={() => onDelete(module._id)}
              className="size-7 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete module"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {total > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'View'} activities
          </button>
        )}
      </div>

      {expanded && total > 0 && (
        <div className="border-t border-neutral-100 px-5 py-3 bg-neutral-50/50">
          <ul className="space-y-0.5">
            {module.activities.map((a) => (
              <ActivityItem key={a._id || a.id} activity={a} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const ModuleFormModal = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [activities, setActivities] = useState(['', '', '']);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filtered = activities.filter((a) => a.trim());
    if (!title.trim() || filtered.length === 0) return;
    onSubmit({
      title: title.trim(),
      activities: filtered.map((label) => ({ label })),
    });
    setTitle('');
    setActivities(['', '', '']);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Self-Care Module">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Module Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Midday Reset" required />
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Activities</label>
          {activities.map((a, i) => (
            <input
              key={i}
              value={a}
              onChange={(e) => setActivities((prev) => { const next = [...prev]; next[i] = e.target.value; return next; })}
              placeholder={`Activity ${i + 1}`}
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
            />
          ))}
          {activities.length < 6 && (
            <button type="button" onClick={() => setActivities((prev) => [...prev, ''])} className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors mt-1">
              + Add another activity
            </button>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">Create Module</button>
        </div>
      </form>
    </Modal>
  );
};

const SelfCarePage = () => {
  const { authUser } = useAuthStore();
  const role = authUser?.userType?.toLowerCase() ?? null;
  const isCounselor = role === 'counselor';
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await axiosInstance.get('/self-care');
        setModules(res.data);
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const handleAddModule = useCallback(async (mod) => {
    try {
      const res = await axiosInstance.post('/self-care', mod);
      setModules((prev) => [...prev, res.data]);
      toast.success('Module created');
    } catch (err) {
      toast.error('Failed to create module');
    }
  }, []);

  const handleDeleteModule = useCallback(async (id) => {
    try {
      await axiosInstance.delete(`/self-care/${id}`);
      setModules((prev) => prev.filter((m) => m._id !== id));
      toast.success('Module deleted');
    } catch (err) {
      toast.error('Failed to delete module');
    }
  }, []);

  if (loading) return <PageShell title="Self-Care Modules" subtitle="Daily routines and wellness exercises"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

  return (
    <PageShell
      title="Self-Care Modules"
      subtitle="Daily routines and wellness exercises"
      actions={
        <RoleGate roles={['counselor']}>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">
            <Plus size={14} /> Add Module
          </button>
        </RoleGate>
      }
    >
      {modules.length === 0 ? (
        <EmptyState icon={Sparkles} title="No self-care modules yet" description={isCounselor ? 'Create wellness modules with guided activities for students.' : 'Check back for self-care routines.'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <ModuleCard
              key={m._id}
              module={m}
              onDelete={handleDeleteModule}
              isCounselor={isCounselor}
            />
          ))}
        </div>
      )}

      <ModuleFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddModule} />
    </PageShell>
  );
};

export default SelfCarePage;
