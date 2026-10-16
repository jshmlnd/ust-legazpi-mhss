import { useMemo, useState } from 'react';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { axiosInstance } from '../../lib/axios';
import { toast } from 'react-toastify';

const toLocalDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const BookingModal = ({ counselor, onClose }) => {
  const [type, setType] = useState('Chat');
  const [concern, setConcern] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (value) => {
    setType(value);
    setDate('');
    setTime('');
    if (value !== 'Face-To-Face') return;
    setLoadingSlots(true);
    axiosInstance.get(`/availability/${counselor._id}`)
      .then((res) => setSlots(res.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  };

  const availableDates = useMemo(() => {
    const counts = {};
    slots.filter((s) => s.isAvailable).forEach((s) => { counts[s.date] = (counts[s.date] || 0) + 1; });
    return Object.entries(counts)
      .map(([d, count]) => ({ date: d, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [slots]);

  const availableTimes = useMemo(
    () => slots.filter((s) => s.isAvailable && s.date === date).map((s) => s.time).sort(),
    [slots, date],
  );

  const submit = async () => {
    if (!concern.trim()) {
      toast.error('Please describe your concern briefly.');
      return;
    }
    if (type === 'Face-To-Face' && (!date || !time)) {
      toast.error('Please select a date and time.');
      return;
    }
    const payload = {
      counselorId: counselor._id,
      type,
      date: type === 'Chat' ? toLocalDate() : date,
      time: type === 'Chat'
        ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : time,
      concern: concern.trim(),
    };
    setSubmitting(true);
    try {
      await axiosInstance.post('/appointments', payload);
      toast.success(
        type === 'Chat'
          ? 'Chat session requested — waiting for counselor to accept.'
          : 'Face-to-face session booked — awaiting counselor confirmation.',
      );
      onClose();
    } catch (err) {
      if (err.response?.data?.code === 'COUNSELOR_BUSY') {
        const wait = window.confirm(`${counselor.fullName} is in a face-to-face session. Wait for them?`);
        if (wait) {
          try {
            await axiosInstance.post('/appointments', { ...payload, waitIfBusy: true });
            toast.success('Chat session requested — you are queued for this counselor.');
            onClose();
          } catch (retryErr) {
            toast.error(retryErr.response?.data?.error || 'Failed to request chat session.');
          }
        }
      } else {
        toast.error(err.response?.data?.error || 'Failed to book session.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Book with ${counselor.fullName}`}
      description="Choose a format and tell us what you would like support with."
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-ink">Session type</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { value: 'Chat', label: 'Chat session', hint: 'Message your counselor online', icon: MessageCircle },
              { value: 'Face-To-Face', label: 'Face-to-face', hint: 'Meet at the guidance office', icon: CalendarCheck },
            ].map(({ value, label, hint, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                aria-pressed={type === value}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  type === value
                    ? 'border-brand-600 bg-brand-soft text-brand-soft-ink'
                    : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-canvas'
                }`}
              >
                <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${type === value ? 'bg-brand-600 text-brand-fg' : 'bg-line text-ink-muted'}`}>
                  <Icon size={14} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{label}</span>
                  <span className={`mt-0.5 block text-[11px] leading-relaxed ${type === value ? 'text-brand-soft-ink/80' : 'text-ink-muted'}`}>{hint}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {type === 'Face-To-Face' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink-muted">Available Dates</label>
              {loadingSlots ? (
                <p className="text-xs text-ink-muted py-1">Loading available dates...</p>
              ) : availableDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableDates.map(({ date: d, count }) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setDate(d); setTime(''); }}
                      className={`flex min-w-[92px] flex-col items-center rounded-lg border px-3 py-2 text-xs transition-colors ${
                        date === d
                          ? 'border-brand-600 bg-brand-600 text-brand-fg'
                          : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-canvas'
                      }`}
                    >
                      <span>{new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className={date === d ? 'text-brand-fg/75' : 'text-ink-muted'}>{count} slot{count !== 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-muted py-1">This counselor has no open availability yet.</p>
              )}
            </div>

            {date && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink-muted">Available Times</label>
                {availableTimes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTimes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                          time === t
                            ? 'border-brand-600 bg-brand-600 text-brand-fg'
                            : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-canvas'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted py-1">No available times for this date.</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted">
            Your Concern
          </label>
          <textarea
            required
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder={type === 'Chat'
              ? "e.g., I've been feeling overwhelmed with my coursework and need someone to talk to."
              : "e.g., I'd like to discuss my academic performance and study habits."}
            rows={type === 'Chat' ? 4 : 3}
            className="w-full resize-none rounded-xl border border-line bg-canvas px-3.5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={submitting}
            disabled={type === 'Face-To-Face' && (!date || !time)}
          >
            {type === 'Chat' ? 'Request chat' : 'Book session'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BookingModal;
