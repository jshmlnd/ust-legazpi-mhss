import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

import AppLayout from './components/AppLayout/AppLayout';
import { RoleRoute } from './components/RoleRoute';
import VoiceCallModal from './components/VoiceCallModal';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ResourcePage from './pages/ResourcePage';
import SelfCarePage from './pages/SelfCarePage';
import SessionsPage from './pages/SessionsPage';
import CounselorDashboard from './pages/CounselorDashboardPage';
import SessionRequestsPage from './pages/SessionRequestsPage';
import CounselorSchedulingPage from './pages/CounselorSchedulingSystemPage';
import CounselorAnnouncementManagerPage from './pages/CounselorAnnouncementManagerPage';
import ChatPage from './pages/ChatPage';
import UniversityUpdates from './pages/UniversityUpdates';
import SuggestionsPage from './pages/SuggestionsPage';
import YourDiary from './pages/YourDiary';
import StudentIdentityPage from './pages/StudentIdentityPage';
import RegisterStudentPage from './pages/RegisterStudentPage';
import RegisterCounselorPage from './pages/RegisterCounselorPage';
import Administrator from './pages/Administrator';

import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { useCallStore } from './store/useCallStore';

import { PATHS } from './lib/routes';
import { connectSocket, disconnectSocket } from './lib/socket';
import { registerServiceWorker, requestNotificationPermission } from './lib/notifications';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  const { subscribeToMessages, unsubscribeFromMessages, selectedUser } = useChatStore();
  const { subscribeToCallEvents, unsubscribeFromCallEvents, incomingCall } = useCallStore();

  const isCounselor = authUser?.userType?.toLowerCase() === 'counselor';
  const peerDisplayName = (() => {
    if (incomingCall?.callerName) {
      return isCounselor ? `STU-${incomingCall.callerId}` : incomingCall.callerName;
    }
    if (selectedUser) {
      return isCounselor && !selectedUser.showNameToCounselor ? `STU-${selectedUser._id}` : selectedUser.fullName;
    }
    return '';
  })();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => { registerServiceWorker(); }, []);

  useEffect(() => {
    if (authUser) {
      connectSocket();
      subscribeToMessages();
      subscribeToCallEvents();
      requestNotificationPermission();
    }
    return () => {
      unsubscribeFromMessages();
      unsubscribeFromCallEvents();
      disconnectSocket();
    };
  }, [authUser, subscribeToMessages, unsubscribeFromMessages, subscribeToCallEvents, unsubscribeFromCallEvents]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-canvas">
        <Loader className="size-10 animate-spin text-brand-600" />
      </div>
    );
  }

  // Route guard helper: unauthenticated users go to login.
  const guard = (element) => (authUser ? element : <Navigate to={PATHS.LOGIN} replace />);

  // Non-students who land on the student home are sent to their own dashboard.
  const role = authUser?.userType?.toLowerCase();

  return (
    <div>
      <VoiceCallModal peerName={peerDisplayName} />

      <Routes>
        {/* Public */}
        <Route path={PATHS.LOGIN} element={!authUser ? <LoginPage /> : <Navigate to={PATHS.HOME} replace />} />

        {/* Authenticated — every page renders inside AppLayout (sidebar + topbar) */}
        <Route element={authUser ? <AppLayout /> : <Navigate to={PATHS.LOGIN} replace />}>
          {/* Student */}
          <Route path={PATHS.HOME} element={guard(role && role !== 'student'
            ? <Navigate to={role === 'counselor' ? PATHS.DASHBOARD : PATHS.ADMIN} replace />
            : <HomePage />)} />
          <Route path={PATHS.SESSIONS} element={guard(<SessionsPage />)} />
          <Route path={PATHS.MY_ACCOUNT} element={guard(<ProfilePage />)} />
          <Route path={PATHS.SELF_CARE} element={guard(<SelfCarePage />)} />
          <Route path={PATHS.DIARY} element={guard(<YourDiary />)} />
          <Route path={PATHS.SUGGESTIONS} element={guard(<SuggestionsPage />)} />
          <Route path={PATHS.RESOURCES} element={guard(<ResourcePage />)} />

          {/* Shared */}
          <Route path={PATHS.MESSAGES} element={guard(<ChatPage />)} />
          <Route path={PATHS.UNIVERSITY_UPDATES} element={guard(<UniversityUpdates />)} />

          {/* Counselor */}
          <Route path={PATHS.DASHBOARD} element={<RoleRoute allow={['counselor']}><CounselorDashboard /></RoleRoute>} />
          <Route path={PATHS.SESSION_REQUESTS} element={<RoleRoute allow={['counselor']}><SessionRequestsPage /></RoleRoute>} />
          <Route path={PATHS.COUNSELOR_SCHEDULE} element={<RoleRoute allow={['counselor']}><CounselorSchedulingPage /></RoleRoute>} />
          <Route path={PATHS.MANAGE_ANNOUNCEMENT} element={<RoleRoute allow={['counselor']}><CounselorAnnouncementManagerPage /></RoleRoute>} />
          <Route path={PATHS.MANAGE_SELF_CARE} element={<RoleRoute allow={['counselor']}><SelfCarePage /></RoleRoute>} />
          <Route path={PATHS.MANAGE_RESOURCES} element={<RoleRoute allow={['counselor']}><ResourcePage /></RoleRoute>} />
          <Route path={PATHS.STUDENT_IDENTITY} element={<RoleRoute allow={['counselor']}><StudentIdentityPage /></RoleRoute>} />
          <Route path={PATHS.STUDENT_IDENTITY_DETAIL} element={<RoleRoute allow={['counselor']}><StudentIdentityPage /></RoleRoute>} />

          {/* Administrator */}
          <Route path={PATHS.ADMIN} element={<RoleRoute allow={['administrator']}><Administrator /></RoleRoute>} />
          <Route path={PATHS.ADMIN_REGISTER_STUDENT} element={<RoleRoute allow={['administrator']}><RegisterStudentPage /></RoleRoute>} />
          <Route path={PATHS.ADMIN_REGISTER_COUNSELOR} element={<RoleRoute allow={['administrator']}><RegisterCounselorPage /></RoleRoute>} />
        </Route>

        {/* Legacy alias */}
        <Route path={PATHS.PROFILE} element={<RoleRoute allow={['student', 'counselor', 'administrator']}><Navigate to={PATHS.MY_ACCOUNT} /></RoleRoute>} />
      </Routes>
    </div>
  );
};

export default App;
