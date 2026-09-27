import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useAuthStore } from '../../store/useAuthStore';
import { usePrefs, getPrefs } from '../../lib/prefs';
import { connectSocket } from '../../lib/socket';
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
  useEffect(() => {
    if (!authUser) return;
    checkUpcomingSession();
    subscribeToPush();
  }, [authUser]);

  // Lightweight poll (mirrors the counselor 3s pattern, slower for students):
  // re-check upcoming sessions every 5 min so a session crossing into the
  // <24h window while the app is open still triggers a notification.
  useEffect(() => {
    if (!authUser || authUser.userType?.toLowerCase() !== 'student') return;
    const id = setInterval(checkUpcomingSession, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [authUser]);

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

  return (
    <div className="min-h-screen bg-canvas">
      <DesktopSidebar collapsed={collapsed} />
      <MobileSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ease-out ${collapsed ? 'md:pl-[76px]' : 'md:pl-[260px]'}`}>
        <Topbar
          authUser={authUser}
          onOpenSidebar={() => setDrawerOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => togglePref('sidebarCollapsed')}
        />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={prefs.calmMode || prefs.switchmode ? 'dark' : 'light'}
      />
    </div>
  );
};

export default AppLayout;
