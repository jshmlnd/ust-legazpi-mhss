import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarCheck, Clock, MessageCircle, ArrowUpRight, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarDays, CheckCircle, Trash2, Loader } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import PageShell from '../components/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import { PATHS } from '../lib/routes';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();

const formatLongDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
};

const groupSlotsByDate = (slots) => {
  const byDate = {};
  slots
    .slice()
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .forEach((slot) => {
      if (!byDate[slot.date]) byDate[slot.date] = {};
      const key = String(slot.counselorId);
      if (!byDate[slot.date][key]) {
        byDate[slot.date][key] = { counselorId: slot.counselorId, fullName: slot.fullName, times: [] };
      }
      byDate[slot.date][key].times.push({ time: slot.time, slot });
    });
  return Object.entries(byDate).map(([date, counselorsMap]) => ({
    date,
    counselors: Object.values(counselorsMap),
  }));
};

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

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-[11px] text-neutral-500">{page + 1} / {totalPages}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRightIcon size={14} />
      </button>
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

        {isUpcoming && session.type === 'Chat' && (
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
  const [pastPage, setPastPage] = useState(0);
  const [slotsPage, setSlotsPage] = useState(0);
  const [slotCounselorFilter, setSlotCounselorFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, slotRes] = await Promise.all([
          axiosInstance.get('/appointments'),
          axiosInstance.get('/availability'),
        ]);
        setAppointments(bookRes.data);
        setSlots(slotRes.data.filter((s) => s.isAvailable !== false));
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const socket = getSocket();
    if (!socket) return;
    socket.on("appointment:updated", fetchData);
    return () => socket.off("appointment:updated", fetchData);
  }, []);

  const refreshSlots = async () => {
    try {
      const slotRes = await axiosInstance.get('/availability');
      setSlots(slotRes.data.filter((s) => s.isAvailable !== false));
    } catch (err) {
      console.error('Failed to refresh slots:', err);
    }
  };

  const upcoming = appointments.filter((a) => ['pending', 'confirmed', 'active', 'on-going', 'paused'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled', 'declined', 'ended', 'archived'].includes(a.status));
  const hasPast = past.length > 0;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const bookableSlots = slots.filter((s) => s.date >= todayStr);

  const dateStr = selectedDay?.dateStr || '';
  const daySlots = bookableSlots.filter((s) => s.date === dateStr);
  const dayBookings = appointments.filter((b) => b.date === dateStr);
  const slotCounselors = (() => {
    const map = new Map();
    bookableSlots.forEach((s) => map.set(String(s.counselorId), s.fullName));
    return [...map.entries()]
      .map(([id, name]) => ({ id, name: name || `Counselor #${id}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  const filteredSlots = slotCounselorFilter
    ? bookableSlots.filter((s) => String(s.counselorId) === String(slotCounselorFilter))
    : bookableSlots;

  const groupedSlots = groupSlotsByDate(filteredSlots);
  const daySlotGroups = daySlots.length ? groupSlotsByDate(daySlots)[0].counselors : [];

  const SLOTS_PER_PAGE = 3;
  const slotsTotalPages = Math.max(1, Math.ceil(groupedSlots.length / SLOTS_PER_PAGE));
  const safeSlotsPage = Math.min(slotsPage, slotsTotalPages - 1);
  const visibleGroupedSlots = groupedSlots.slice(
    safeSlotsPage * SLOTS_PER_PAGE,
    safeSlotsPage * SLOTS_PER_PAGE + SLOTS_PER_PAGE
  );

  const PAST_PER_PAGE = 3;
  const pastTotalPages = Math.max(1, Math.ceil(past.length / PAST_PER_PAGE));
  const safePastPage = Math.min(pastPage, pastTotalPages - 1);
  const visiblePast = past.slice(
    safePastPage * PAST_PER_PAGE,
    safePastPage * PAST_PER_PAGE + PAST_PER_PAGE
  );

  const handleDateClick = (cell) => { setSelectedDay(cell); setModalOpen(true); };
  const handleBook = async (slot) => {
    try {
      await axiosInstance.post('/appointments', {
        counselorId: slot.counselorId,
        type: 'Face-To-Face',
        date: slot.date,
        time: slot.time,
        concern: '',
      });
      toast.success(`Booked ${slot.time} — awaiting counselor confirmation`);
      const res = await axiosInstance.get('/appointments');
      setAppointments(res.data);
      await refreshSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book slot');
    }
  };

  const handleClearPast = async () => {
    const confirmed = await new Promise((resolve) => {
      toast(({ closeToast }) => (
        <div className="flex items-center gap-3 py-3">
          <span className="text-sm text-neutral-700">Clear all past sessions?</span>
          <button
            onClick={() => { closeToast(); resolve(true); }}
            className="px-3 py-1 text-[8px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm"
          >
            Clear
          </button>
          <button
            onClick={() => { closeToast(); resolve(false); }}
            className="px-3 py-1 text-[8px] font-semibold tracking-[0.1em] uppercase text-neutral-500 border border-neutral-300 hover:text-neutral-700 transition-colors rounded-sm"
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
      const res = await axiosInstance.get('/appointments');
      setAppointments(res.data);
      toast.success('Past sessions cleared');
    } catch {
      toast.error('Failed to clear past sessions');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <PageShell title="My Sessions" subtitle="Manage your sessions and book appointments"><PageShellSkeleton showCalendar showSidebar /></PageShell>;

  return (
    <PageShell title="My Sessions" subtitle="Manage your sessions and book appointments">
      <div className="space-y-8">

        <div>
          <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 mb-3">Calendar</h3>
          <div className="bg-white border border-neutral-200 rounded-sm p-5 max-w-lg">
            <MiniCalendar
              year={year} month={month}
              onPrev={() => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); }}
              onNext={() => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); }}
              bookings={appointments} openSlots={bookableSlots}
              onDateClick={handleDateClick}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 mb-3">Active Sessions</h3>
            {upcoming.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-sm">
                <EmptyState icon={CalendarDays} title="No active sessions" description="Request a session with your counselor to get started." />
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => <SessionCard key={s._id} session={s} type="upcoming" />)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Available Slots</h3>
              {slotCounselors.length > 0 && (
                <select
                  value={slotCounselorFilter}
                  onChange={(e) => setSlotCounselorFilter(e.target.value)}
                  className="bg-transparent border border-neutral-200 text-xs rounded-sm px-2.5 py-1.5 text-neutral-700 focus:border-neutral-900 outline-none transition-colors"
                >
                  <option value="">All Counselors</option>
                  {slotCounselors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            {groupedSlots.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-sm p-6 text-center">
                <p className="text-xs text-neutral-400">No available slots at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleGroupedSlots.map(({ date, counselors }) => {
                  const totalTimes = counselors.reduce((n, c) => n + c.times.length, 0);
                  return (
                    <div key={date} className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center gap-2">
                        <CalendarDays size={13} className="text-neutral-400 shrink-0" />
                        <span className="text-xs font-medium text-neutral-900">{formatLongDate(date)}</span>
                        <span className="text-[10px] text-neutral-400 ml-auto">{totalTimes} slot{totalTimes !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {counselors.map((c) => (
                          <div key={c.counselorId} className="px-4 py-3">
                            <p className="text-xs font-medium text-neutral-700 mb-2">{c.fullName || `Counselor #${c.counselorId}`}</p>
                            <div className="flex flex-wrap gap-2">
                              {c.times.map(({ time, slot }) => (
                                <button
                                  key={slot._id}
                                  onClick={() => handleBook(slot)}
                                  className="px-3 py-1.5 text-xs rounded-sm border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Pagination page={safeSlotsPage} totalPages={slotsTotalPages} onChange={setSlotsPage} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-4">
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
            <div className="bg-white border border-neutral-200 rounded-sm">
              <EmptyState icon={Clock} title="No past sessions" description="Your session history will appear here after your first appointment." />
            </div>
          ) : (
            <div className="space-y-2">
              {visiblePast.map((s) => <SessionCard key={s._id} session={s} type="past" />)}
              <Pagination page={safePastPage} totalPages={pastTotalPages} onChange={setPastPage} />
            </div>
          )}
        </div>

      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedDay ? `Schedule — ${dateStr}` : ''}>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
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
            <div className="space-y-3">
              {daySlotGroups.map((c) => (
                <div key={c.counselorId}>
                  <p className="text-xs font-medium text-neutral-700 mb-1.5">{c.fullName || `Counselor #${c.counselorId}`}</p>
                  <div className="flex flex-wrap gap-2">
                    {c.times.map(({ time, slot }) => (
                      <button
                        key={slot._id}
                        onClick={() => { handleBook(slot); setModalOpen(false); }}
                        className="px-3 py-1.5 text-xs rounded-sm border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
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
          <p className="text-sm text-neutral-400 py-4 text-center">No slots or bookings for this day.</p>
        ) : null}
        </div>
      </Modal>
    </PageShell>
  );
};

export default SessionsPage;
