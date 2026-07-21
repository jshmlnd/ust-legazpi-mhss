import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarCheck, Clock, MessageCircle, ArrowUpRight, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarDays, CheckCircle, Trash2, Loader } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import PageShell from '../components/PageShell';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { PATHS } from '../lib/routes';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

const MiniCalendar = ({ year, month, onPrev, onNext, bookings, openSlots, onDateClick }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const today = new Date();
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayBookings = bookings.filter((b) => b.date === dateStr);
    const daySlots = openSlots.filter((s) => s.date === dateStr);
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    cells.push({ day: d, dateStr, bookings: dayBookings, slots: daySlots, isToday });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium text-neutral-900">{monthLabel}</span>
        <button onClick={onNext} className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronRightIcon size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-sm overflow-hidden">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="bg-neutral-50 px-2 py-1.5 text-[9px] font-semibold tracking-[0.1em] uppercase text-neutral-400 text-center">{wd}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="bg-white min-h-[56px]" />;
          return (
            <button
              key={cell.dateStr}
              onClick={() => onDateClick(cell)}
              className={`bg-white min-h-[56px] p-1.5 text-left transition-colors hover:bg-neutral-50 ${cell.isToday ? 'ring-1 ring-inset ring-neutral-900' : ''
                }`}
            >
              <span className={`text-[10px] font-medium ${cell.isToday ? 'bg-neutral-900 text-white size-4 inline-flex items-center justify-center rounded-full' : 'text-neutral-500'
                }`}>
                {cell.day}
              </span>
              {cell.bookings.length > 0 && <div className="mt-0.5"><span className="block size-1.5 rounded-full bg-neutral-900 mx-auto" /></div>}
              {cell.slots.length > 0 && !cell.bookings.length && <div className="mt-0.5"><span className="block size-1.5 rounded-full bg-emerald-400 mx-auto" /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SessionCard = ({ session, type }) => {
  const isUpcoming = type === 'upcoming';
  const counselorLabel = session.counselorName || session.counselor?.fullName || `Counselor #${session.counselorId}`;

  return (
    <div className="bg-white border border-neutral-200 rounded-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${session.type === 'Chat' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'
            }`}>
            {session.type === 'Chat' ? <MessageCircle size={18} /> : <CalendarCheck size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-0.5">
              <h3 className="text-sm font-medium text-neutral-900">{counselorLabel}</h3>
              <span className={`text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded-sm border ${session.type === 'Face-To-Face' && (session.status === 'active' || session.status === 'confirmed') ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                session.status === 'confirmed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                  session.status === 'pending' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                    'text-emerald-400 border-emerald-200'
                }`}>
                {session.type === 'Face-To-Face' && (session.status === 'active' || session.status === 'confirmed') ? 'Approved' : session.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400 mt-1">
              <span className="inline-flex items-center gap-1"><Calendar size={11} /> {session.date}</span>
              <span className="inline-flex items-center gap-1"><Clock size={11} /> {session.time}</span>
              <span>{session.duration}</span>
              <span className="text-[10px] font-medium uppercase">{session.type === 'Chat' ? 'Chat' : 'Face-to-Face'}</span>
            </div>
            {!isUpcoming && session.notes && (
              <p className="text-xs text-neutral-500 mt-2 italic">&ldquo;{session.notes}&rdquo;</p>
            )}
          </div>
        </div>

        {isUpcoming && session.type !== 'f2f' && (
          <Link to={PATHS.MESSAGES} className="shrink-0 size-9 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors">
            <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
};

const SessionsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const [archiving, setArchiving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bookRes, slotRes] = await Promise.all([
        axiosInstance.get('/appointments'),
        axiosInstance.get('/availability/0'),
      ]);
      setAppointments(bookRes.data);
      setSlots(slotRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("appointment:updated", fetchData);
    return () => socket.off("appointment:updated", fetchData);
  }, [fetchData]);

  const upcoming = appointments.filter((a) => ['pending', 'confirmed', 'active'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled', 'declined'].includes(a.status));
  const hasPast = past.length > 0;

  const dateStr = selectedDay?.dateStr || '';
  const daySlots = slots.filter((s) => s.date === dateStr);
  const dayBookings = appointments.filter((b) => b.date === dateStr);

  const handleDateClick = (cell) => { setSelectedDay(cell); setModalOpen(true); };
  const handleBook = async (slot) => {
    try {
      await axiosInstance.post('/appointments', {
        counselorId: slot.counselorId,
        fullName: slot.fullName,
        type: slot.type || 'Chat',
        date: slot.date,
        time: slot.time,
        concern: '',
      });
      toast.success(`Booked ${slot.time}`);
      const res = await axiosInstance.get('/appointments');
      setAppointments(res.data);
    } catch {
      toast.error('Failed to book slot');
    }
  };

  const handleClearPast = async () => {
    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-700">Clear all past sessions?</span>
          <button
            onClick={() => { toast.dismiss(t.id); resolve(true); }}
            className="px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm"
          >
            Clear
          </button>
          <button
            onClick={() => { toast.dismiss(t.id); resolve(false); }}
            className="px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-neutral-500 border border-neutral-300 hover:text-neutral-700 transition-colors rounded-sm"
          >
            Cancel
          </button>
        </div>
      ));
    });
    if (!confirmed) return;
    setArchiving(true);
    try {
      await axiosInstance.post('/appointments/archive-past');
      setAppointments((prev) => prev.filter((a) => a.status !== 'archived'));
      toast.success('Past sessions cleared');
    } catch {
      toast.error('Failed to clear past sessions');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <PageShell title="My Sessions" subtitle="Manage your sessions and book appointments"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

  return (
    <PageShell title="My Sessions" subtitle="Manage your sessions and book appointments">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-1">
          <MiniCalendar
            year={year} month={month}
            onPrev={() => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); }}
            onNext={() => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); }}
            bookings={appointments} openSlots={slots}
            onDateClick={handleDateClick}
          />
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div id="upcoming-sessions">
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 mb-3">Active Chat Sessions</h3>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming sessions" description="Book a session with your counselor to get started." />
            ) : (
              <div className="space-y-px bg-neutral-200 rounded-sm overflow-hidden">
                {upcoming.map((s) => <SessionCard key={s._id} session={s} type="upcoming" />)}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 mb-3">Available Slots</h3>
            {slots.length === 0 ? (
              <p className="text-xs text-neutral-400">No available slots at this time. Check back later.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-200 rounded-sm overflow-hidden">
                {slots.map((slot) => (
                  <div key={slot._id} className="bg-white p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{slot.fullName || `Counselor #${slot.counselorId}`}</p>
                      <p className="text-xs text-neutral-400">{slot.date} · {slot.time}</p>
                    </div>
                    <button
                      onClick={() => handleBook(slot)}
                      className="px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400 shrink-0">Past Sessions</span>
        {hasPast && (
          <button
            onClick={handleClearPast}
            disabled={archiving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase text-red-600 hover:text-red-700 transition-colors rounded-sm disabled:opacity-50"
          >
            {archiving ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Clear All
          </button>
        )}
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      {past.length === 0 ? (
        <EmptyState icon={Clock} title="No past sessions" description="Your session history will appear here after your first appointment." />
      ) : (
        <div className="space-y-px bg-neutral-200 rounded-sm overflow-hidden">
          {past.map((s) => <SessionCard key={s._id} session={s} type="past" />)}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedDay ? `Schedule — ${dateStr}` : ''}>
        {dayBookings.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 block mb-2">Your Appointments</span>
            <div className="space-y-1.5">
              {dayBookings.map((b) => (
                <div key={b._id} className="text-sm text-neutral-700 flex items-center gap-2"><CheckCircle size={14} className="text-neutral-900" /> {b.time} — {b.type}</div>
              ))}
            </div>
          </div>
        )}
        {daySlots.length > 0 ? (
          <div>
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400 block mb-2">Available Slots</span>
            <div className="space-y-1.5">
              {daySlots.map((s) => (
                <div key={s._id} className="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-sm">
                  <span className="text-sm text-neutral-700">{s.time}</span>
                  <button onClick={() => { handleBook(s); setModalOpen(false); }} className="px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">Book</button>
                </div>
              ))}
            </div>
          </div>
        ) : dayBookings.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">No slots or bookings for this day.</p>
        ) : null}
      </Modal>
    </PageShell>
  );
};

export default SessionsPage;
