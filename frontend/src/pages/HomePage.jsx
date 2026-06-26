import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, CalendarDays, Clock, User, MoveRight } from 'lucide-react';
import { axiosInstance } from "../lib/axios";
import { getSocket } from "../lib/socket";
import { PATHS } from '../lib/routes';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const ALL_TIMES = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
];

const ANNOUNCEMENT = {
  tag: "NOTICE",
  text: "Counseling services are available for walk-in appointments every Monday and Thursday, 8:00 AM – 4:00 PM at the Office of Guidance and Testing.",
  linkHref: "/university-updates",
  linkLabel: "Read latest updates",
};

const SUGGESTIONS = {
  linkHref: "/suggestions",
  linkLabel: "Suggestions"
}

const QUICK_ACTIONS = [
  {
    title: "Active Chat Session",
    description: "You have an ongoing conversation with your counselor.",
    meta: "Last message: 2 hours ago",
    status: "active",
    href: PATHS.MESSAGES,
    cta: "Open Chat",
  },
  {
    title: "Scheduled Face-To-Face Session",
    description: "Your next on-campus appointment.",
    metaLines: ["Date: Thursday, July 10, 2026", "Time: 10:00 AM – 11:00 AM", "Location: Student Welfare Office, Room 204"],
    href: PATHS.SESSIONS,
    cta: "View Details",
  },
  {
    title: "Your Diary",
    description: "A private space for your thoughts and reflections.",
    meta: "Last entry: 3 days ago",
    href: PATHS.DIARY,
    cta: "Write Entry",
  },
];

const SERVICE_CARDS = [
  {
    number: "01",
    title: "Mental Health Support",
    description:
      "Confidential one-on-one counseling sessions with licensed professionals. Explore coping strategies, manage stress, and prioritize your well-being in a safe, supportive environment.",
  },
  {
    number: "02",
    title: "Career Guidance",
    description:
      "Navigate your academic and professional journey with personalized career counseling, aptitude assessments, and planning resources tailored to your goals.",
  },
  {
    number: "03",
    title: "Crisis Intervention",
    description:
      "Immediate support for students experiencing emotional distress or crisis. Our team is trained to provide compassionate, urgent care and connect you to the right resources.",
  },
];

const HomePage = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [diaryHover, setDiaryHover] = useState(false);

  const firstName = authUser?.fullName?.split(" ")[0] ?? "Student";
  const genid = authUser?._id;
  const [hasActiveChat, setHasActiveChat] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [loadingCounselors, setLoadingCounselors] = useState(false);
  const pollRef = useRef(null);

  const [upcomingF2f, setUpcomingF2f] = useState(null);
  const [declinedF2f, setDeclinedF2f] = useState(null);
  const [counselorMap, setCounselorMap] = useState({});
  const [f2fOpen, setF2fOpen] = useState(false);
  const [f2fCounselors, setF2fCounselors] = useState([]);
  const [f2fCounselorId, setF2fCounselorId] = useState('');
  const [f2fDate, setF2fDate] = useState('');
  const [f2fTime, setF2fTime] = useState('');
  const [f2fConcern, setF2fConcern] = useState('');
  const [f2fAllSlots, setF2fAllSlots] = useState([]);
  const [f2fAvailableTimes, setF2fAvailableTimes] = useState([]);
  const [f2fLoadingSlots, setF2fLoadingSlots] = useState(false);
  const [f2fSubmitting, setF2fSubmitting] = useState(false);

  const fetchActiveChat = async () => {
    try {
      const [appRes, usersRes] = await Promise.all([
        axiosInstance.get("/appointments"),
        axiosInstance.get("/message/users"),
      ]);
      const active = appRes.data.find(
        (a) => a.type === "chat" && a.status === "active"
      );
      setHasActiveChat(!!active);
      const pending = appRes.data.find(
        (a) => a.type === "chat" && a.status === "pending"
      );
      if (pending) setPendingRequest(pending);
      const f2f = appRes.data.find(
        (a) => a.type === "f2f" && ["pending", "confirmed", "active"].includes(a.status)
      );
      setUpcomingF2f(f2f || null);
      const declined = appRes.data.find(
        (a) => a.type === "f2f" && a.status === "declined"
      );
      setDeclinedF2f(declined || null);
      const map = {};
      usersRes.data.forEach((c) => { map[c._id] = c.fullName; });
      setCounselorMap(map);
    } catch (err) {
      console.error("Failed to check active chat:", err);
    }
  };

  useEffect(() => { fetchActiveChat(); }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => fetchActiveChat();
    socket.on("appointment:updated", handler);
    return () => socket.off("appointment:updated", handler);
  }, []);

  useEffect(() => {
    if (!pendingRequest) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/appointments`);
        const updated = res.data.find((a) => a._id === pendingRequest._id);
        if (!updated || updated.status === "declined" || updated.status === "cancelled") {
          setPendingRequest(null);
          toast.error("Chat request was declined.");
          clearInterval(pollRef.current);
        } else if (updated.status === "active") {
          setPendingRequest(null);
          clearInterval(pollRef.current);
          navigate(PATHS.MESSAGES);
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [pendingRequest, navigate]);

  const handleOpenRequest = async () => {
    setRequestOpen(true);
    setConcern("");
    setSelectedCounselor("");
    setLoadingCounselors(true);
    try {
      const res = await axiosInstance.get("/message/users");
      setCounselors(res.data);
    } catch {
      toast.error("Failed to load counselors.");
    } finally {
      setLoadingCounselors(false);
    }
  };

  const handleRequestChat = async () => {
    if (!concern.trim()) {
      toast.error("Please describe your concern briefly.");
      return;
    }
    if (!selectedCounselor) {
      toast.error("Please select a counselor.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/appointments", {
        counselorId: Number(selectedCounselor),
        type: "chat",
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
        concern: concern.trim(),
      });
      toast.success("Chat session requested! \n Waiting for counselor to accept...");
      setRequestOpen(false);
      setConcern("");
      setSelectedCounselor("");
      setPendingRequest(res.data);
    } catch (err) {
      toast.error("Failed to request chat session.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenF2f = async () => {
    setF2fOpen(true);
    setF2fCounselorId('');
    setF2fDate('');
    setF2fTime('');
    setF2fConcern('');
    setF2fAllSlots([]);
    setF2fAvailableTimes([]);
    try {
      const res = await axiosInstance.get("/message/users");
      setF2fCounselors(res.data);
    } catch { toast.error("Failed to load counselors."); }
  };

  const handleF2fCounselorChange = async (counselorId) => {
    setF2fCounselorId(counselorId);
    setF2fDate('');
    setF2fTime('');
    setF2fAvailableTimes([]);
    if (!counselorId) return;
    setF2fLoadingSlots(true);
    try {
      const slotRes = await axiosInstance.get(`/availability/${counselorId}`);
      setF2fAllSlots(slotRes.data);
    } catch { setF2fAllSlots([]); }
    finally { setF2fLoadingSlots(false); }
  };

  const handleF2fDateChange = (dateStr) => {
    setF2fDate(dateStr);
    setF2fTime('');
    if (!dateStr) { setF2fAvailableTimes([]); return; }
    const times = f2fAllSlots
      .filter((s) => s.date === dateStr && s.isAvailable)
      .map((s) => s.time)
      .sort();
    setF2fAvailableTimes(times);
  };

  const handleBookF2f = async () => {
    if (!f2fCounselorId || !f2fDate || !f2fTime) {
      toast.error("Please select counselor, date, and time.");
      return;
    }
    setF2fSubmitting(true);
    try {
      await axiosInstance.post("/appointments", {
        counselorId: Number(f2fCounselorId),
        type: "f2f",
        date: f2fDate,
        time: f2fTime,
        concern: f2fConcern.trim(),
      });
      toast.success("Face-to-face session booked! Awaiting counselor confirmation.");
      setF2fOpen(false);
      fetchActiveChat();
    } catch { toast.error("Failed to book session."); }
    finally { setF2fSubmitting(false); }
  };

  return (
    <main className="min-h-screen bg-white pt-[calc(68px+3rem)] pb-28 px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">

        {/* ──────── SECTION 1: HERO ──────── */}
        <section className="mb-24 bg-base">
          <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.1] tracking-[-0.03em] text-neutral-900">
            Good {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},{` `}
            <span className="font-medium">{firstName}</span><br />
            <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-white bg-neutral-900 rounded-sm">Static ID: STU-{genid}</span>
            <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">Note: counselor can only see your static id</span>
          </h1>
          <p className="mt-5 max-w-[580px] text-base leading-[1.7] text-neutral-500 tracking-[-0.01em]">
            Welcome to the UST-Legazpi Mental Health Support System. Your well-being is our priority — access counseling
            services, schedule appointments, and explore resources designed to support you.
          </p>

          <Link
            to={SUGGESTIONS.linkHref}
            className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.05em] uppercase text-neutral-900 border-b border-neutral-900/30 hover:border-neutral-900 transition-colors"
          >
            {SUGGESTIONS.linkLabel}
            <span className="text-sm leading-none"><MoveRight className="size-3" /></span>
          </Link>
          {/* Announcement Card */}
          <div className="mt-10 flex items-start gap-4 border-l-2 border-neutral-900 pl-5 py-4 bg-neutral-50 rounded-r-sm">
            <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-white bg-neutral-900 rounded-sm">
              {ANNOUNCEMENT.tag}
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-[1.6] text-neutral-700">{ANNOUNCEMENT.text}</p>
              <Link
                to={ANNOUNCEMENT.linkHref}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.05em] uppercase text-neutral-900 border-b border-neutral-900/30 hover:border-neutral-900 transition-colors"
              >
                {ANNOUNCEMENT.linkLabel}
                <span className="text-sm leading-none"><MoveRight className="size-4" /></span>
              </Link>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 2: QUICK ACTIONS ──────── */}
        <section className="mb-24">
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">Quick Actions</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 overflow-hidden rounded-sm">
            {/* Card 1 — Active Chat / Pending Request / Request */}
            <div className={`group relative bg-white p-8 transition-all duration-300 ${hasActiveChat || pendingRequest ? 'hover:bg-neutral-50' : ''}`}>
              {pendingRequest ? (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-amber-700">
                      Waiting for Acceptance
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 mb-2">
                    Chat Session Requested
                  </h3>
                  <p className="text-xs leading-[1.6] text-neutral-500 mb-4">
                    Your request has been sent. Waiting for your counselor to accept the session.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-6">
                    <Loader size={12} className="animate-spin" />
                    Checking for updates...
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await axiosInstance.patch(`/appointments/${pendingRequest._id}`, { status: "cancelled" });
                        toast.success("Request cancelled.");
                      } catch { toast.error("Failed to cancel."); }
                      setPendingRequest(null);
                    }}
                    className="inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase text-neutral-500 border border-neutral-300 hover:text-red-600 hover:border-red-300 transition-colors rounded-sm"
                  >
                    Cancel Request
                  </button>
                </>
              ) : hasActiveChat ? (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/60 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-green-700">Active</span>
                  </div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 mb-2">
                    {QUICK_ACTIONS[0].title}
                  </h3>
                  <p className="text-xs leading-[1.6] text-neutral-500 mb-4">{QUICK_ACTIONS[0].description}</p>
                  <p className="text-[11px] text-neutral-400 mb-6">{QUICK_ACTIONS[0].meta}</p>
                  <Link
                    to={QUICK_ACTIONS[0].href}
                    className="inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                  >
                    {QUICK_ACTIONS[0].cta}
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="relative flex size-2.5 grayscale">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/60 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-300">No Active Chat</span>
                  </div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-300 mb-2">
                    {QUICK_ACTIONS[0].title}
                  </h3>
                  <p className="text-xs leading-[1.6] text-neutral-300 mb-4">No ongoing conversation at the moment.</p>
                  <p className="text-[11px] text-neutral-200 mb-6">Start a session with your counselor.</p>
                  <button
                    onClick={handleOpenRequest}
                    className="inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                  >
                    Request Chat Session
                  </button>
                </>
              )}
            </div>

            {/* Card 2 — Scheduled Session / Declined / Book F2F */}
            <div className="group relative bg-white p-8 transition-all duration-300 hover:bg-neutral-50">
              {upcomingF2f ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">
                      Upcoming
                    </span>
                    <span className={`text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded-sm border ${upcomingF2f.status === 'active' || upcomingF2f.status === 'confirmed' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                        'text-amber-600 border-amber-200 bg-amber-50'
                      }`}>
                      {upcomingF2f.status === 'active' || upcomingF2f.status === 'confirmed' ? 'Approved' : 'Awaiting'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 mb-2">
                    Face-To-Face Session
                  </h3>
                  <p className="text-xs leading-[1.6] text-neutral-500 mb-4">
                    {upcomingF2f.concern || 'No concern specified.'}
                  </p>
                  <div className="mb-6 space-y-1 border-t border-neutral-100 pt-3">
                    <p className="text-[11px] leading-[1.7] text-neutral-600 font-medium">
                      <CalendarDays size={12} className="inline mr-1.5 -mt-0.5" />
                      {upcomingF2f.date}
                    </p>
                    <p className="text-[11px] leading-[1.7] text-neutral-600 font-medium">
                      <Clock size={12} className="inline mr-1.5 -mt-0.5" />
                      {upcomingF2f.time} &middot; {upcomingF2f.duration || '45 min'}
                    </p>
                    <p className="text-[11px] leading-[1.7] text-neutral-600 font-medium">
                      <User size={12} className="inline mr-1.5 -mt-0.5" />
                      {counselorMap[upcomingF2f.counselorId] || `Counselor #${upcomingF2f.counselorId}`}
                    </p>
                  </div>
                  <Link
                    to={PATHS.SESSIONS}
                    className="inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase text-neutral-900 border border-neutral-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all duration-300 rounded-sm"
                  >
                    View Details
                  </Link>
                </>
              ) : declinedF2f ? (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-red-600">
                      Declined
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 mb-2">
                    Face-To-Face Session
                  </h3>
                  <p className="text-xs leading-[1.6] text-neutral-500 mb-4">
                    Your session was declined by the counselor.
                  </p>
                  <div className="mb-6 space-y-1 border-t border-neutral-100 pt-3">
                    <p className="text-[11px] leading-[1.7] text-neutral-600 font-medium">
                      <CalendarDays size={12} className="inline mr-1.5 -mt-0.5" />
                      {declinedF2f.date}
                    </p>
                    <p className="text-[11px] leading-[1.7] text-neutral-600 font-medium">
                      <Clock size={12} className="inline mr-1.5 -mt-0.5" />
                      {declinedF2f.time} &middot; {declinedF2f.duration || '45 min'}
                    </p>
                    <p className="text-[11px] leading-[1.7] text-neutral-600 font-medium">
                      <User size={12} className="inline mr-1.5 -mt-0.5" />
                      {counselorMap[declinedF2f.counselorId] || `Counselor #${declinedF2f.counselorId}`}
                    </p>
                  </div>
                  <button
                    onClick={() => { setDeclinedF2f(null); handleOpenF2f(); }}
                    className="inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                  >
                    Book Again
                  </button>
                </>
              ) : (
                <>
                  <span className="mb-5 block text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-300">
                    Not Scheduled
                  </span>
                  <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-300 mb-2">
                    Face-To-Face Session
                  </h3>
                  <p className="text-xs leading-[1.6] text-neutral-300 mb-4">No upcoming on-campus appointment.</p>
                  <p className="text-[11px] text-neutral-200 mb-6">Book a face-to-face session with your counselor.</p>
                  <button
                    onClick={handleOpenF2f}
                    className="inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
                  >
                    Book Face-to-Face
                  </button>
                </>
              )}
            </div>

            {/* Card 3 — Diary */}
            <div
              className="group relative bg-white p-8 transition-all duration-300 hover:bg-neutral-50"
              onMouseEnter={() => setDiaryHover(true)}
              onMouseLeave={() => setDiaryHover(false)}
            >
              <span className="mb-5 block text-[11px] font-semibold tracking-[0.15em] uppercase text-neutral-400">
                Personal
              </span>
              <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 mb-2">
                {QUICK_ACTIONS[2].title}
              </h3>
              <p className="text-xs leading-[1.6] text-neutral-500 mb-4">{QUICK_ACTIONS[2].description}</p>
              <p className="text-[11px] text-neutral-400 mb-6">{QUICK_ACTIONS[2].meta}</p>
              <Link
                to={typeof QUICK_ACTIONS[2].href === 'function' ? QUICK_ACTIONS[2].href(authUser?._id) : QUICK_ACTIONS[2].href}
                className={`inline-flex items-center justify-center w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase transition-all duration-300 rounded-sm ${diaryHover
                    ? "text-white bg-neutral-900"
                    : "text-neutral-900 bg-transparent border border-neutral-300"
                  }`}
              >
                {QUICK_ACTIONS[2].cta}
              </Link>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 3: UNIVERSITY GUIDANCE & COUNSELING SERVICES ──────── */}
        <section>
          <div className="mb-12">
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-400">
              University Services
            </span>
            <h2 className="mt-3 text-2xl font-light tracking-[-0.02em] text-neutral-900">
              Guidance &amp; Counseling
            </h2>
            <p className="mt-2 max-w-[520px] text-sm leading-[1.7] text-neutral-500">
              The University of Santo Tomas–Legazpi is committed to fostering a supportive campus environment. Explore
              the services available to help you thrive academically, personally, and emotionally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 overflow-hidden rounded-sm">
            {SERVICE_CARDS.map((card) => (
              <article
                key={card.number}
                className="group relative bg-white p-8 transition-all duration-300 hover:bg-neutral-50 cursor-default"
              >
                <span className="text-[13px] font-mono font-semibold text-neutral-300 group-hover:text-neutral-900 transition-colors duration-300">
                  {card.number}
                </span>
                <h3 className="mt-4 text-sm font-semibold tracking-[-0.01em] text-neutral-900">{card.title}</h3>
                <p className="mt-3 text-xs leading-[1.8] text-neutral-500">{card.description}</p>
                <div className="mt-6 h-px w-8 bg-neutral-300 group-hover:w-full group-hover:bg-neutral-900 transition-all duration-300" />
              </article>
            ))}
          </div>
        </section>

        {/* ──────── FOOTER ──────── */}
        <footer className="mt-28 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[11px] text-neutral-400 tracking-[0.05em]">
            &copy; {new Date().getFullYear()} University of Santo Tomas&ndash;Legazpi. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to={PATHS.RESOURCES} className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors tracking-[0.05em]">Resources</Link>
            <span className="text-neutral-300">/</span>
            <Link to={PATHS.UNIVERSITY_UPDATES} className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors tracking-[0.05em]">Updates</Link>
            <span className="text-neutral-300">/</span>
            <Link to={PATHS.SELF_CARE} className="text-[11px] text-neutral-400 hover:text-neutral-900 transition-colors tracking-[0.05em]">Self Care</Link>
          </div>
        </footer>

      </div>

      <Modal isOpen={requestOpen} onClose={() => { setRequestOpen(false); setConcern(""); setSelectedCounselor(""); }} title="Request Chat Session">
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Select your counselor and briefly describe your concern. All information is kept confidential.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Counselor</label>
            {loadingCounselors ? (
              <div className="text-sm text-neutral-400 py-2">Loading counselors...</div>
            ) : (
              <select
                value={selectedCounselor}
                onChange={(e) => setSelectedCounselor(e.target.value)}
                className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 focus:border-neutral-900 outline-none transition-colors"
              >
                <option value="">Select a counselor</option>
                {counselors.map((c) => (
                  <option key={c._id} value={c._id}>{c.fullName}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Your Concern</label>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="e.g., I've been feeling overwhelmed with my coursework and need someone to talk to."
              rows={4}
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setRequestOpen(false); setConcern(""); setSelectedCounselor(""); }}
              className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestChat}
              disabled={submitting || loadingCounselors}
              className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50"
            >
              {submitting ? "Requesting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={f2fOpen} onClose={() => { setF2fOpen(false); setF2fConcern(""); setF2fAllSlots([]); setF2fAvailableTimes([]); }} title="Book Face-to-Face Session">
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Schedule an on-campus appointment with your counselor. Select a date and time that works for you.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Counselor</label>
            <select
              value={f2fCounselorId}
              onChange={(e) => handleF2fCounselorChange(e.target.value)}
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 focus:border-neutral-900 outline-none transition-colors"
            >
              <option value="">Select a counselor</option>
              {f2fCounselors.map((c) => (
                <option key={c._id} value={c._id}>{c.fullName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Date</label>
            <input
              type="date"
              value={f2fDate}
              onChange={(e) => handleF2fDateChange(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 focus:border-neutral-900 outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Time</label>
            {f2fLoadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-neutral-400 py-2"><Loader size={14} className="animate-spin" /> Loading available times...</div>
            ) : (
              <select
                value={f2fTime}
                onChange={(e) => setF2fTime(e.target.value)}
                disabled={!f2fCounselorId || !f2fDate}
                className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 focus:border-neutral-900 outline-none transition-colors disabled:opacity-40"
              >
                <option value="">Select a time slot</option>
                {f2fAvailableTimes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Concern (optional)</label>
            <textarea
              value={f2fConcern}
              onChange={(e) => setF2fConcern(e.target.value)}
              placeholder="e.g., I'd like to discuss my academic performance and study habits."
              rows={3}
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setF2fOpen(false); setF2fConcern(""); setF2fAllSlots([]); setF2fAvailableTimes([]); }}
              className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBookF2f}
              disabled={f2fSubmitting || !f2fCounselorId || !f2fDate || !f2fTime}
              className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50"
            >
              {f2fSubmitting ? "Booking..." : "Book Session"}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default HomePage;
