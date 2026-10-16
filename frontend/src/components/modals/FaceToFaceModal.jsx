import { Loader } from 'lucide-react';
import Modal from '../../ui/Modal';

const FaceToFaceModal = ({
  isOpen,
  onClose,
  chatLoadingCounselors,
  chatCounselors,
  f2fCounselorId,
  handleF2fCounselorChange,
  f2fLoadingSlots,
  f2fAvailableDates,
  f2fDate,
  setF2fDate,
  f2fAvailableTimes,
  f2fTime,
  setF2fTime,
  f2fConcern,
  setF2fConcern,
  f2fSubmitting,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Book Face-to-Face Session">
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <p className="text-xs text-ink-muted leading-relaxed">
        Schedule an on-campus appointment with your counselor. Select a date and time that works for you.
      </p>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-muted">Counselor</label>
        {chatLoadingCounselors ? (
          <div className="text-sm text-ink-muted py-2">Loading counselors...</div>
        ) : (
          <select
            value={f2fCounselorId}
            onChange={(e) => handleF2fCounselorChange(e.target.value)}
            className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink focus:border-brand-600 outline-none transition-colors"
          >
            <option value="">Select a counselor</option>
            {chatCounselors.map((c) => (
              <option key={c._id} value={c._id}>{c.fullName}</option>
            ))}
          </select>
        )}
      </div>

      {f2fCounselorId && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-ink-muted">Available Dates</label>
          {f2fLoadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-ink-muted py-2"><Loader size={14} className="animate-spin" /> Loading available dates...</div>
          ) : f2fAvailableDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {f2fAvailableDates.map(({ date, count }) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => { setF2fDate(date); setF2fTime(''); }}
                  className={`flex flex-col items-center px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    f2fDate === date
                      ? 'bg-brand-600 text-brand-fg border-brand-600'
                      : 'bg-surface text-ink-soft border-line hover:border-line-strong'
                  }`}
                >
                  <span>{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="text-ink-muted">
                    {count} slot{count !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted py-1">This counselor has no open availability yet.</p>
          )}
        </div>
      )}

      {f2fCounselorId && f2fDate && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-ink-muted">Available Times</label>
          {f2fAvailableTimes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {f2fAvailableTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setF2fTime(t)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    f2fTime === t
                      ? 'bg-brand-600 text-brand-fg border-brand-600'
                      : 'bg-surface text-ink-soft border-line hover:border-line-strong'
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

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-muted">Concern</label>
        <textarea
          required
          value={f2fConcern}
          onChange={(e) => setF2fConcern(e.target.value)}
          placeholder="e.g., I'd like to discuss my academic performance and study habits."
          rows={3}
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
          disabled={f2fSubmitting || !f2fCounselorId || !f2fDate || !f2fTime}
          className="px-5 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg disabled:opacity-50"
        >
          {f2fSubmitting ? 'Booking...' : 'Book Session'}
        </button>
      </div>
    </form>
  </Modal>
);

export default FaceToFaceModal;
