import React, { useEffect } from 'react';

import Navbar from "./components/Navbar"

import HomePage from "./pages/HomePage";
import CounselorDashboard from "./pages/CounselorDashboardPage";
import CounselorStudentIdentity from "./pages/CounselorStudentIdentityPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ResourcePage from "./pages/ResourcePage";
import SelfCarepage from "./pages/SelfCarepage";
import SessionPage from './pages/SessionPage';
import CounselorUnreadMessagesPage from "./pages/CounselorUnreadMessagesPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from './store/useAuthStore';
import { Loader } from "lucide-react";

const isStudent = (user) =>
  user?.userType?.toLowerCase() === "student";

const isCounselor = (user) =>
  user?.userType?.toLowerCase() === "counselor";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  console.log({ authUser });

  if(isCheckingAuth && !authUser) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin" />
    </div>
  )

  return (
  <div>
    <Navbar />
    <Routes>
      <Route path="/" element={
        authUser
          ? isCounselor(authUser)
            ? <CounselorDashboard />
            : <HomePage />
          : <Navigate to="/login" />
      } />
      <Route path="/login" element={ !authUser ? <LoginPage /> : <Navigate to = "/" /> } />
      <Route path="/counselor/students/:id" element={ isCounselor(authUser) ? <CounselorStudentIdentity /> : <Navigate to = "/login" /> } />
      <Route path="/settings" element={ authUser ? <SettingsPage /> : <Navigate to = "/login" /> } />
      <Route path="/profile" element={ authUser ? <ProfilePage /> : <Navigate to = "/login" /> } />
      <Route path="/resource" element={ authUser ? <ResourcePage /> : <Navigate to = "/login" /> } />
      <Route path="/selfcare" element={ authUser ? <SelfCarepage /> : <Navigate to = "/login" /> } />
      <Route path="/sessions" element={ authUser ? <SessionPage /> : <Navigate to= "/login" /> } />
      <Route path="/messages" element={ authUser ? <SessionPage /> : <Navigate to= "/login" /> } />
      <Route path="/messages/unread" element={ authUser ? <CounselorUnreadMessagesPage /> : <Navigate to= "/login" /> } />
    </Routes>

  </div>);
};

export default App;
