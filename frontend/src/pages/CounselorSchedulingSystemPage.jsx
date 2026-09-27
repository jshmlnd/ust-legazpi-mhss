import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Ban, CalendarDays, Check, X } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import Modal from '../ui/Modal';
import { toast } from 'react-toastify';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

const CalendarGrid = ({ year, month, bookings, holidays, onDateClick, slotDates, multiMode, selectedDates, onToggleDate }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const today = new Date();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isHoliday = holidays.includes(dateStr);
    const dayBookings = bookings.filter((b) => b.date === dateStr);
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    cells.push({ day: d, dateStr, isHoliday, bookings: dayBookings, isToday });
  }

  return (
    <div className="grid grid-cols-7 gap-px bg-line">
      {WEEKDAYS.map((wd) => (
        <div key={wd} className="bg-canvas px-3 py-2 text-xs font-semibold text-ink-muted text-center">{wd}</div>
      ))}
      {cells.map((cell, i) => {
        if (!cell) return <div key={`empty-${i}`} className="bg-surface min-h-[100px]" />;
        const hasSlots = slotDates && slotDates.has(cell.dateStr);
        const isSelected = multiMode && selectedDates?.has(cell.dateStr);
        return (
          <button
            key={cell.dateStr}
            onClick={() => multiMode ? onToggleDate?.(cell.dateStr) : onDateClick(cell)}
            className={`bg-surface min-h-[100px] p-2 text-left transition-colors relative ${
              multiMode ? 'hover:bg-line cursor-pointer' : 'hover:bg-canvas'
            } ${
              isSelected ? 'bg-line ring-2 ring-inset ring-brand-600' : ''
            } ${
              cell.isHoliday ? 'bg-line/50' : ''
            }`}
          >
            <span className={`text-xs font-medium ${cell.isToday ? 'bg-brand-600 text-ink size-5 inline-flex items-center justify-center rounded-full' : cell.isHoliday ? 'text-ink-muted line-through' : 'text-ink-soft'}`}>
              {cell.day}
            </span>
            {cell.isHoliday && <span className="block text-xs text-ink-muted mt-1">Holiday</span>}
            <div className="mt-1.5 space-y-0.5">
              {cell.bookings.slice(0, 3).map((b) => (
                <div key={b._id} className={`text-xs font-medium px-1 py-0.5 rounded-lg truncate ${
                  b.type === 'Chat' ? 'bg-brand-soft text-brand-soft-ink' : 'bg-line text-ink-soft'
                }`}>
                  {b.time} {b.studentName || `STU-${b.studentDynamicId || b.studentId}`}
                </div>
              ))}
              {cell.bookings.length > 3 && <span className="text-xs text-ink-muted pl-1">+{cell.bookings.length - 3} more</span>}
            </div>
            {hasSlots && (
              <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-info" />
            )}
            {isSelected && (
              <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-brand-600 flex items-center justify-center">
                <Check size={10} className="text-ink" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const SlotManager = ({ availableSlots, onToggleSlot, selectedDate, multiMode, selectedDates }) => (
  <div className="bg-surface border border-line rounded-lg p-5">
    <span className="text-xs font-semibold text-ink-muted block mb-3">
      {multiMode && selectedDates?.size > 0 ? `Slots for ${selectedDates.size} dates` : `Availability Slots${selectedDate ? ` — ${selectedDate}` : ''}`}
    </span>
    {availableSlots.length === 0 && (
      <p className="text-xs text-ink-muted mb-3">No slots set. Toggle times below to add availability.</p>
    )}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {SLOTS.map((slot) => {
        const isAvailable = availableSlots.includes(slot);
        return (
          <button
            key={slot}
            onClick={() => onToggleSlot(slot)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              isAvailable ? 'bg-brand-600 text-ink border-brand-600' : 'bg-surface text-ink-muted border-line hover:border-line-strong'
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  </div>
);

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

const CounselorSchedulingSystemPage = () => {
  const { authUser } = useAuthStore();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  // ?date=YYYY-MM-DD deep link (e.g. "View" from Session Requests) — read on
  // mount; every in-app navigation here remounts the page, so no sync effect
  // is needed. The date input writes the selection back to the URL.
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const validDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr;
  // One-shot deep-link target — consumed by the initial data fetch, which
  // auto-opens that day's bookings modal once bookings have loaded.
  const deepLinkDate = useRef(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null);
  const [year, setYear] = useState(() => Number(validDate.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(validDate.slice(5, 7)) - 1);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(validDate);
  const [selectedCell, setSelectedCell] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [multiMode, setMultiMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());

  const syncDateParam = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setSearchParams(dateStr === todayStr ? {} : { date: dateStr }, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [bookRes] = await Promise.all([
          axiosInstance.get('/appointments'),
        ]);
        if (cancelled) return;
        setBookings(bookRes.data);
        // Deep link (?date=…) — auto-open that day's bookings now that data is in.
        const linkedDate = deepLinkDate.current;
        deepLinkDate.current = null;
        if (linkedDate) {
          setSelectedCell({ dateStr: linkedDate, day: Number(linkedDate.slice(8, 10)), isHoliday: false, isToday: false, bookings: [] });
          setModalOpen(true);
        }
        if (authUser?._id) {
          const slotRes = await axiosInstance.get(`/availability/${authUser._id}`);
          if (!cancelled) setSlots(slotRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch scheduling data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [authUser]);

  const slotDates = new Set(
    slots.filter((s) => s.isAvailable).map((s) => s.date).filter(Boolean)
  );

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };

  const handleDateClick = (cell) => { setSelectedCell(cell); setModalOpen(true); };

  const handleToggleDate = (dateStr) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      if (next.size === 1) setSelectedDate([...next][0]);
      return next;
    });
  };

  const activeDates = multiMode ? [...selectedDates] : [selectedDate];

  const availableSlots = (() => {
    if (multiMode && selectedDates.size > 0) {
      const first = [...selectedDates][0];
      return slots.filter((s) => s.date === first && s.isAvailable).map((s) => s.time).sort();
    }
    return slots.filter((s) => s.date === selectedDate && s.isAvailable).map((s) => s.time).sort();
  })();

  const refreshBookings = async () => {
    try {
      const res = await axiosInstance.get('/appointments');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to refresh bookings:', err);
    }
  };

  const handleToggleSlot = async (time) => {
    try {
      const updated = availableSlots.includes(time)
        ? availableSlots.filter((s) => s !== time)
        : [...availableSlots, time].sort();
      const allSlots = activeDates.flatMap((d) => updated.map((t) => ({ date: d, time: t })));
      await axiosInstance.post('/availability', { slots: allSlots, dates: activeDates });
      const slotRes = await axiosInstance.get(`/availability/${authUser._id}`);
      setSlots(slotRes.data);
      toast.success(`${activeDates.length > 1 ? `${activeDates.length} dates updated` : 'Slot'} ${updated.includes(time) ? 'added' : 'removed'}`);
    } catch {
      toast.error('Failed to update slot');
    }
  };

  if (loading) return <PageShell title="Appointments" description="Manage availability slots and view appointment bookings"><PageShellSkeleton showCalendar showSidebar /></PageShell>;

  return (
    <PageShell title="Appointments" description="Manage availability slots and view appointment bookings">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="size-8 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-ink-muted" />
              <span className="text-sm font-medium text-ink">{monthLabel}</span>
            </div>
            <button onClick={nextMonth} className="size-8 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <CalendarGrid
            year={year} month={month}
            bookings={bookings} holidays={[]}
            onDateClick={handleDateClick}
            slotDates={slotDates}
            multiMode={multiMode}
            selectedDates={selectedDates}
            onToggleDate={handleToggleDate}
          />
        </div>
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-surface border border-line rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-muted">Set Date</span>
              <button
                onClick={() => { setMultiMode((m) => !m); setSelectedDates(new Set()); }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                  multiMode ? 'bg-brand-600 text-ink border-brand-600' : 'bg-surface text-ink-muted border-line hover:border-line-strong'
                }`}
              >
                {multiMode ? 'Multi' : 'Single'}
              </button>
            </div>
            {multiMode ? (
              <p className="text-xs text-ink-muted">Click calendar dates to select, then toggle time slots to apply to all.</p>
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => syncDateParam(e.target.value)}
                className="w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink focus:border-brand-600 outline-none transition-colors"
              />
            )}
          </div>
          <SlotManager availableSlots={availableSlots} onToggleSlot={handleToggleSlot} selectedDate={selectedDate} multiMode={multiMode} selectedDates={selectedDates} />
          <div className="bg-surface border border-line rounded-lg p-5">
            <span className="text-xs font-semibold text-ink-muted block mb-3">Legend</span>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-ink-soft">
                <span className="size-3 rounded-lg bg-brand-soft border border-brand-200" /> Chat Session
              </div>
              <div className="flex items-center gap-2.5 text-xs text-ink-soft">
                <span className="size-3 rounded-lg bg-line border border-line" /> Face-to-Face
              </div>
              <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                <span className="size-3 rounded-lg bg-info-soft border border-info/30" /> Availability Set
              </div>
              <div className="flex items-center gap-2.5 text-xs text-ink-muted">
                <span className="size-3 rounded-lg bg-line/50 border border-line flex items-center justify-center"><Ban size={8} /></span> Holiday / Blocked
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} date={selectedCell} bookings={bookings} onRefresh={refreshBookings} />
    </PageShell>
  );
};

export default CounselorSchedulingSystemPage;
