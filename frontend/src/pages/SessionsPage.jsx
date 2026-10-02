import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, Clock, MessageCircle, ArrowUpRight, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarDays, CheckCircle, Trash2, Loader } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { toast } from 'react-toastify';
import { confirmAction } from '../lib/confirm';
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

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="size-7 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs text-ink-muted">{page + 1} / {totalPages}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="size-7 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
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
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${session.type === 'Chat' ? 'bg-brand-soft text-brand-soft-ink' : 'bg-line text-ink-muted'
            }`}>
            {session.type === 'Chat' ? <MessageCircle size={18} /> : <CalendarCheck size={18} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-0.5">
              <h3 className="text-sm font-medium text-ink">{counselorLabel}</h3>
              <StatusBadge
                status={session.type === 'Face-To-Face' && (session.status === 'active' || session.status === 'confirmed') ? 'Approved' : session.status}
              />
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
  const location = useLocation();
  const requestedSessionModal = location.state?.openSessionModal;
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

  const chatPollRef = useRef(null);

  // ─── Request Chat Session state ───
  const [chatRequestOpen, setChatRequestOpen] = useState(requestedSessionModal === 'chat');
  const [chatConcern, setChatConcern] = useState('');
  const [chatCounselors, setChatCounselors] = useState([]);
  const [chatCounselorId, setChatCounselorId] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [chatLoadingCounselors, setChatLoadingCounselors] = useState(Boolean(requestedSessionModal));
  const [pendingChatRequest, setPendingChatRequest] = useState(null);
  const [busyChatRequest, setBusyChatRequest] = useState(null);

  // ─── Book Face-To-Face state ───
  const [f2fOpen, setF2fOpen] = useState(requestedSessionModal === 'face-to-face');
  const [f2fCounselorId, setF2fCounselorId] = useState('');
  const [f2fAllSlots, setF2fAllSlots] = useState([]);
  const [f2fDate, setF2fDate] = useState('');
  const [f2fTime, setF2fTime] = useState('');
  const [f2fConcern, setF2fConcern] = useState('');
  const [f2fSubmitting, setF2fSubmitting] = useState(false);
  const [f2fLoadingSlots, setF2fLoadingSlots] = useState(false);

  useEffect(() => {
    if (!requestedSessionModal) return;

    axiosInstance.get('/message/users')
      .then((res) => setChatCounselors(res.data.filter((user) => user.userType?.toLowerCase() !== 'administrator')))
      .catch(() => toast.error('Failed to load counselors.'))
      .finally(() => setChatLoadingCounselors(false));

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, navigate, requestedSessionModal]);

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
      await refreshAppointments();
      await refreshSlots();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book slot');
    }
  };

  const handleClearPast = async () => {
    const confirmed = await confirmAction({
      title: 'Clear all past sessions?',
      confirmLabel: 'Clear',
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
    if (!f2fCounselorId || !f2fDate || !f2fTime) {
      toast.error('Please select counselor, date, and time.');
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
      actions={
        <>
          <button
            onClick={handleOpenF2f}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
          >
            <CalendarCheck size={13} />
            Book Face-To-Face
          </button>
          <button
            onClick={handleOpenChatRequest}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-ink border border-line-strong hover:border-brand-600 hover:text-brand-fg transition-colors rounded-lg"
          >
            <MessageCircle size={13} />
            Request Chat Session
          </button>
        </>
      }
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
                bookings={appointments} openSlots={bookableSlots}
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

          <div className="lg:col-span-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-semibold text-ink-muted">Available Slots</h3>
              {slotCounselors.length > 0 && (
                <select
                  value={slotCounselorFilter}
                  onChange={(e) => setSlotCounselorFilter(e.target.value)}
                  className="bg-transparent border border-line text-xs rounded-lg px-2.5 py-1.5 text-ink-soft focus:border-brand-600 outline-none transition-colors"
                >
                  <option value="">All Counselors</option>
                  {slotCounselors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            {groupedSlots.length === 0 ? (
              <div className="bg-surface border border-line rounded-lg p-6 text-center">
                <p className="text-xs text-ink-muted">No available slots at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleGroupedSlots.map(({ date, counselors }) => {
                    const totalTimes = counselors.reduce((n, c) => n + c.times.length, 0);
                    return (
                      <div
                        key={date}
                        className="overflow-hidden rounded-lg border border-line bg-surface"
                      >
                        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                          <CalendarDays size={13} className="shrink-0 text-ink-muted" />
                          <span className="text-xs font-medium text-ink">{formatLongDate(date)}</span>
                          <span className="ml-auto text-xs text-ink-muted">{totalTimes} slot{totalTimes !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="divide-y divide-line">
                          {counselors.map((c) => (
                            <div key={c.counselorId} className="px-4 py-3">
                              <p className="mb-2 text-xs font-medium text-ink-soft">{c.fullName || `Counselor #${c.counselorId}`}</p>
                              <div className="flex flex-wrap gap-2">
                                {c.times.map(({ time, slot }) => (
                                  <button
                                    key={slot._id}
                                    onClick={() => handleBook(slot)}
                                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-brand-600 hover:bg-brand-600 hover:text-brand-fg"
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

        <div className="bg-surface border border-line rounded-lg p-5">
          <div className="flex items-center gap-4 mb-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-semibold text-ink-muted shrink-0">Past Sessions</span>
            {hasPast && (
              <button
                onClick={handleClearPast}
                disabled={archiving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-danger-ink hover:text-danger-ink transition-colors rounded-lg disabled:opacity-50"
              >
                {archiving ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Clear All
              </button>
            )}
            <span className="h-px flex-1 bg-line" />
          </div>
          {past.length === 0 ? (
            <EmptyState icon={Clock} title="No past sessions" description="Your session history will appear here after your first appointment." />
          ) : (
            <div className="space-y-2">
              {visiblePast.map((s) => <SessionCard key={s._id} session={s} type="past" />)}
              <Pagination page={safePastPage} totalPages={pastTotalPages} onChange={setPastPage} />
            </div>
          )}
        </div>

      </div>

      <Modal isOpen={chatRequestOpen} onClose={handleCloseChatRequest} title="Request Chat Session">
        <form onSubmit={(e) => { e.preventDefault(); handleRequestChat(); }} className="space-y-4">
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
                  <option key={c._id} value={c._id}>{c.fullName} · {c.status || 'Available'}</option>
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
              onClick={handleCloseChatRequest}
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

      <Modal
        isOpen={Boolean(busyChatRequest)}
        onClose={() => setBusyChatRequest(null)}
        title="Counselor is Busy"
        description="This counselor is currently in a face-to-face session."
      >
        <p className="text-sm text-ink mb-5">Wait for counselor or book another counselor?</p>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleBookAnotherCounselor}
            disabled={chatSubmitting}
            className="px-4 py-2 text-xs font-semibold text-ink border border-line rounded-lg hover:border-line-strong disabled:opacity-50"
          >
            Book Another Counselor
          </button>
          <button
            type="button"
            onClick={handleWaitForCounselor}
            disabled={chatSubmitting}
            className="px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {chatSubmitting ? 'Requesting...' : 'Wait for Counselor'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={f2fOpen} onClose={handleCloseF2f} title="Book Face-to-Face Session">
        <form onSubmit={(e) => { e.preventDefault(); handleBookF2f(); }} className="space-y-4">
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
            <label className="text-xs font-semibold text-ink-muted">Concern (optional)</label>
            <textarea
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
              onClick={handleCloseF2f}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedDay ? `Schedule — ${dateStr}` : ''}>
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
                        onClick={() => { handleBook(slot); setModalOpen(false); }}
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
    </PageShell>
  );
};

export default SessionsPage;
