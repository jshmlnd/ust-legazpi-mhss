import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, Clock, MessageCircle, ArrowUpRight, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarDays, Loader } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';
import ChatRequestModal from '../components/modals/ChatRequestModal';
import BusyCounselorModal from '../components/modals/BusyCounselorModal';
import FaceToFaceModal from '../components/modals/FaceToFaceModal';
import ScheduleDayModal from '../components/modals/ScheduleDayModal';
import { toast } from 'react-toastify';
import { PATHS } from '../lib/routes';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay = (year, month) => new Date(year, month, 1).getDay();
const formatLocalDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatLongDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
};

const timeSortValue = (time) => {
  const value = Date.parse(`1970-01-01 ${time}`);
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
};

const groupSlotsByDate = (slots) => {
  const byDate = {};
  slots
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || timeSortValue(a.time) - timeSortValue(b.time))
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
        <button onClick={onPrev} className="size-7 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium text-ink">{monthLabel}</span>
        <button onClick={onNext} className="size-7 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink transition-colors">
          <ChevronRightIcon size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-line rounded-lg overflow-hidden">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="bg-canvas px-2 py-1.5 text-xs font-semibold text-ink-muted text-center">{wd}</div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} className="bg-surface min-h-[56px]" />;
          return (
            <button
              key={cell.dateStr}
              onClick={() => onDateClick(cell)}
              className={`bg-surface min-h-[56px] p-1.5 text-left transition-colors hover:bg-canvas ${cell.isToday ? 'ring-1 ring-inset ring-brand-600' : ''
                }`}
            >
              <span className={`text-xs font-medium ${cell.isToday ? 'bg-brand-600 text-brand-fg size-4 inline-flex items-center justify-center rounded-full' : 'text-ink-muted'
                }`}>
                {cell.day}
              </span>
              {cell.bookings.length > 0 && <div className="mt-0.5"><span className="block size-1.5 rounded-full bg-brand-600 mx-auto" /></div>}
              {cell.slots.length > 0 && !cell.bookings.length && <div className="mt-0.5"><span className="block size-1.5 rounded-full bg-brand-400 mx-auto" /></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const getSessionOutcome = (session) => {
  if (session.actionTaken === 'gca') return { label: 'Admitted', tone: 'success' };
  if (session.actionTaken === 'referred') {
    const counselor = session.counselorName || session.counselor?.fullName || 'counselor';
    return { label: `Referred to ${counselor}`, tone: 'info' };
  }
  if (session.actionTaken === 'adjunct') return { label: 'Adjunct', tone: 'warning' };
  if (['confirmed', 'active', 'on-going', 'paused', 'completed', 'ended'].includes(session.status)) {
    return { label: 'Admitted', tone: 'success' };
  }
  return null;
};

const SessionCard = ({ session, type }) => {
  const isUpcoming = type === 'upcoming';
  const counselorLabel = session.counselorName || session.counselor?.fullName || `Counselor #${session.counselorId}`;
  const outcome = getSessionOutcome(session);
  const statusLabel = session.type === 'Face-To-Face' && (session.status === 'active' || session.status === 'confirmed')
    ? 'Approved'
    : session.status;
  const showStatus = !['approved', 'declined', 'completed'].includes(String(statusLabel).toLowerCase());

  return (
    <div className={`${isUpcoming
      ? 'rounded-xl border border-line bg-surface p-5'
      : 'rounded-none border-0 bg-surface p-3.5 transition-colors hover:bg-canvas/60 sm:p-4'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`${isUpcoming ? 'size-10' : 'size-9'} rounded-full flex items-center justify-center shrink-0 ${session.type === 'Chat' ? 'bg-brand-soft text-brand-soft-ink' : 'bg-line text-ink-muted'
            }`}>
            {session.type === 'Chat' ? <MessageCircle size={isUpcoming ? 18 : 16} /> : <CalendarCheck size={isUpcoming ? 18 : 16} />}
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 flex flex-wrap items-center gap-2.5 gap-y-1">
              <h3 className="text-sm font-medium text-ink">{counselorLabel}</h3>
              {showStatus && <StatusBadge status={statusLabel} />}
              {outcome && <StatusBadge tone={outcome.tone}>{outcome.label}</StatusBadge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mt-1">
              <span className="inline-flex items-center gap-1"><Calendar size={11} /> {session.date}</span>
              <span className="inline-flex items-center gap-1"><Clock size={11} /> {session.time}</span>
              <span>{session.duration}</span>
              <span className="text-xs font-medium">{session.type === 'Chat' ? 'Chat' : 'Face-to-Face'}</span>
            </div>
            {!isUpcoming && session.notes && (
              <p className="text-xs text-ink-muted mt-2 italic">&ldquo;{session.notes}&rdquo;</p>
            )}
          </div>
        </div>

        {isUpcoming && session.type === 'Chat' && (
          <Link
            to={PATHS.MESSAGES}
            aria-label={`Open chat with ${counselorLabel}`}
            title={`Open chat with ${counselorLabel}`}
            className="shrink-0 size-9 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors"
          >
            <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
};

const SessionsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsPage, setSlotsPage] = useState(0);
  const [slotCounselorFilter, setSlotCounselorFilter] = useState('');

  const chatPollRef = useRef(null);

  // ─── Request Chat Session state ───
  const [chatRequestOpen, setChatRequestOpen] = useState(false);
  const [chatConcern, setChatConcern] = useState('');
  const [chatCounselors, setChatCounselors] = useState([]);
  const [chatCounselorId, setChatCounselorId] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [chatLoadingCounselors, setChatLoadingCounselors] = useState(false);
  const [pendingChatRequest, setPendingChatRequest] = useState(null);
  const [busyChatRequest, setBusyChatRequest] = useState(null);

  // ─── Book Face-To-Face state ───
  const [f2fOpen, setF2fOpen] = useState(false);
  const [f2fCounselorId, setF2fCounselorId] = useState('');
  const [f2fAllSlots, setF2fAllSlots] = useState([]);
  const [f2fDate, setF2fDate] = useState('');
  const [f2fTime, setF2fTime] = useState('');
  const [f2fConcern, setF2fConcern] = useState('');
  const [f2fSubmitting, setF2fSubmitting] = useState(false);
  const [f2fLoadingSlots, setF2fLoadingSlots] = useState(false);

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

  const refreshAppointments = async () => {
    try {
      const res = await axiosInstance.get('/appointments');
      setAppointments(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to refresh appointments:', err);
      return [];
    }
  };

  const refreshSlots = async () => {
    try {
      const slotRes = await axiosInstance.get('/availability');
      setSlots(slotRes.data.filter((s) => s.isAvailable !== false));
    } catch (err) {
      console.error('Failed to refresh slots:', err);
    }
  };

  const visibleAppointments = appointments.filter((a) => ['pending', 'active'].includes(a.status));
  const upcoming = visibleAppointments;
  const pastSessions = appointments.filter((a) => ['completed', 'ended', 'declined', 'cancelled', 'archived'].includes(a.status));

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const bookableSlots = slots.filter((s) => s.date >= todayStr);

  const dateStr = selectedDay?.dateStr || '';
  const daySlots = bookableSlots.filter((s) => s.date === dateStr);
  const dayBookings = visibleAppointments.filter((b) => b.date === dateStr);
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
      await refreshAppointments();
      await refreshSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book slot');
    }
  };

  // ─── Request Chat Session ───

  const openChatCounselors = async () => {
    setChatLoadingCounselors(true);
    try {
      const res = await axiosInstance.get('/message/users');
      setChatCounselors(res.data.filter((u) => u.userType?.toLowerCase() !== 'administrator'));
    } catch {
      toast.error('Failed to load counselors.');
    } finally {
      setChatLoadingCounselors(false);
    }
  };

  const handleOpenChatRequest = () => {
    setChatConcern('');
    setChatCounselorId('');
    setChatRequestOpen(true);
    openChatCounselors();
  };

  const handleCloseChatRequest = () => {
    setChatRequestOpen(false);
    setChatConcern('');
    setChatCounselorId('');
  };

  const finishChatRequest = (appointment) => {
    toast.success('Chat session requested! \n Waiting for counselor to accept...');
    handleCloseChatRequest();
    setBusyChatRequest(null);
    setPendingChatRequest(appointment);
    refreshAppointments();
  };

  const handleRequestChat = async () => {
    if (!chatConcern.trim()) {
      toast.error('Please describe your concern briefly.');
      return;
    }
    if (!chatCounselorId) {
      toast.error('Please select a counselor.');
      return;
    }
    const request = {
      counselorId: Number(chatCounselorId),
      type: 'Chat',
      date: formatLocalDate(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      concern: chatConcern.trim(),
    };
    setChatSubmitting(true);
    try {
      const res = await axiosInstance.post('/appointments', request);
      finishChatRequest(res.data);
    } catch (err) {
      if (err.response?.data?.code === 'COUNSELOR_BUSY') {
        setChatRequestOpen(false);
        setBusyChatRequest(request);
      } else {
        toast.error(err.response?.data?.error || 'Failed to request Chat session.');
      }
    } finally {
      setChatSubmitting(false);
    }
  };

  const handleWaitForCounselor = async () => {
    setChatSubmitting(true);
    try {
      const res = await axiosInstance.post('/appointments', { ...busyChatRequest, waitIfBusy: true });
      finishChatRequest(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to request Chat session.');
    } finally {
      setChatSubmitting(false);
    }
  };

  const handleBookAnotherCounselor = () => {
    setChatConcern(busyChatRequest.concern);
    setChatCounselorId('');
    setBusyChatRequest(null);
    setChatRequestOpen(true);
  };

  const handleCancelChatRequest = async () => {
    try {
      await axiosInstance.patch(`/appointments/${pendingChatRequest._id}`, { status: 'cancelled' });
      toast.success('Request cancelled.');
    } catch {
      toast.error('Failed to cancel.');
    }
    setPendingChatRequest(null);
  };

  useEffect(() => {
    if (!pendingChatRequest) return;
    chatPollRef.current = setInterval(async () => {
      try {
        const res = await axiosInstance.get('/appointments');
        const updated = res.data.find((a) => a._id === pendingChatRequest._id);
        if (!updated || updated.status === 'declined' || updated.status === 'cancelled') {
          setPendingChatRequest(null);
          toast.error('Chat request was declined.');
          clearInterval(chatPollRef.current);
        } else if (updated.status === 'active') {
          setPendingChatRequest(null);
          clearInterval(chatPollRef.current);
          navigate(PATHS.MESSAGES);
        }
      } catch {
        clearInterval(chatPollRef.current);
      }
    }, 3000);
    return () => clearInterval(chatPollRef.current);
  }, [pendingChatRequest, navigate]);

  // ─── Book Face-To-Face ───

  const f2fAvailableDates = useMemo(() => {
    const counts = {};
    f2fAllSlots
      .filter((s) => s.isAvailable)
      .forEach((s) => { counts[s.date] = (counts[s.date] || 0) + 1; });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [f2fAllSlots]);

  const f2fAvailableTimes = useMemo(
    () => f2fAllSlots
      .filter((s) => s.isAvailable && s.date === f2fDate)
      .map((s) => s.time)
      .sort(),
    [f2fAllSlots, f2fDate]
  );

  const handleOpenF2f = () => {
    setF2fCounselorId('');
    setF2fDate('');
    setF2fTime('');
    setF2fConcern('');
    setF2fAllSlots([]);
    setF2fOpen(true);
    openChatCounselors();
  };

  const handleCloseF2f = () => {
    setF2fOpen(false);
    setF2fConcern('');
    setF2fAllSlots([]);
    setF2fDate('');
    setF2fTime('');
  };

  const handleF2fCounselorChange = async (counselorId) => {
    setF2fCounselorId(counselorId);
    setF2fDate('');
    setF2fTime('');
    setF2fAllSlots([]);
    if (!counselorId) return;
    setF2fLoadingSlots(true);
    try {
      const slotRes = await axiosInstance.get(`/availability/${counselorId}`);
      setF2fAllSlots(slotRes.data);
    } catch {
      setF2fAllSlots([]);
    } finally {
      setF2fLoadingSlots(false);
    }
  };

  const handleBookF2f = async () => {
    if (!f2fCounselorId || !f2fDate || !f2fTime || !f2fConcern.trim()) {
      toast.error('Please select counselor, date, time, and describe your concern.');
      return;
    }
    setF2fSubmitting(true);
    try {
      await axiosInstance.post('/appointments', {
        counselorId: Number(f2fCounselorId),
        type: 'Face-To-Face',
        date: f2fDate,
        time: f2fTime,
        concern: f2fConcern.trim(),
      });
      toast.success('Face-to-face session booked! Awaiting counselor confirmation.');
      handleCloseF2f();
      await refreshAppointments();
      await refreshSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book session.');
    } finally {
      setF2fSubmitting(false);
    }
  };

  if (loading) return <PageShell title="My Sessions" description="Manage your sessions and book appointments"><PageShellSkeleton showCalendar showSidebar /></PageShell>;

  return (
    <PageShell
      title="My Sessions"
      description="Manage your sessions and book appointments"
    >
      <div className="space-y-8">

        {pendingChatRequest && (
          <div className="flex items-center justify-between gap-4 bg-surface border border-line rounded-lg p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-soft0/60 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-warning-soft0" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">Chat session requested</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {pendingChatRequest.concern || 'Waiting for your counselor to accept the session.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <Loader size={12} className="animate-spin" />
                Checking for updates...
              </span>
              <button
                onClick={handleCancelChatRequest}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted border border-line-strong hover:text-danger-ink hover:border-danger/30 transition-colors rounded-lg"
              >
                Cancel Request
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold text-ink-muted mb-3">Calendar</h3>
            <div className="bg-surface border border-line rounded-lg p-5">
              <MiniCalendar
                year={year} month={month}
                onPrev={() => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); }}
                onNext={() => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); }}
                bookings={visibleAppointments} openSlots={bookableSlots}
                onDateClick={handleDateClick}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold text-ink-muted mb-3">Active Sessions</h3>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No active sessions" description="Request a session with your counselor to get started." />
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => <SessionCard key={s._id} session={s} type="upcoming" />)}
              </div>
            )}
          </div>
        </div>

        {pastSessions.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-line bg-surface" aria-label="Past sessions">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">History</p>
                <h3 className="mt-1 text-sm font-semibold text-ink">Past Sessions</h3>
                <p className="mt-1 text-xs text-ink-muted">Review your previous counseling sessions.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPast((visible) => !visible)}
                className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:border-brand-300 hover:bg-brand-soft"
              >
                {showPast ? 'Hide past sessions' : `View past sessions (${pastSessions.length})`}
              </button>
            </div>
            {showPast && (
              <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-line divide-y divide-line sm:mx-5 sm:mb-5">
                {pastSessions.map((session) => (
                  <SessionCard key={session._id} session={session} type="past" />
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      <ChatRequestModal
        isOpen={chatRequestOpen}
        onClose={handleCloseChatRequest}
        chatLoadingCounselors={chatLoadingCounselors}
        chatCounselorId={chatCounselorId}
        setChatCounselorId={setChatCounselorId}
        chatCounselors={chatCounselors}
        chatConcern={chatConcern}
        setChatConcern={setChatConcern}
        chatSubmitting={chatSubmitting}
        onSubmit={handleRequestChat}
      />

      <BusyCounselorModal
        isOpen={Boolean(busyChatRequest)}
        onClose={() => setBusyChatRequest(null)}
        chatSubmitting={chatSubmitting}
        onBookAnotherCounselor={handleBookAnotherCounselor}
        onWaitForCounselor={handleWaitForCounselor}
      />

      <FaceToFaceModal
        isOpen={f2fOpen}
        onClose={handleCloseF2f}
        chatLoadingCounselors={chatLoadingCounselors}
        chatCounselors={chatCounselors}
        f2fCounselorId={f2fCounselorId}
        handleF2fCounselorChange={handleF2fCounselorChange}
        f2fLoadingSlots={f2fLoadingSlots}
        f2fAvailableDates={f2fAvailableDates}
        f2fDate={f2fDate}
        setF2fDate={setF2fDate}
        setF2fTime={setF2fTime}
        f2fAvailableTimes={f2fAvailableTimes}
        f2fTime={f2fTime}
        f2fConcern={f2fConcern}
        setF2fConcern={setF2fConcern}
        f2fSubmitting={f2fSubmitting}
        onSubmit={handleBookF2f}
      />

      <ScheduleDayModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDay={selectedDay}
        dateStr={dateStr}
        dayBookings={dayBookings}
        daySlots={daySlots}
        daySlotGroups={daySlotGroups}
        onBook={handleBook}
        setModalOpen={setModalOpen}
      />
    </PageShell>
  );
};

export default SessionsPage;
