import { useEffect, useState } from 'react';
import {
  Armchair, Bed, BookOpen, Brain, CircleDot, Coffee, Compass, Dumbbell,
  Droplets, Flower, Footprints, Headphones, Heart, HeartHandshake, HeartPulse,
  Leaf, Lightbulb, Moon, Music, Palette, Shield, Smile, SmilePlus, Sparkles,
  Star, Sun, Timer, Utensils, Waves, Wind,
} from 'lucide-react';
import Modal from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Trash2 } from 'lucide-react';

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
  'bg-line',
  'bg-rose-50 dark:bg-rose-950',
  'bg-warning-soft',
  'bg-brand-soft',
  'bg-info-soft',
  'bg-violet-50 dark:bg-violet-950',
];

const ICON_FG_COLORS = [
  'text-ink-muted',
  'text-rose-500 dark:text-rose-300',
  'text-warning',
  'text-brand-500',
  'text-info',
  'text-violet-500 dark:text-violet-300',
];

const getIconColors = (name) => {
  const idx = ICON_OPTIONS.findIndex((o) => o.name === name);
  const i = idx >= 0 ? idx % ICON_BG_COLORS.length : 0;
  return { bg: ICON_BG_COLORS[i], fg: ICON_FG_COLORS[i] };
};

export const ModuleIcon = ({ name, size = 14 }) => {
  const Icon = ICON_MAP[name] || Sparkles;
  const { bg, fg } = getIconColors(name);
  return (
    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
      <Icon size={size} className={fg} />
    </div>
  );
};

const IconPicker = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="block text-xs font-semibold text-ink-muted">Module Icon</label>
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
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              selected ? 'border-brand-600 bg-brand-600 text-brand-fg' : `border-line hover:border-line-strong ${bg}`
            }`}
          >
            <Icon size={16} className={selected ? 'text-brand-fg' : fg} />
            <span className={`text-xs leading-none ${selected ? 'text-brand-fg/80' : 'text-ink-muted'}`}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const ModuleFormModal = ({ isOpen, onClose, onSubmit, initial }) => {
  const isEdit = !!initial;
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [activities, setActivities] = useState([{ label: '', link: '' }, { label: '', link: '' }, { label: '', link: '' }]);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || '');
      setIcon(initial.icon || 'Sparkles');
      const acts = initial.activities?.length
        ? initial.activities.map((a) => ({ label: a.label || '', link: a.link || '' }))
        : [{ label: '', link: '' }, { label: '', link: '' }, { label: '', link: '' }];
      setActivities(acts);
    } else {
      setTitle('');
      setIcon('Sparkles');
      setActivities([{ label: '', link: '' }, { label: '', link: '' }, { label: '', link: '' }]);
    }
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const filtered = activities.filter((a) => a.label.trim());
    if (!title.trim() || filtered.length === 0) return;
    onSubmit({
      _id: initial?._id,
      title: title.trim(),
      icon,
      activities: filtered.map((a) => ({ label: a.label.trim(), link: a.link.trim() })),
    });
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Self-Care Module' : 'Add Self-Care Module'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Module Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Midday Reset" required />
        <IconPicker value={icon} onChange={setIcon} />
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink-muted">Activities</label>
          {activities.map((a, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  value={a.label}
                  onChange={(e) => updateActivity(i, 'label', e.target.value)}
                  placeholder={`Activity ${i + 1}`}
                  className="flex-1 bg-transparent border border-line text-sm rounded-lg px-3 py-2 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors"
                />
                {activities.length > 1 && (
                  <button type="button" onClick={() => removeActivity(i)} className="shrink-0 size-7 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger-ink hover:bg-danger-soft transition-colors" title="Remove activity">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <input
                value={a.link}
                onChange={(e) => updateActivity(i, 'link', e.target.value)}
                placeholder="Link URL (optional)"
                className="w-full bg-transparent border border-line text-xs rounded-lg px-3 py-1.5 text-ink-muted placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors"
              />
            </div>
          ))}
          {activities.length < 6 && (
            <button type="button" onClick={() => setActivities((prev) => [...prev, { label: '', link: '' }])} className="text-xs font-medium text-ink-muted hover:text-ink transition-colors mt-1">
              + Add another activity
            </button>
          )}
        </div>
        <div className="sticky bottom-0 bg-surface pt-3 -mx-6 px-6 -mb-5 pb-5 border-t border-line flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg">{isEdit ? 'Save Changes' : 'Create Module'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ModuleFormModal;
