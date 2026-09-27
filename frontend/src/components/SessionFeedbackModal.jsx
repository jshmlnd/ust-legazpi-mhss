import { useState } from 'react';
import { Heart, CalendarPlus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { axiosInstance } from '../lib/axios';
import { PATHS } from '../lib/routes';
import { toast } from 'react-toastify';

const FEELINGS = [
  { value: 'great', label: 'Great', face: '😄' },
  { value: 'good', label: 'Good', face: '🙂' },
  { value: 'okay', label: 'Okay', face: '😐' },
  { value: 'low', label: 'Low', face: '😞' },
  { value: 'bad', label: 'Bad', face: '😣' },
];

/**
 * Shown right after a chat session ends (both parties see it; booking only
 * applies to students). Step 1: "How are you feeling?" — recorded as a diary
 * entry so it feeds the mood streak. Step 2 (students): one tap to book a
 * follow-up with the same counselor, concern pre-filled.
 */
const SessionFeedbackModal = ({ open, onClose, appointment, counselorName, isStudent }) => {
  const navigate = useNavigate();
  const [feeling, setFeeling] = useState(null);
  const [savingFeeling, setSavingFeeling] = useState(false);
  const [booking, setBooking] = useState(false);

  if (!appointment) return null;

  const recordFeeling = async (mood) => {
    setFeeling(mood);
    setSavingFeeling(true);
    try {
      await axiosInstance.post('/journal', {
        title: `After session with ${counselorName || 'counselor'}`,
        content: `Post-session check-in after the ${appointment.type === 'Chat' ? 'chat' : 'face-to-face'} session on ${appointment.date}.`,
        mood,
      });
      toast.success('Thanks for sharing — logged in your diary.');
    } catch {
      /* feedback is best-effort; never block the flow */
    } finally {
      setSavingFeeling(false);
    }
  };

  const bookFollowUp = async () => {
    setBooking(true);
    try {
      await axiosInstance.post('/appointments', {
        counselorId: appointment.counselorId,
        type: 'Chat',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        concern: appointment.concern || 'Follow-up session — continuing from our last conversation.',
      });
      toast.success('Follow-up requested — same counselor, awaiting confirmation.');
      onClose();
      navigate(PATHS.SESSIONS);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not request follow-up.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="How are you feeling?" description="Your session just ended. A quick check-in helps us support you better.">
      <div className="space-y-5">
        <div className="grid grid-cols-5 gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => !savingFeeling && recordFeeling(f.value)}
              disabled={savingFeeling}
              className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition-colors ${
                feeling === f.value
                  ? 'bg-brand-600 text-brand-fg border-brand-600'
                  : 'bg-canvas border-line hover:border-brand-600'
              }`}
              aria-label={`Feeling ${f.label}`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{f.face}</span>
              <span className="text-[10px] font-medium">{f.label}</span>
            </button>
          ))}
        </div>
        {savingFeeling && (
          <p className="text-xs text-ink-muted flex items-center gap-1.5"><Loader size={11} className="animate-spin" /> Saving…</p>
        )}

        {isStudent && (
          <div className="bg-canvas rounded-lg p-4">
            <p className="text-sm font-medium text-ink">Was this helpful?</p>
            <p className="text-xs text-ink-muted mt-0.5">
              Continue the conversation with {counselorName || 'the same counselor'} whenever you're ready.
            </p>
            <button
              type="button"
              onClick={bookFollowUp}
              disabled={booking}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50"
            >
              {booking ? <Loader size={12} className="animate-spin" /> : <CalendarPlus size={13} />}
              {booking ? 'Requesting…' : 'Book a follow-up'}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full text-xs font-medium text-ink-muted hover:text-ink transition-colors py-1"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
};

export default SessionFeedbackModal;
