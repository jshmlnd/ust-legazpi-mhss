import { useState, useEffect, useCallback } from 'react';
import { Plus, GripVertical, Check, ChevronDown, ChevronUp, Sparkles, ArrowUpToLine, ArrowDownToLine, Trash2 } from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import RoleGate from '../components/RoleGate';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const SPRING = { type: 'spring', stiffness: 500, damping: 40, mass: 1 };

const ActivityItem = ({ activity, onToggle }) => (
  <label className="flex items-center gap-3 py-2.5 px-4 hover:bg-neutral-50 transition-colors cursor-pointer group">
    <div className={`size-4 rounded-sm border-2 flex items-center justify-center transition-all duration-200 ${
      activity.completed ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-300 group-hover:border-neutral-500'
    }`}>
      {activity.completed && <Check size={10} className="text-white" />}
    </div>
    <span className={`text-sm flex-1 transition-colors ${activity.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
      {activity.label}
    </span>
  </label>
);

const ModuleCard = ({ module, expanded, onToggle, onToggleActivity, onDelete, onMoveTop, onMoveBottom, isCounselor }) => {
  const controls = useDragControls();
  const done = module.activities.filter((a) => a.completed).length;
  const total = module.activities.length;
  const pct = Math.round((done / total) * 100);

  return (
    <Reorder.Item
      value={module}
      id={module._id}
      dragControls={controls}
      dragListener={false}
      layout
      layoutId={`module-${module._id}`}
      transition={SPRING}
      whileDrag={{
        scale: 1.02,
        opacity: 0.9,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)',
        zIndex: 50,
      }}
      className="bg-white border border-neutral-200 rounded-sm list-none relative"
    >
      <div className="relative">
        {isCounselor && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
            <button
              onClick={() => onMoveTop(module._id)}
              className="size-7 flex items-center justify-center rounded-sm bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-900 transition-colors"
              title="Move to top"
            >
              <ArrowUpToLine size={12} />
            </button>
            <button
              onClick={() => onMoveBottom(module._id)}
              className="size-7 flex items-center justify-center rounded-sm bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-900 transition-colors"
              title="Move to bottom"
            >
              <ArrowDownToLine size={12} />
            </button>
            <button
              onClick={() => onDelete(module._id)}
              className="size-7 flex items-center justify-center rounded-sm bg-white border border-neutral-200 text-neutral-400 hover:text-red-600 transition-colors"
              title="Delete module"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isCounselor && (
              <button
                onPointerDown={(e) => controls.start(e)}
                className="size-8 shrink-0 flex items-center justify-center rounded-sm text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-colors cursor-grab active:cursor-grabbing touch-none"
                title="Drag to reorder"
              >
                <GripVertical size={16} />
              </button>
            )}
            <Sparkles size={16} className="text-neutral-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-neutral-900 truncate">{module.title}</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">{done}/{total} activities completed</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {expanded ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="activities"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="border-t border-neutral-100 overflow-hidden"
            >
              <div className="pb-2">
                {module.activities.map((a) => (
                  <ActivityItem key={a._id || a.id} activity={a} onToggle={onToggleActivity} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
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
      activities: filtered.map((label) => ({ label, completed: false })),
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
  const [expandedId, setExpandedId] = useState(null);
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

  const handleToggleActivity = useCallback(async (activityId) => {
    setModules((prev) => prev.map((m) => ({
      ...m,
      activities: m.activities.map((a) => (a._id || a.id) === activityId ? { ...a, completed: !a.completed } : a),
    })));
  }, []);

  const handleReorder = useCallback(async (reordered) => {
    setModules(reordered);
    try {
      await axiosInstance.patch('/self-care/reorder', { orderedIds: reordered.map((m) => m._id) });
    } catch (err) {
      console.error('Failed to reorder:', err);
    }
  }, []);

  const handleMoveTop = useCallback(async (id) => {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m._id === id);
      if (idx <= 0) return prev;
      const item = prev[idx];
      const rest = prev.filter((m) => m._id !== id);
      return [item, ...rest];
    });
  }, []);

  const handleMoveBottom = useCallback(async (id) => {
    setModules((prev) => {
      const idx = prev.findIndex((m) => m._id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const item = prev[idx];
      const rest = prev.filter((m) => m._id !== id);
      return [...rest, item];
    });
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
      setExpandedId((prev) => (prev === id ? null : prev));
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
        <Reorder.Group
          axis="y"
          values={modules}
          onReorder={handleReorder}
          className="space-y-px bg-neutral-200 rounded-sm overflow-hidden"
          layoutScroll
        >
          <AnimatePresence initial={false}>
            {modules.map((m) => (
              <ModuleCard
                key={m._id}
                module={m}
                expanded={expandedId === m._id}
                onToggle={() => setExpandedId(expandedId === m._id ? null : m._id)}
                onToggleActivity={handleToggleActivity}
                onDelete={handleDeleteModule}
                onMoveTop={handleMoveTop}
                onMoveBottom={handleMoveBottom}
                isCounselor={isCounselor}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}

      <ModuleFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddModule} />
    </PageShell>
  );
};

export default SelfCarePage;
