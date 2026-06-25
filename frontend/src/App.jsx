import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ResourcePage from "./pages/ResourcePage";
import SelfCarePage from "./pages/SelfCarePage";
import SessionsPage from "./pages/SessionsPage";
import CounselorDashboard from "./pages/CounselorDashboardPage";
import CounselorSessionManagement from "./pages/CounselorSessionManagementPage";
import CounselorSchedulingPage from "./pages/CounselorSchedulingSystemPage";
import CounselorAnnouncementManagerPage from "./pages/CounselorAnnouncementManagerPage";
import ChatPage from "./pages/ChatPage";
import UniversityUpdates from './pages/UniversityUpdates';

import YourDiary from './pages/YourDiary';
import StudentIdentityPage from './pages/StudentIdentityPage';

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { Loader } from "lucide-react";

import { PATHS } from './lib/routes';
import { connectSocket, disconnectSocket } from './lib/socket';


const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      connectSocket();
      subscribeToMessages();
    }
    return () => {
      unsubscribeFromMessages();
      disconnectSocket();
    };
  }, [authUser, subscribeToMessages, unsubscribeFromMessages]);

  console.log({ authUser });

  if(isCheckingAuth && !authUser) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin" />
    </div>
  )

  return (
  <div>

    <Navbar />
    <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

    <Routes>
      {/* Student Routes */}
      <Route path={PATHS.HOME} element={authUser ? <HomePage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.SESSIONS} element={authUser ? <SessionsPage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.LOGIN} element={!authUser ? <LoginPage /> : <Navigate to={PATHS.HOME} /> } />
      <Route path={PATHS.MY_ACCOUNT} element={authUser ? <ProfilePage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.RESOURCES} element={ <ResourcePage /> } />
      <Route path={PATHS.SELF_CARE} element={authUser ? <SelfCarePage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.DIARY} element={authUser ? <YourDiary /> : <Navigate to={PATHS.LOGIN} /> } />


      {/* Shared Route */}
      <Route path={PATHS.MESSAGES} element={authUser ? <ChatPage /> : <Navigate to={PATHS.LOGIN} /> } /> 
      <Route path={PATHS.UNIVERSITY_UPDATES} element={authUser ? < UniversityUpdates/> : <Navigate to={PATHS.LOGIN} /> } />

      {/* Counselor Routes */}
      <Route path={PATHS.DASHBOARD} element={authUser ? < CounselorDashboard/> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.MANAGE_SESSIONS} element={authUser ? < CounselorSessionManagement/> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.COUNSELOR_SCHEDULE} element={authUser ? < CounselorSchedulingPage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.MANAGE_ANNOUNCEMENT} element={authUser ? < CounselorAnnouncementManagerPage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.MANAGE_SELF_CARE} element={authUser ? <SelfCarePage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.MANAGE_RESOURCES} element={authUser ? <ResourcePage /> : <Navigate to={PATHS.LOGIN} /> } />
      <Route path={PATHS.STUDENT_IDENTITY} element={authUser ? <StudentIdentityPage /> : <Navigate to={PATHS.LOGIN}/> } />
      <Route path={PATHS.STUDENT_IDENTITY_DETAIL} element={authUser ? <StudentIdentityPage /> : <Navigate to={PATHS.LOGIN}/> } />
      <Route path={PATHS.SETTINGS} element={authUser ? <ProfilePage /> : <Navigate to={PATHS.LOGIN}/> } />
      <Route path={PATHS.PROFILE} element={authUser ? <Navigate to={PATHS.MY_ACCOUNT} /> : <Navigate to={PATHS.LOGIN}/> } />
    </Routes>

  </div>);
};

export default App;