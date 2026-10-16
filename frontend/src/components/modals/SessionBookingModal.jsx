import { useState, useEffect, useMemo, useRef } from 'react';
import { CalendarCheck, Check, ChevronDown, Loader, MessageCircle } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import Modal from '../../ui/Modal';
import { toast } from 'react-toastify';

const formatLocalDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const CounselorDropdown = ({ counselors, value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = counselors.find((counselor) => String(counselor._id) === String(value));

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape') setOpen(false);
      if (event.type === 'mousedown' && !dropdownRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const choose = (counselor) => {
    onChange(String(counselor._id));
    setOpen(false);
  };

  const statusFor = (counselor) => String(counselor.status || '').toLowerCase() === 'busy'
    ? { label: 'In Face-To-Face Session', tone: 'text-warning-ink', dot: 'bg-warning' }
    : { label: 'Available', tone: 'text-success-ink', dot: 'bg-success' };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left text-sm text-ink shadow-e1 transition-colors hover:border-line-strong focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="min-w-0 truncate">{selected?.fullName || 'Select a counselor'}</span>
        <ChevronDown size={16} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="listbox" aria-label="Counselors" className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-raised p-1.5 shadow-e3">
          {counselors.map((counselor) => {
            const status = statusFor(counselor);
            const isSelected = String(counselor._id) === String(value);
            return (
              <button
                key={counselor._id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(counselor)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isSelected ? 'bg-brand-soft' : 'hover:bg-canvas'}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${status.dot}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{counselor.fullName}</span>
                  <span className={`mt-0.5 block text-[11px] font-medium ${status.tone}`}>{status.label}</span>
                </span>
                {isSelected && <Check size={15} className="shrink-0 text-brand-600" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SessionBookingModal = ({ initialType, onClose }) => {
  const [type, setType] = useState(initialType);
  const [counselors, setCounselors] = useState([]);
  const [counselorsLoading, setCounselorsLoading] = useState(true);
  const [counselorId, setCounselorId] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [concern, setConcern] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axiosInstance.get('/message/users')
      .then((res) => {
        if (!cancelled) setCounselors(res.data.filter((user) => user.userType?.toLowerCase() !== 'administrator'));
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load counselors.');
      })
      .finally(() => {
        if (!cancelled) setCounselorsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (type !== 'Face-To-Face' || !counselorId) return;

    let cancelled = false;
    axiosInstance.get(`/availability/${counselorId}`)
      .then((res) => {
        if (!cancelled) setSlots(res.data);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => { cancelled = true; };
  }, [type, counselorId]);

  const handleTypeChange = (value) => {
    setType(value);
    setDate('');
    setTime('');
    setSlots([]);
    setSlotsLoading(value === 'Face-To-Face' && Boolean(counselorId));
  };

  const handleCounselorChange = (value) => {
    setCounselorId(value);
    setDate('');
    setTime('');
    setSlots([]);
    setSlotsLoading(type === 'Face-To-Face' && Boolean(value));
  };

  const availableDates = useMemo(() => {
    const counts = {};
    slots.filter((slot) => slot.isAvailable).forEach((slot) => {
      counts[slot.date] = (counts[slot.date] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const availableTimes = useMemo(
    () => slots.filter((slot) => slot.isAvailable && slot.date === date).map((slot) => slot.time).sort(),
    [slots, date],
  );

  const handleSubmit = async () => {
    if (!counselorId) {
      toast.error('Please select a counselor.');
      return;
    }
    if (!concern.trim()) {
      toast.error('Please describe your concern briefly.');
      return;
    }
    if (type === 'Face-To-Face' && (!date || !time)) {
      toast.error('Please select a date and time.');
      return;
    }

    const request = {
      counselorId: Number(counselorId),
      type,
      date: type === 'Chat' ? formatLocalDate() : date,
      time: type === 'Chat'
        ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : time,
      concern: concern.trim(),
    };

    setSubmitting(true);
    try {
      await axiosInstance.post('/appointments', request);
      toast.success(type === 'Chat'
        ? 'Chat session requested - waiting for counselor to accept.'
        : 'Face-to-face session booked - awaiting counselor confirmation.');
      onClose();
    } catch (err) {
      if (type === 'Chat' && err.response?.data?.code === 'COUNSELOR_BUSY' && window.confirm('This counselor is in a face-to-face session. Wait for them?')) {
        try {
          await axiosInstance.post('/appointments', { ...request, waitIfBusy: true });
          toast.success('Chat session requested - you are queued for this counselor.');
          onClose();
        } catch (retryErr) {
          toast.error(retryErr.response?.data?.error || 'Failed to request chat session.');
        }
      } else if (err.response?.data?.code !== 'COUNSELOR_BUSY') {
        toast.error(err.response?.data?.error || 'Failed to book session.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Book a Session" description="Choose a format, counselor, and available time.">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
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
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${type === value ? 'border-brand-600 bg-brand-soft text-brand-soft-ink' : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-canvas'}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-ink-muted">Counselor</span>
          {counselorsLoading ? (
            <span className="flex items-center gap-2 py-2 text-sm text-ink-muted"><Loader size={14} className="animate-spin" /> Loading counselors...</span>
          ) : (
            <CounselorDropdown
              counselors={counselors}
              value={counselorId}
              onChange={handleCounselorChange}
              disabled={counselors.length === 0}
            />
          )}
        </label>

        {type === 'Face-To-Face' && counselorId && (
          <>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-ink-muted">Available dates</span>
              {slotsLoading ? (
                <p className="py-1 text-xs text-ink-muted">Loading available dates...</p>
              ) : availableDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableDates.map(([availableDate, count]) => (
                    <button
                      key={availableDate}
                      type="button"
                      onClick={() => { setDate(availableDate); setTime(''); }}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${date === availableDate ? 'border-brand-600 bg-brand-600 text-brand-fg' : 'border-line bg-surface text-ink-soft'}`}
                    >
                      {new Date(`${availableDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ({count})
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-1 text-xs text-ink-muted">This counselor has no open availability yet.</p>
              )}
            </div>
            {date && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink-muted">Available times</span>
                <div className="flex flex-wrap gap-2">
                  {availableTimes.map((availableTime) => (
                    <button
                      key={availableTime}
                      type="button"
                      onClick={() => setTime(availableTime)}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${time === availableTime ? 'border-brand-600 bg-brand-600 text-brand-fg' : 'border-line bg-surface text-ink-soft'}`}
                    >
                      {availableTime}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-ink-muted">Your concern</span>
          <textarea
            required
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="Briefly describe what you would like support with."
            rows={3}
            className="w-full resize-none rounded-lg border border-line bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand-600"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-ink-muted">Cancel</button>
          <button type="submit" disabled={submitting || counselorsLoading} className="rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-brand-fg disabled:opacity-50">
            {submitting ? 'Booking...' : type === 'Chat' ? 'Request chat' : 'Book session'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SessionBookingModal;
