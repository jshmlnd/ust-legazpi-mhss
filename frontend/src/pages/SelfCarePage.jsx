import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, ExternalLink, ChevronDown,
  Sparkles, Heart, HeartPulse, HeartHandshake,
  Brain, Sun, Moon,
  Leaf, Flower, Star, Smile, SmilePlus,
  Music, Headphones, BookOpen, Coffee, Bed,
  Dumbbell, Timer, Droplets, Waves, Shield,
  Compass, Lightbulb, Palette, Armchair, Footprints, Utensils,
  CircleDot, Wind,
} from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import RoleGate from '../components/RoleGate';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const ICON_OPTIONS = [
  { name: 'Sparkles', label: 'Sparkles' },
  { name: 'Heart', label: 'Heart' },
  { name: 'HeartPulse', label: 'Pulse' },
  { name: 'HeartHandshake', label: 'Compassion' },
  { name: 'Brain', label: 'Brain' },
  { name: 'Sun', label: 'Sun' },
  { name: 'Moon', label: 'Moon' },
  { name: 'Leaf', label: 'Leaf' },
  { name: 'Flower', label: 'Flower' },
  { name: 'Star', label: 'Star' },
  { name: 'Smile', label: 'Smile' },
  { name: 'SmilePlus', label: 'Joy' },
  { name: 'Music', label: 'Music' },
  { name: 'Headphones', label: 'Headphones' },
  { name: 'BookOpen', label: 'Reading' },
  { name: 'Coffee', label: 'Coffee' },
  { name: 'Bed', label: 'Rest' },
  { name: 'Dumbbell', label: 'Exercise' },
  { name: 'Timer', label: 'Timer' },
  { name: 'Droplets', label: 'Hydration' },
  { name: 'Waves', label: 'Calm' },
  { name: 'Shield', label: 'Shield' },
  { name: 'Compass', label: 'Compass' },
  { name: 'Lightbulb', label: 'Ideas' },
  { name: 'Palette', label: 'Creative' },
  { name: 'Armchair', label: 'Relax' },
  { name: 'Footprints', label: 'Walk' },
  { name: 'Utensils', label: 'Nutrition' },
  { name: 'CircleDot', label: 'Focus' },
  { name: 'Wind', label: 'Breathing' },
];

const ICON_MAP = {
  Sparkles, Heart, HeartPulse, HeartHandshake,
  Brain, Sun, Moon,
  Leaf, Flower, Star, Smile, SmilePlus,
  Music, Headphones, BookOpen, Coffee, Bed,
  Dumbbell, Timer, Droplets, Waves, Shield,
  Compass, Lightbulb, Palette, Armchair, Footprints, Utensils,
  CircleDot, Wind,
};

const ICON_BG_COLORS = [
  'bg-neutral-100',
  'bg-rose-50',
  'bg-amber-50',
  'bg-emerald-50',
  'bg-sky-50',
  'bg-violet-50',
];

const ICON_FG_COLORS = [
  'text-neutral-500',
  'text-rose-500',
  'text-amber-500',
  'text-emerald-500',
  'text-sky-500',
  'text-violet-500',
];

const getIconColors = (name) => {
  const idx = ICON_OPTIONS.findIndex((o) => o.name === name);
  const i = idx >= 0 ? idx % ICON_BG_COLORS.length : 0;
  return { bg: ICON_BG_COLORS[i], fg: ICON_FG_COLORS[i] };
};

const ModuleIcon = ({ name, size = 14 }) => {
  const Icon = ICON_MAP[name] || Sparkles;
  const { bg, fg } = getIconColors(name);
  return (
    <div className={`size-8 rounded-sm ${bg} flex items-center justify-center`}>
      <Icon size={size} className={fg} />
    </div>
  );
};

const IconPicker = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Module Icon</label>
    <div className="grid grid-cols-6 gap-1.5">
      {ICON_OPTIONS.map((opt) => {
        const Icon = ICON_MAP[opt.name];
        const { bg, fg } = getIconColors(opt.name);
        const selected = value === opt.name;
        return (
          <button
            key={opt.name}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.name)}
            className={`flex flex-col items-center gap-1 p-2 rounded-sm border transition-colors ${
              selected ? 'border-neutral-900 bg-neutral-900 text-white' : `border-neutral-200 hover:border-neutral-400 ${bg}`
            }`}
          >
            <Icon size={16} className={selected ? 'text-white' : fg} />
            <span className={`text-[9px] leading-none ${selected ? 'text-white/80' : 'text-neutral-400'}`}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const ActivityItem = ({ activity }) => (
  <li className="flex items-start gap-2 py-1.5">
    <span className="size-1.5 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
    <span className="text-sm text-neutral-600 leading-relaxed flex-1">{activity.label}</span>
    {activity.link && (
      <a href={activity.link} target="_blank" rel="noopener noreferrer" className="shrink-0 text-neutral-400 hover:text-neutral-900 transition-colors mt-0.5" title="Open link">
        <ExternalLink size={12} />
      </a>
    )}
  </li>
);

const ModuleCard = ({ module, onDelete, isCounselor }) => {
  const [open, setOpen] = useState(false);
  const total = module.activities.length;

  return (
    <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ModuleIcon name={module.icon} />
            <div>
              <h3 className="text-sm font-medium text-neutral-900">{module.title}</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">{total} {total === 1 ? 'activity' : 'activities'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCounselor && (
              <span
                onClick={(e) => { e.stopPropagation(); onDelete(module._id); }}
                className="size-7 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Delete module"
              >
                <Trash2 size={13} />
              </span>
            )}
            <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {total > 0 && open && (
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
  const [icon, setIcon] = useState('Sparkles');
  const [activities, setActivities] = useState([{ label: '', link: '' }, { label: '', link: '' }, { label: '', link: '' }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filtered = activities.filter((a) => a.label.trim());
    if (!title.trim() || filtered.length === 0) return;
    onSubmit({
      title: title.trim(),
      icon,
      activities: filtered.map((a) => ({ label: a.label.trim(), link: a.link.trim() })),
    });
    setTitle('');
    setIcon('Sparkles');
    setActivities([{ label: '', link: '' }, { label: '', link: '' }, { label: '', link: '' }]);
    onClose();
  };

  const removeActivity = (index) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const updateActivity = (index, field, value) => {
    setActivities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Self-Care Module">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Module Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Midday Reset" required />
        <IconPicker value={icon} onChange={setIcon} />
        <div className="space-y-3">
          <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Activities</label>
          {activities.map((a, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  value={a.label}
                  onChange={(e) => updateActivity(i, 'label', e.target.value)}
                  placeholder={`Activity ${i + 1}`}
                  className="flex-1 bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
                />
                {activities.length > 1 && (
                  <button type="button" onClick={() => removeActivity(i)} className="shrink-0 size-7 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove activity">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <input
                value={a.link}
                onChange={(e) => updateActivity(i, 'link', e.target.value)}
                placeholder="Link URL (optional)"
                className="w-full bg-transparent border border-neutral-200 text-[11px] rounded-sm px-3 py-1.5 text-neutral-500 placeholder-neutral-300 focus:border-neutral-900 outline-none transition-colors"
              />
            </div>
          ))}
          {activities.length < 6 && (
            <button type="button" onClick={() => setActivities((prev) => [...prev, { label: '', link: '' }])} className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors mt-1">
              + Add another activity
            </button>
          )}
        </div>
        <div className="sticky bottom-0 bg-white pt-3 -mx-6 px-6 -mb-5 pb-5 border-t border-neutral-100 flex items-center justify-end gap-3">
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
    } catch {
      toast.error('Failed to create module');
    }
  }, []);

  const handleDeleteModule = useCallback(async (id) => {
    try {
      await axiosInstance.delete(`/self-care/${id}`);
      setModules((prev) => prev.filter((m) => m._id !== id));
      toast.success('Module deleted');
    } catch {
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
