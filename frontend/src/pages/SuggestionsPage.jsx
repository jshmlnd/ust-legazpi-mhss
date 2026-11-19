import { useState, useEffect } from 'react';
import { Send, Loader, MessageCircleQuestionMark, Check, Trash2 } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-toastify';
import PageShell from '../ui/PageShell';
import EmptyState from '../ui/EmptyState';

const SuggestionsPage = () => {
  const { authUser } = useAuthStore();
  const isCounselor = authUser?.userType?.toLowerCase() === 'counselor';
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axiosInstance.get('/suggestions');
        setSuggestions(res.data);
      } catch {
        toast.error('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/suggestions', { message: message.trim() });
      setSuggestions((prev) => [res.data, ...prev]);
      setMessage('');
      toast.success('Suggestion submitted');
    } catch {
      toast.error('Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/suggestions/${id}`);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
      toast.success(isCounselor ? 'Marked as resolved' : 'Report withdrawn');
    } catch {
      toast.error('Failed to delete suggestion');
    }
  };

  return (
    <PageShell
      title={isCounselor ? 'Help Desk' : 'Report an issue...'}
      description={isCounselor ? 'Issues and feedback reported by students.' : 'Share your feedback, or report issues.'}
      narrow
    >
        {!isCounselor && (
          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg bg-line flex items-center justify-center text-ink-muted shrink-0 mt-1">
                <MessageCircleQuestionMark size={16} />
              </div>
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I encountered an issue..."
                  rows={3}
                  className="w-full bg-transparent border border-line text-sm rounded-lg px-4 py-3 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors resize-y"
                />
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={!message.trim() || submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <section aria-label={isCounselor ? 'Student reports' : 'Your reports'}>
          <h2 className="mb-3 text-xs font-semibold text-ink-muted">
            {isCounselor ? `Open reports (${suggestions.length})` : 'Your reports'}
          </h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader size={18} className="animate-spin text-ink-muted" /></div>
          ) : suggestions.length === 0 ? (
            <EmptyState
              icon={MessageCircleQuestionMark}
              title={isCounselor ? 'No open reports' : 'No reports yet'}
              description={isCounselor ? 'Messages students send through the Help Desk appear here.' : 'Anything you send above shows up here.'}
            />
          ) : (
            <ul className="space-y-3">
              {suggestions.map((s) => (
                <li key={s._id} className="!rounded-[1.25rem] border border-line bg-surface p-4 shadow-e1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                        {isCounselor && <span className="font-semibold text-ink">STU-{s.studentDynamicId || s.studentId}</span>}
                        <time dateTime={s.createdAt}>
                          {new Date(s.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </p>
                      <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-ink-soft">{s.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(s._id)}
                      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                        isCounselor ? 'text-brand-700 hover:bg-brand-soft' : 'text-ink-muted hover:text-danger-ink hover:bg-danger-soft'
                      }`}
                    >
                      {isCounselor ? <><Check size={13} aria-hidden="true" /> Resolve</> : <><Trash2 size={13} aria-hidden="true" /> Withdraw</>}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
    </PageShell>
  );
};

export default SuggestionsPage;
