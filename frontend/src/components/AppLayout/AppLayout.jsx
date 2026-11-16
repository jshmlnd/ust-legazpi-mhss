import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/useAuthStore';
import { usePrefs, getPrefs } from '../../lib/prefs';
import { connectSocket } from '../../lib/socket';
import { axiosInstance } from '../../lib/axios';
import { PATHS } from '../../lib/routes';
import { showNotification } from '../../lib/notifications';
import { DesktopSidebar, MobileSidebar } from './Sidebar';
import Topbar from './Topbar';
import { checkUpcomingSession, subscribeToPush } from '../../lib/sessionLoop';

const AppLayout = () => {
  const { authUser } = useAuthStore();
  const { prefs, togglePref } = usePrefs(authUser?._id);
  const collapsed = !!prefs.sidebarCollapsed;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Real sessionReminders: on app open, notify about sessions starting
  // within 24h (in-app via the service worker) and register this browser
  // for background Web Push reminders (T-24h / T-1h / missed-chat nudge).
  // Gated by the account's Session Reminders preference.
  useEffect(() => {
    if (!authUser) return;
    if (prefs.sessionReminders) checkUpcomingSession();
    subscribeToPush();
  }, [authUser, prefs.sessionReminders]);

  // Lightweight poll (mirrors the counselor 3s pattern, slower for students):
  // re-check upcoming sessions every 5 min so a session crossing into the
  // <24h window while the app is open still triggers a notification.
  useEffect(() => {
    if (!authUser || authUser.userType?.toLowerCase() !== 'student') return;
    if (!prefs.sessionReminders) return;
    const id = setInterval(checkUpcomingSession, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [authUser, prefs.sessionReminders]);

  // Student: appointment accepted / declined notices.
  useEffect(() => {
    if (!authUser || authUser.userType?.toLowerCase() !== 'student') return;

    const socket = connectSocket();
    const handler = (appointment) => {
      if (!appointment || appointment.cleared) return;
      if (String(appointment.studentId) !== String(authUser._id)) return;
      if (appointment.status === 'active') {
        toast.success('Your appointment has been accepted');
      } else if (appointment.status === 'declined') {
        toast.error('Your appointment has been declined');
      }
    };

    socket.on('appointment:updated', handler);
    return () => socket.off('appointment:updated', handler);
  }, [authUser]);

  // Counselor: toast + system notification on new session requests.
  useEffect(() => {
    if (!authUser || authUser.userType?.toLowerCase() !== 'counselor') return;

    const socket = connectSocket();

    const handler = (appointment) => {
      if (!appointment || appointment.cleared) return;
      if (String(appointment.counselorId) !== String(authUser._id)) return;
      if (appointment.status !== 'pending') return;
      const label = appointment.type === 'Chat' ? 'Chat' : 'Face-to-Face';
      toast.info(`New ${label} session request`);
      if (getPrefs(authUser._id).sessionReminders) {
        showNotification('New session request', `${label} session requested — review it in your dashboard.`);
      }
    };

    socket.on('appointment:updated', handler);
    return () => socket.off('appointment:updated', handler);
  }, [authUser]);

  // Sidebar badges: pending requests (counselor), unread messages, and today's
  // live sessions. Refetched on appointment socket events, route changes
  // (reading a chat marks it read server-side) and a 15s poll.
  const { pathname } = useLocation();
  const [counts, setCounts] = useState({ requests: 0, messages: 0, today: 0 });
  const loadCounts = useRef(() => {});
  useEffect(() => {
    if (!authUser) return;
    const isCounselor = authUser.userType?.toLowerCase() === 'counselor';
    let cancelled = false;
    const n = (r) => (r.status === 'fulfilled' ? r.value : null);
    loadCounts.current = async () => {
      const [pending, unread, appts] = await Promise.allSettled([
        isCounselor ? axiosInstance.get('/analytics/upcoming-sessions') : null,
        axiosInstance.get('/messages/unread-count'),
        axiosInstance.get('/appointments'),
      ]);
      if (cancelled) return;
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setCounts((prev) => ({
        requests: n(pending) ? (n(pending).data ?? []).filter((s) => s.status === 'pending').length : prev.requests,
        messages: n(unread) ? n(unread).data.count : prev.messages,
        today: n(appts)
          ? (n(appts).data ?? []).filter((a) => a.date === today && ['confirmed', 'active', 'on-going', 'paused'].includes(a.status)).length
          : prev.today,
      }));
    };
    const refresh = () => loadCounts.current();
    refresh();
    const socket = connectSocket();
    socket.on('appointment:updated', refresh);
    const poll = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      socket.off('appointment:updated', refresh);
      clearInterval(poll);
    };
  }, [authUser]);
  // refetch on navigation (reading a chat marks it read server-side)
  useEffect(() => { loadCounts.current(); }, [pathname]);
  const badges = {
    [PATHS.SESSION_REQUESTS]: counts.requests,
    [PATHS.MESSAGES]: counts.messages,
    [PATHS.COUNSELOR_SCHEDULE]: counts.today,
    [PATHS.SESSIONS]: counts.today,
  };

  return (
    <div className="app-backdrop min-h-screen">
      <DesktopSidebar collapsed={collapsed} badges={badges} />
      <MobileSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} badges={badges} />

      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ease-out ${collapsed ? 'md:pl-[76px]' : 'md:pl-[260px]'}`}>
        <Topbar
          authUser={authUser}
          onOpenSidebar={() => setDrawerOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => togglePref('sidebarCollapsed')}
        />
        <div className="relative flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
