import Modal from '../../ui/Modal';

const ChatRequestModal = ({
  isOpen,
  onClose,
  chatLoadingCounselors,
  chatCounselorId,
  setChatCounselorId,
  chatCounselors,
  chatConcern,
  setChatConcern,
  chatSubmitting,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Request Chat Session">
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-xs text-ink-muted leading-relaxed">
        Select your counselor and briefly describe your concern. All information is kept confidential.
      </p>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-muted">Counselor</label>
        {chatLoadingCounselors ? (
          <div className="text-sm text-ink-muted py-2">Loading counselors...</div>
        ) : (
          <select
            value={chatCounselorId}
            onChange={(e) => setChatCounselorId(e.target.value)}
            className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink focus:border-brand-600 outline-none transition-colors"
          >
            <option value="">Select a counselor</option>
            {chatCounselors.map((c) => (
              <option key={c._id} value={c._id}>{c.fullName} · {String(c.status).toLowerCase() === 'busy' ? 'In Face-To-Face Session' : 'Available'}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-muted">Your Concern</label>
        <textarea
          value={chatConcern}
          onChange={(e) => setChatConcern(e.target.value)}
          placeholder="e.g., I've been feeling overwhelmed with my coursework and need someone to talk to."
          rows={4}
          className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={chatSubmitting || chatLoadingCounselors}
          className="px-5 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50"
        >
          {chatSubmitting ? 'Requesting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  </Modal>
);

export default ChatRequestModal;
