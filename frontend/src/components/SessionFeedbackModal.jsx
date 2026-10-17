import { useEffect, useState } from 'react';
import { CalendarPlus, FileDown, FileText, Loader, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { axiosInstance } from '../lib/axios';
import { PATHS } from '../lib/routes';
import { downloadSummaryDocx, downloadSummaryPdf, stripSummaryMarkdown } from '../lib/sessionSummary';
import { toast } from 'react-toastify';

const FEELINGS = [
  { value: 'great', label: 'Great', face: '😄' },
  { value: 'good', label: 'Good', face: '🙂' },
  { value: 'okay', label: 'Okay', face: '😐' },
  { value: 'low', label: 'Low', face: '😞' },
  { value: 'bad', label: 'Bad', face: '😣' },
];

const FeelingPicker = ({ feeling, savingFeeling, onSelect }) => (
  <div className="grid grid-cols-5 gap-2">
    {FEELINGS.map((f) => (
      <button
        key={f.value}
        type="button"
        onClick={() => !savingFeeling && onSelect(f.value)}
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
);

/**
 * Shown right after a chat session ends (both parties see it; booking only
 * applies to students). Step 1: "How are you feeling?" — recorded as a diary
 * entry so it feeds the mood streak. Step 2 (students): one tap to book a
 * follow-up with the same counselor, concern pre-filled.
 */
const SessionFeedbackModal = ({ open, onClose, appointment, counselorName, isStudent, onSaved }) => {
  const navigate = useNavigate();
  const [feeling, setFeeling] = useState(null);
  const [savingFeeling, setSavingFeeling] = useState(false);
  const [booking, setBooking] = useState(false);
  const [summary, setSummary] = useState(() => stripSummaryMarkdown(appointment?.summary || ''));
  const [summaryMeta, setSummaryMeta] = useState(null);
  const [studentName, setStudentName] = useState(() => appointment?.studentName || 'Anonymous Student');
  const [summaryLoading, setSummaryLoading] = useState(() => !isStudent && open);
  const [savingSummary, setSavingSummary] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    if (!open || isStudent || !appointment?._id) return undefined;

    let cancelled = false;

    const loadSummary = async () => {
      try {
        const res = await axiosInstance.get(`/appointments/${appointment._id}/summary`);
        if (!cancelled) {
          setSummary(stripSummaryMarkdown(res.data.summary || ''));
          setSummaryMeta(res.data);
          setStudentName(res.data.studentName || 'Anonymous Student');
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          if (!cancelled) {
            setSummaryMeta({});
            toast.error('Could not load the session summary.');
          }
          return;
        }

        try {
          const res = await axiosInstance.post(`/appointments/${appointment._id}/summary/generate`);
          if (!cancelled) {
            setSummary(stripSummaryMarkdown(res.data.summary || ''));
            setSummaryMeta(res.data);
            setStudentName(res.data.studentName || 'Anonymous Student');
          }
        } catch {
          if (!cancelled) {
            setSummaryMeta({});
            toast.error('Could not generate the session summary.');
          }
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };

    loadSummary();
    return () => { cancelled = true; };
  }, [open, isStudent, appointment?._id, appointment?.summary]);

  if (!appointment) return null;

  const saveSummary = async () => {
    const text = stripSummaryMarkdown(summary);
    if (!text) {
      toast.error('Add a summary before saving.');
      return;
    }

    setSavingSummary(true);
    try {
      const res = await axiosInstance.patch(`/appointments/${appointment._id}/summary`, { summary: text });
      setSummary(stripSummaryMarkdown(res.data.summary || text));
      setSummaryMeta(res.data);
      onSaved?.(res.data);
      toast.success('Session documentation saved.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not save the session summary.');
    } finally {
      setSavingSummary(false);
    }
  };

  const downloadSummary = async (format) => {
    const text = stripSummaryMarkdown(summary);
    if (!text) {
      toast.error('Add a summary before downloading.');
      return;
    }

    setExporting(format);
    try {
      const payload = { appointment: { ...appointment, studentName }, summary: text };
      if (format === 'pdf') await downloadSummaryPdf(payload);
      else await downloadSummaryDocx(payload);
      toast.success(`Documentation downloaded as ${format.toUpperCase()}.`);
    } catch {
      toast.error(`Could not create the ${format.toUpperCase()} file.`);
    } finally {
      setExporting(null);
    }
  };

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

  if (!isStudent) {
    const waitingForSummary = summaryLoading || (open && !summaryMeta && !summary);
    return (
      <Modal
        isOpen={open}
        onClose={() => !savingSummary && !exporting && onClose()}
        title="Session documentation"
        description="Review and edit the draft before keeping it as the session record."
        footer={(
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={savingSummary}
              className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={saveSummary}
              disabled={summaryLoading || savingSummary || !stripSummaryMarkdown(summary)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50"
            >
              {savingSummary ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
              Save documentation
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-brand-soft border border-brand-200 p-3">
            <FileText size={16} className="mt-0.5 shrink-0 text-brand-soft-ink" />
            <div>
              <p className="text-xs font-semibold text-brand-soft-ink">{studentName}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{appointment.type} session · {appointment.date}</p>
              <p className="mt-0.5 text-xs text-ink-muted">This private note is visible only to the assigned counselor.</p>
            </div>
          </div>

          {waitingForSummary ? (
            <div className="flex items-center gap-2 py-10 justify-center text-xs text-ink-muted">
              <Loader size={15} className="animate-spin" /> Preparing summary...
            </div>
          ) : (
            <>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                maxLength={12000}
                rows={14}
                aria-label="Session summary"
                className="w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-600"
                placeholder="Write the session documentation..."
              />
              <div className="flex items-center justify-between gap-3 text-[11px] text-ink-muted">
                <span>{summaryMeta?.editedAt ? 'Counselor-edited documentation' : summaryMeta?.generatedByAi ? 'AI-generated draft' : 'Manual documentation'}</span>
                <span>{summary.length}/12000</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => downloadSummary('pdf')}
                  disabled={!!exporting || !stripSummaryMarkdown(summary)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exporting === 'pdf' ? <Loader size={13} className="animate-spin" /> : <FileDown size={13} />}
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadSummary('docx')}
                  disabled={!!exporting || !stripSummaryMarkdown(summary)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {exporting === 'docx' ? <Loader size={13} className="animate-spin" /> : <FileDown size={13} />}
                  Download DOCX
                </button>
              </div>
            </>
          )}

        </div>
      </Modal>
    );
  }

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
        <FeelingPicker feeling={feeling} savingFeeling={savingFeeling} onSelect={recordFeeling} />
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
