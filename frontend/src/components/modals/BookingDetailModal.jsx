import { Check, User, X } from 'lucide-react';
import Modal from '../../ui/Modal';
import { axiosInstance } from '../../lib/axios';
import { toast } from 'react-toastify';

const getStatusLabel = (b) => {
  if (b.type === 'Chat') {
    if (b.status === 'on-going' || b.status === 'active') return { label: 'On-going', style: 'text-brand-soft-ink bg-brand-soft border-brand-200' };
    if (b.status === 'ended' || b.status === 'completed') return { label: 'Ended', style: 'text-ink-muted bg-line border-line' };
    return { label: b.status, style: 'text-ink-muted bg-line border-line' };
  }
  if (b.type === 'Face-To-Face' || b.type === 'f2f') {
    if (b.status === 'pending') return { label: 'Waiting for Approval', style: 'text-warning-ink bg-warning-soft border-warning/30' };
    if (b.status === 'on-going') return { label: 'On-going', style: 'text-brand-soft-ink bg-brand-soft border-brand-200' };
    if (b.status === 'confirmed' || b.status === 'active') return { label: 'Approved', style: 'text-brand-soft-ink bg-brand-soft border-brand-200' };
    if (b.status === 'paused') return { label: 'Paused', style: 'text-info-ink bg-info-soft border-info/30' };
    if (b.status === 'ended') return { label: 'Ended', style: 'text-ink-muted bg-line border-line' };
    return { label: b.status, style: 'text-ink-muted bg-line border-line' };
  }
  return { label: b.status, style: 'text-ink-muted bg-line border-line' };
};

const BookingDetailModal = ({ isOpen, onClose, date, bookings, onRefresh }) => {
  if (!date) return null;
  const dateLabel = date.dateStr || '';
  const dayBookings = bookings.filter((b) => b.date === dateLabel && b.status !== 'archived');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bookings — ${dateLabel}`} wide>
      {dayBookings.length === 0 ? (
        <p className="text-sm text-ink-muted py-6 text-center">No bookings on this day.</p>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {dayBookings.map((b) => {
            const status = getStatusLabel(b);
            return (
            <div key={b._id} className="flex items-center justify-between py-3 px-4 bg-canvas rounded-lg">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-line flex items-center justify-center">
                  <User size={14} className="text-ink-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{b.studentName || `STU-${b.studentDynamicId || b.studentId}`}</p>
                  <p className="text-xs text-ink-muted">{b.time} · {b.type === 'Chat' ? 'Chat Session' : 'Face-to-Face'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {b.type === 'Face-To-Face' && (b.status === 'confirmed' || b.status === 'active') && (
                  <button
                    onClick={async () => {
                      try {
                        await axiosInstance.patch(`/appointments/${b._id}`, { status: 'on-going' });
                        toast.success('F2F session started');
                        onRefresh();
                      } catch { toast.error('Failed to start session'); }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
                  >
                    Start
                  </button>
                )}
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${status.style}`}>
                  {status.label}
                </span>
                {b.type === 'Face-To-Face' && b.status === 'pending' && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch(`/appointments/${b._id}`, { status: 'confirmed' });
                          toast.success('Booking approved');
                          onRefresh();
                        } catch { toast.error('Failed to approve booking'); }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch(`/appointments/${b._id}`, { status: 'declined' });
                          toast.success('Booking declined');
                          onRefresh();
                        } catch { toast.error('Failed to decline booking'); }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-danger hover:bg-danger/90 transition-colors rounded-lg"
                    >
                      <X size={12} /> Decline
                    </button>
                  </>
                )}
                {(b.type === 'Face-To-Face' && b.status === 'on-going') && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch(`/appointments/${b._id}`, { status: 'paused' });
                          toast.success('F2F session paused');
                          onRefresh();
                        } catch { toast.error('Failed to pause session'); }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-warning hover:bg-warning/90 transition-colors rounded-lg"
                    >
                      Pause
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch(`/appointments/${b._id}`, { status: 'ended' });
                          toast.success('F2F session ended');
                          onRefresh();
                        } catch { toast.error('Failed to end session'); }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-danger hover:bg-danger/90 transition-colors rounded-lg"
                    >
                      End
                    </button>
                  </>
                )}
                {b.type === 'Face-To-Face' && b.status === 'paused' && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch(`/appointments/${b._id}`, { status: 'on-going' });
                          toast.success('F2F session resumed');
                          onRefresh();
                        } catch { toast.error('Failed to resume session'); }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
                    >
                      Resume
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await axiosInstance.patch(`/appointments/${b._id}`, { status: 'ended' });
                          toast.success('F2F session ended');
                          onRefresh();
                        } catch { toast.error('Failed to end session'); }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-ink bg-danger hover:bg-danger/90 transition-colors rounded-lg"
                    >
                      End
                    </button>
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default BookingDetailModal;
