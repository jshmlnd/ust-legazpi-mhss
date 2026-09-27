import { useState, useEffect } from 'react';
import { Send, Loader, MessageCircleQuestionMark } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-toastify';
import PageShell from '../ui/PageShell';

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
      toast.success('Suggestion removed');
    } catch {
      toast.error('Failed to delete suggestion');
    }
  };

  return (
    <PageShell title="Report an issue..." description="Share your feedback, or report issues." narrow>
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
    </PageShell>
  );
};

export default SuggestionsPage;
