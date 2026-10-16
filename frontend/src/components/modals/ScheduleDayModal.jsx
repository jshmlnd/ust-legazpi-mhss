import { CheckCircle } from 'lucide-react';
import Modal from '../../ui/Modal';

const ScheduleDayModal = ({
  isOpen,
  onClose,
  selectedDay,
  dateStr,
  dayBookings,
  daySlots,
  daySlotGroups,
  onBook,
  setModalOpen,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={selectedDay ? `Schedule — ${dateStr}` : ''}>
    <div className="max-h-[60vh] overflow-y-auto pr-1">
      {dayBookings.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-ink-muted block mb-2">Your Appointments</span>
          <div className="space-y-1.5">
            {dayBookings.map((b) => (
              <div key={b._id} className="text-sm text-ink-soft flex items-center gap-2"><CheckCircle size={14} className="text-ink" /> {b.time} — {b.type}</div>
            ))}
          </div>
        </div>
      )}
      {daySlots.length > 0 ? (
        <div>
          <span className="text-xs font-semibold text-ink-muted block mb-2">Available Slots</span>
          <div className="space-y-3">
            {daySlotGroups.map((c) => (
              <div key={c.counselorId}>
                <p className="text-xs font-medium text-ink-soft mb-1.5">{c.fullName || `Counselor #${c.counselorId}`}</p>
                <div className="flex flex-wrap gap-2">
                  {c.times.map(({ time, slot }) => (
                    <button
                      key={slot._id}
                      onClick={() => { onBook(slot); setModalOpen(false); }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-line text-ink-soft hover:border-brand-600 hover:bg-brand-600 hover:text-brand-fg transition-colors"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : dayBookings.length === 0 ? (
        <p className="text-sm text-ink-muted py-4 text-center">No slots or bookings for this day.</p>
      ) : null}
    </div>
  </Modal>
);

export default ScheduleDayModal;
