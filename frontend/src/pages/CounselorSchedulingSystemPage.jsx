import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, User, Ban, Plus, CalendarDays } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { PATHS } from '../lib/routes';
import toast from 'react-hot-toast';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

const CalendarGrid = ({ year, month, bookings, holidays, onDateClick, slotDates }) => {
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
    <div className="grid grid-cols-7 gap-px bg-neutral-200">
      {WEEKDAYS.map((wd) => (
        <div key={wd} className="bg-neutral-50 px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-neutral-400 text-center">{wd}</div>
      ))}
      {cells.map((cell, i) => {
        if (!cell) return <div key={`empty-${i}`} className="bg-white min-h-[100px]" />;
        const hasSlots = slotDates && slotDates.has(cell.dateStr);
        return (
          <button
            key={cell.dateStr}
            onClick={() => onDateClick(cell)}
            className={`bg-white min-h-[100px] p-2 text-left transition-colors hover:bg-neutral-50 relative ${
              cell.isHoliday ? 'bg-neutral-100/50' : ''
            }`}
          >
            <span className={`text-xs font-medium ${cell.isToday ? 'bg-neutral-900 text-white size-5 inline-flex items-center justify-center rounded-full' : cell.isHoliday ? 'text-neutral-300 line-through' : 'text-neutral-600'}`}>
              {cell.day}
            </span>
            {cell.isHoliday && <span className="block text-[9px] text-neutral-400 mt-1">Holiday</span>}
            <div className="mt-1.5 space-y-0.5">
              {cell.bookings.slice(0, 3).map((b) => (
                <div key={b._id} className={`text-[9px] font-medium px-1 py-0.5 rounded-sm truncate ${
                  b.type === 'chat' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                }`}>
                  {b.time} STU-{b.studentId}
                </div>
              ))}
              {cell.bookings.length > 3 && <span className="text-[9px] text-neutral-400 pl-1">+{cell.bookings.length - 3} more</span>}
            </div>
            {hasSlots && (
              <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
};

const SlotManager = ({ availableSlots, onToggleSlot, selectedDate }) => (
  <div className="bg-white border border-neutral-200 rounded-sm p-5">
    <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 block mb-3">
      Availability Slots{selectedDate ? ` — ${selectedDate}` : ''}
    </span>
    {availableSlots.length === 0 && (
      <p className="text-xs text-neutral-400 mb-3">No slots set for this date. Toggle times below to add availability.</p>
    )}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {SLOTS.map((slot) => {
        const isAvailable = availableSlots.includes(slot);
        return (
          <button
            key={slot}
            onClick={() => onToggleSlot(slot)}
            className={`px-3 py-2 text-xs font-medium rounded-sm border transition-colors ${
              isAvailable ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  </div>
);

const BookingDetailModal = ({ isOpen, onClose, date, bookings }) => {
  const navigate = useNavigate();
  if (!date) return null;
  const dateLabel = date.dateStr || '';
  const dayBookings = bookings.filter((b) => b.date === dateLabel);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bookings — ${dateLabel}`} wide>
      {dayBookings.length === 0 ? (
        <p className="text-sm text-neutral-400 py-6 text-center">No bookings on this day.</p>
      ) : (
        <div className="space-y-2">
          {dayBookings.map((b) => (
            <div key={b._id} className="flex items-center justify-between py-3 px-4 bg-neutral-50 rounded-sm">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-neutral-200 flex items-center justify-center">
                  <User size={14} className="text-neutral-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">STU-{b.studentId}</p>
                  <p className="text-[11px] text-neutral-400">{b.time} · {b.type === 'chat' ? 'Chat Session' : 'Face-to-Face'}</p>
                </div>
              </div>
              <button
                onClick={() => { onClose(); navigate(PATHS.MANAGE_SESSIONS); }}
                className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
              >
                {b.type === 'chat' ? 'Join' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

const CounselorSchedulingSystemPage = () => {
  const { authUser } = useAuthStore();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedCell, setSelectedCell] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes] = await Promise.all([
          axiosInstance.get('/appointments'),
        ]);
        setBookings(bookRes.data);
        if (authUser?._id) {
          const slotRes = await axiosInstance.get(`/availability/${authUser._id}`);
          setSlots(slotRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch scheduling data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authUser]);

  const availableSlots = slots
    .filter((s) => s.date === selectedDate && s.isAvailable)
    .map((s) => s.time)
    .sort();

  const slotDates = new Set(
    slots.filter((s) => s.isAvailable).map((s) => s.date).filter(Boolean)
  );

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };

  const handleDateClick = (cell) => { setSelectedCell(cell); setModalOpen(true); };
  const handleToggleSlot = async (time) => {
    try {
      const updated = availableSlots.includes(time)
        ? availableSlots.filter((s) => s !== time)
        : [...availableSlots, time].sort();
      await axiosInstance.post('/availability', {
        slots: updated.map((t) => ({ date: selectedDate, time: t })),
      });
      const slotRes = await axiosInstance.get(`/availability/${authUser._id}`);
      setSlots(slotRes.data);
      toast.success(updated.includes(time) ? 'Slot added' : 'Slot removed');
    } catch (err) {
      toast.error('Failed to update slot');
    }
  };

  if (loading) return <PageShell title="Appointments Scheduling" subtitle="Manage availability slots and view appointment bookings"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

  return (
    <PageShell title="Appointments Scheduling" subtitle="Manage availability slots and view appointment bookings">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="size-8 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-neutral-400" />
              <span className="text-sm font-medium text-neutral-900">{monthLabel}</span>
            </div>
            <button onClick={nextMonth} className="size-8 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <CalendarGrid
            year={year} month={month}
            bookings={bookings} holidays={[]}
            onDateClick={handleDateClick}
            slotDates={slotDates}
          />
        </div>
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-sm p-5">
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 block mb-3">Set Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 focus:border-neutral-900 outline-none transition-colors"
            />
          </div>
          <SlotManager availableSlots={availableSlots} onToggleSlot={handleToggleSlot} selectedDate={selectedDate} />
          <div className="bg-white border border-neutral-200 rounded-sm p-5">
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 block mb-3">Legend</span>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <span className="size-3 rounded-sm bg-emerald-50 border border-emerald-200" /> Chat Session
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                <span className="size-3 rounded-sm bg-neutral-100 border border-neutral-200" /> Face-to-Face
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-400">
                <span className="size-3 rounded-sm bg-blue-100 border border-blue-200" /> Availability Set
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-400">
                <span className="size-3 rounded-sm bg-neutral-100/50 border border-neutral-200 flex items-center justify-center"><Ban size={8} /></span> Holiday / Blocked
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} date={selectedCell} bookings={bookings} />
    </PageShell>
  );
};

export default CounselorSchedulingSystemPage;
