import { useState, useEffect } from 'react';
import { Lightbulb, Send, Trash2, Loader, Clock } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';

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
    <main className="min-h-screen bg-white pt-[calc(68px+3rem)] pb-28 px-6 lg:px-10">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-10">
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-light tracking-[-0.03em] text-neutral-900">
            <span className="font-medium">Suggestions</span>
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Help us improve the system. Share your ideas, feedback, or report issues.
          </p>
        </div>

        {!isCounselor && (
          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-sm bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0 mt-1">
                <Lightbulb size={16} />
              </div>
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your suggestion..."
                  rows={3}
                  className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-y"
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-neutral-400">{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</p>
                  <button
                    type="submit"
                    disabled={!message.trim() || submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-px bg-neutral-200 rounded-sm overflow-hidden">
          {loading ? (
            <div className="bg-white px-6 py-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="bg-white px-6 py-12 text-center">
              <p className="text-xs text-neutral-400">No suggestions yet.</p>
            </div>
          ) : (
            suggestions.map((s) => (
              <div key={s._id} className="bg-white px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-900 leading-relaxed">{s.message}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                    <Clock size={10} />
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {isCounselor && (
                      <span className="ml-1">· STU-{s.studentId}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s._id)}
                  className="size-8 flex items-center justify-center rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default SuggestionsPage;
