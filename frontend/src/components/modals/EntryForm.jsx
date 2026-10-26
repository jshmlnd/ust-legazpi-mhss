import { useState } from 'react';
import { Angry, Book, Frown, Heart, Meh, Smile } from 'lucide-react';
import Modal from '../../ui/Modal';

export const MOODS = [
  { key: 'great', icon: Heart, label: 'Great', color: 'text-brand-soft-ink bg-brand-soft' },
  { key: 'good', icon: Smile, label: 'Good', color: 'text-info-ink bg-info-soft' },
  { key: 'okay', icon: Meh, label: 'Okay', color: 'text-warning-ink bg-warning-soft' },
  { key: 'low', icon: Frown, label: 'Low', color: 'text-orange-600 bg-orange-50' },
  { key: 'bad', icon: Angry, label: 'Bad', color: 'text-danger-ink bg-danger-soft' },
];

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
    <Modal
      isOpen
      onClose={onClose}
      title="New Journal Entry"
      description="A private space to reflect on your day."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-soft p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-brand-fg">
            <Book size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-soft-ink">Make space for what you feel</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-soft-ink/80">There is no right way to write this. Start with a title and let the rest follow.</p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-ink">Entry title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What would you call today?"
            className="w-full rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-ink">What&apos;s on your mind?</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely. This entry is private to you."
            rows={6}
            className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
            required
          />
          <span className="block text-right text-[11px] text-ink-muted">{content.length} characters</span>
        </label>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-ink">How are you feeling?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const selected = mood === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(m.key)}
                  aria-pressed={selected}
                  className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                    selected
                      ? `${m.color} border-transparent ring-2 ring-brand-600/20`
                      : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:bg-canvas'
                  }`}
                >
                  <Icon size={14} aria-hidden="true" /> {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-canvas hover:text-ink">Cancel</button>
          <button type="submit" disabled={saving || !title.trim() || !content.trim()} className="rounded-lg bg-brand-600 px-5 py-2.5 text-xs font-semibold text-brand-fg shadow-e1 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving...' : 'Save Entry'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default EntryForm;
