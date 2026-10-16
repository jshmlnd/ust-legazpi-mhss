import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, ChevronDown, Sparkles } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import RoleGate from '../components/RoleGate';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';
import ModuleFormModal, { ModuleIcon } from '../components/modals/ModuleFormModal';

function useColumnCount() {
  const [cols, setCols] = useState(() => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  });
  useEffect(() => {
    const mql3 = window.matchMedia('(min-width: 1024px)');
    const mql2 = window.matchMedia('(min-width: 640px)');
    const sync = () => {
      if (mql3.matches) setCols(3);
      else if (mql2.matches) setCols(2);
      else setCols(1);
    };
    sync();
    mql3.addEventListener('change', sync);
    mql2.addEventListener('change', sync);
    return () => { mql3.removeEventListener('change', sync); mql2.removeEventListener('change', sync); };
  }, []);
  return cols;
}

function transposeToColumns(arr, numCols) {
  const result = Array.from({ length: numCols }, () => []);
  arr.forEach((item, i) => { result[i % numCols].push(item); });
  return result;
}

const ActivityItem = ({ activity }) => (
  <li className="flex items-start gap-2.5 py-2 border-b border-line last:border-0">
    <span className="size-1.5 rounded-full bg-line-strong mt-1.5 shrink-0" />
    <span className="text-[13px] text-ink-soft leading-relaxed flex-1">{activity.label}</span>
    {activity.link && (
      <a href={activity.link} target="_blank" rel="noopener noreferrer" className="shrink-0 text-ink-muted hover:text-ink transition-colors mt-0.5" title="Open link">
        <ExternalLink size={12} />
      </a>
    )}
  </li>
);

const ModuleCard = ({ module, onEdit, onDelete, isCounselor }) => {
  const [open, setOpen] = useState(false);
  const total = module.activities.length;

  return (
    <div className="bg-surface border border-line rounded-lg hover:border-line-strong transition-colors">
      <div className="flex items-center gap-3 p-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ModuleIcon name={module.icon} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-ink">{module.title}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">{total} {total === 1 ? 'activity' : 'activities'}</p>
          </div>
          <ChevronDown size={15} className={`ml-auto shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          {isCounselor && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(module); }}
                className="size-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-line transition-colors"
                title="Edit module"
                aria-label={`Edit ${module.title}`}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(module._id); }}
                className="size-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger-ink hover:bg-danger-soft transition-colors"
                title="Delete module"
                aria-label={`Delete ${module.title}`}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {total > 0 && open && (
        <div className="border-t border-line px-5 py-3 bg-canvas/60">
          <ul className="space-y-0">
            {module.activities.map((a) => (
              <ActivityItem key={a._id || a.id} activity={a} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SelfCarePage = () => {
  const { authUser } = useAuthStore();
  const role = authUser?.userType?.toLowerCase() ?? null;
  const isCounselor = role === 'counselor';
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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
      setModalOpen(false);
      setEditing(null);
      toast.success('Module created');
    } catch {
      toast.error('Failed to create module');
    }
  }, []);

  const handleEditModule = useCallback(async (mod) => {
    try {
      const res = await axiosInstance.patch(`/self-care/${mod._id}`, {
        title: mod.title,
        icon: mod.icon,
        activities: mod.activities,
      });
      setModules((prev) => prev.map((m) => (m._id === mod._id ? res.data : m)));
      setModalOpen(false);
      setEditing(null);
      toast.success('Module updated');
    } catch {
      toast.error('Failed to update module');
    }
  }, []);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (mod) => { setEditing(mod); setModalOpen(true); };

  const handleDeleteModule = useCallback(async (id) => {
    try {
      await axiosInstance.delete(`/self-care/${id}`);
      setModules((prev) => prev.filter((m) => m._id !== id));
      toast.success('Module deleted');
    } catch {
      toast.error('Failed to delete module');
    }
  }, []);

  const colCount = useColumnCount();
  const columns = useMemo(() => transposeToColumns(modules, colCount), [modules, colCount]);

  if (loading) return <PageShell title="Self-Care Modules" description="Daily routines and wellness exercises"><PageShellSkeleton count={6} /></PageShell>;

  return (
    <PageShell
      title="Self-Care Modules"
      description="Daily routines and wellness exercises"
      actions={
        <RoleGate roles={['counselor']}>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg">
            <Plus size={14} /> Add Module
          </button>
        </RoleGate>
      }
    >
      {modules.length === 0 ? (
        <EmptyState icon={Sparkles} title="No self-care modules yet" description={isCounselor ? 'Create wellness modules with guided activities for students.' : 'Check back for self-care routines.'} />
      ) : (
        <div className="flex gap-5 items-start">
          {columns.map((col, ci) => (
            <div key={ci} className="flex-1 flex flex-col gap-5">
              {col.map((m) => (
                <ModuleCard
                  key={m._id}
                  module={m}
                  onEdit={openEdit}
                  onDelete={handleDeleteModule}
                  isCounselor={isCounselor}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <ModuleFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSubmit={editing ? handleEditModule : handleAddModule} initial={editing} />
    </PageShell>
  );
};

export default SelfCarePage;
