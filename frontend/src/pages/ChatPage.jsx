import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, AlertTriangle, Eye, Loader, ChevronLeft, Ban, WifiOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import { PATHS } from '../lib/routes';

const CRISIS_KEYWORDS = [
  'self-harm', 'suicide', 'kill myself', 'want to die',
  'end my life', 'life-threatening', 'crisis', 'emergency',
  'hurt myself', 'not safe',
];

const containsCrisisContent = (text) =>
  CRISIS_KEYWORDS.some((kw) => text?.toLowerCase().includes(kw));

const MessageBubble = ({ message, isOwn, isCrisis }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
    <div
      className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
        isOwn
          ? 'bg-neutral-900 text-white rounded-sm'
          : isCrisis
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-neutral-100 text-neutral-900'
      }`}
    >
      {message.image && (
        <img src={message.image} alt="attachment" className="max-w-full rounded-sm mb-2" />
      )}
      {message.text && <p>{message.text}</p>}
      <p className={`text-[10px] mt-1 ${isOwn ? 'text-neutral-400' : 'text-neutral-400'}`}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  </div>
);

const EmergencyBanner = ({ studentName, onReveal, onDismiss }) => (
  <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="size-8 rounded-sm bg-red-100 flex items-center justify-center shrink-0">
        <AlertTriangle size={16} className="text-red-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-red-800 truncate">Crisis Alert Detected</p>
        <p className="text-[11px] text-red-600 truncate">This student may be in immediate danger</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onReveal}
        className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm"
      >
        <Eye size={14} /> Reveal Identity
      </button>
      <button onClick={onDismiss} className="text-[11px] text-red-500 hover:text-red-700 transition-colors uppercase tracking-[0.05em] font-medium">
        Dismiss
      </button>
    </div>
  </div>
);

const MessageInput = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend({ text: text.trim() });
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 px-6 py-4 bg-white">
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'Select a conversation to start chatting' : 'Type a message...'}
          disabled={disabled}
          className="flex-1 bg-transparent border border-neutral-200 text-sm rounded-sm px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="size-10 flex items-center justify-center rounded-sm bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </form>
  );
};

const StudentChatView = () => {
  const { authUser } = useAuthStore();
  const {
    users, messages, selectedUser, isUsersLoading, isMessagesLoading,
    getUsers, setSelectedUser, sendMessage, isSocketConnected,
  } = useChatStore();
  const messagesEndRef = useRef(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser, setSelectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (appointment) => {
      if (
        String(appointment.studentId) === String(authUser._id) &&
        appointment.type === 'chat' &&
        appointment.status === 'completed'
      ) {
        setSessionEnded(true);
        toast.success('Session has ended');
      }
    };

    socket.on("appointment:updated", handler);
    return () => socket.off("appointment:updated", handler);
  }, [authUser._id]);

  const handleSend = useCallback((data) => sendMessage(data), [sendMessage]);

  const counselor = selectedUser;

  return (
    <div className="flex flex-col h-[calc(100vh-68px)]">
      <div className="border-b border-neutral-200 px-6 py-4 bg-white shrink-0">
        <p className="text-sm font-medium text-neutral-900">
          {counselor ? counselor.fullName : 'Your Counselor'}
        </p>
        {sessionEnded ? (
          <p className="text-[11px] text-red-500 font-medium">Session has ended</p>
        ) : (
          <p className="text-[11px] text-neutral-400">
            {counselor ? counselor.fullName : '—'}
          </p>
        )}
      </div>

      {!isSocketConnected && (
        <div className="flex items-center gap-2 px-6 py-2 bg-amber-50 border-b border-amber-200">
          <WifiOff size={14} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">Connection lost. Reconnecting...</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 bg-neutral-50/50">
        {isUsersLoading || (!selectedUser && users.length > 0) ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={20} className="animate-spin text-neutral-400" />
          </div>
        ) : !counselor ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-400">No counselor assigned yet.</p>
          </div>
        ) : isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={20} className="animate-spin text-neutral-400" />
          </div>
        ) : messages.length === 0 && !sessionEnded ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-400">No messages yet. Start a conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.senderId === authUser._id}
              isCrisis={msg.senderId !== authUser._id && containsCrisisContent(msg.text)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {sessionEnded && (
        <div className="flex items-center gap-2.5 px-6 py-3 bg-amber-50 border-t border-amber-200">
          <Ban size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Session has ended. You can no longer send messages.</p>
        </div>
      )}

      <MessageInput onSend={handleSend} disabled={!counselor || sessionEnded} />
    </div>
  );
};

const SessionTimer = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        hrs > 0
          ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          : `${mins}:${String(secs).padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!elapsed) return null;

  return <span className="text-[10px] text-emerald-600 font-medium">Elapsed Time: {elapsed}</span>;
};

const CounselorChatView = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser } = useAuthStore();
  const {
    users, messages, selectedUser, isUsersLoading, isMessagesLoading,
    flaggedMessage, getUsers, setSelectedUser, sendMessage, clearFlaggedMessage, removeUser,
    unreadCounts, isSocketConnected,
  } = useChatStore();
  const messagesEndRef = useRef(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [sessionEndedBanner, setSessionEndedBanner] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    if (users.length > 0) {
      const userIdFromUrl = searchParams.get('user');
      if (userIdFromUrl) {
        const match = users.find((u) => String(u._id) === userIdFromUrl);
        if (match && (!selectedUser || String(selectedUser._id) !== userIdFromUrl)) {
          setSelectedUser(match);
          setShowMobileList(false);
        }
      }
    }
  }, [users, searchParams, selectedUser, setSelectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedUser) {
      setActiveAppointment(null);
      return;
    }
    const fetchAppointment = async () => {
      setAppointmentLoading(true);
      try {
        const res = await axiosInstance.get(`/appointments/active/${selectedUser._id}`);
        setActiveAppointment(res.data);
        if (res.data.status === 'completed') {
          setSessionEndedBanner(true);
        } else {
          setSessionEndedBanner(false);
        }
      } catch {
        setActiveAppointment(null);
        setSessionEndedBanner(true);
      } finally {
        setAppointmentLoading(false);
      }
    };
    fetchAppointment();
  }, [selectedUser]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedUser) return;

    const handler = (appointment) => {
      if (
        String(appointment.studentId) === String(selectedUser._id) &&
        appointment.type === 'chat'
      ) {
        if (appointment.status === 'completed') {
          setActiveAppointment(null);
          setSessionEndedBanner(true);
        } else if (appointment.status === 'active' || appointment.status === 'confirmed') {
          setActiveAppointment(appointment);
          setSessionEndedBanner(false);
        }
      }
    };

    socket.on("appointment:updated", handler);
    return () => socket.off("appointment:updated", handler);
  }, [selectedUser]);

  const handleSend = useCallback((data) => {
    sendMessage(data);
  }, [sendMessage]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowMobileList(false);
    setSearchParams({ user: user._id }, { replace: true });
  };

  const handleReveal = () => {
    if (flaggedMessage) {
      navigate(`/identity/user/${flaggedMessage.userId}`);
    }
  };

  const handleEndSession = async () => {
    if (!activeAppointment) return;
    setIsEndingSession(true);
    try {
      await axiosInstance.patch(`/appointments/${activeAppointment._id}`, { status: 'completed' });
      toast.success('Session ended');
      setActiveAppointment(null);
      setSessionEndedBanner(true);

      const currentIndex = users.findIndex((u) => u._id === selectedUser?._id);
      const nextUser = currentIndex >= 0 && currentIndex + 1 < users.length
        ? users[currentIndex + 1]
        : null;

      removeUser(selectedUser._id);

      if (nextUser) {
        handleSelectUser(nextUser);
      } else {
        navigate(PATHS.DASHBOARD);
      }
    } catch {
      toast.error('Failed to end session');
    } finally {
      setIsEndingSession(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-68px)] bg-white">
      {/* ─── Sidebar ─── */}
      <div className={`w-80 border-r border-neutral-200 flex flex-col shrink-0 ${
        showMobileList ? 'block' : 'hidden lg:block'
      }`}>
        <div className="px-5 py-[24px] border-b border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-900 tracking-[-0.01em]">Active Conversations</h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">{users.length} students</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isUsersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={18} className="animate-spin text-neutral-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-neutral-400">No conversations yet</p>
            </div>
          ) : (
            users.map((user) => {
              const isSelected = selectedUser?._id === user._id;
              return (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full text-left px-5 py-4 border-b border-neutral-100 transition-colors hover:bg-neutral-50 ${
                    isSelected ? 'bg-neutral-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900 font-mono tracking-tight truncate">
                      STU-{user._id}
                    </p>
                    {unreadCounts[String(user._id)] > 0 && (
                      <span className="shrink-0 size-5 rounded-sm bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCounts[String(user._id)]}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                    {user.department || '—'} · {user.program || '—'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Chat Area ─── */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        !showMobileList ? 'block' : 'hidden lg:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="border-b border-neutral-200 px-6 py-4 bg-white shrink-0 flex items-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="lg:hidden size-8 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 font-mono tracking-tight">
                  STU-{selectedUser._id}
                </p>
                {sessionEndedBanner ? (
                  <p className="text-[11px] text-red-500 font-medium">Session has ended</p>
                ) : (
                  <>
                    <p className="text-[11px] text-neutral-400">
                      {selectedUser.department} · {selectedUser.program}
                    </p>
                    {activeAppointment?.startedAt && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        <SessionTimer startedAt={activeAppointment.startedAt} />
                      </p>
                    )}
                  </>
                )}
              </div>
              {activeAppointment && !sessionEndedBanner && (
                <button
                  onClick={handleEndSession}
                  disabled={isEndingSession}
                  className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isEndingSession ? <Loader size={12} className="animate-spin" /> : null}
                  End Session
                </button>
              )}
            </div>

            {/* Reconnecting Banner */}
            {!isSocketConnected && (
              <div className="flex items-center gap-2 px-6 py-2 bg-amber-50 border-b border-amber-200">
                <WifiOff size={14} className="text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">Connection lost. Reconnecting...</p>
              </div>
            )}

            {/* Emergency Banner */}
            {flaggedMessage && flaggedMessage.userId === selectedUser._id && (
              <EmergencyBanner
                studentName={`STU-${selectedUser._id}`}
                onReveal={handleReveal}
                onDismiss={clearFlaggedMessage}
              />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-neutral-50/50">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader size={20} className="animate-spin text-neutral-400" />
                </div>
              ) : messages.length === 0 && !sessionEndedBanner ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-neutral-400">No messages yet with this student.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={msg.senderId === authUser._id}
                    isCrisis={msg.senderId !== authUser._id && containsCrisisContent(msg.text)}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {sessionEndedBanner && (
              <div className="flex items-center gap-2.5 px-6 py-3 bg-amber-50 border-t border-amber-200">
                <Ban size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Session has ended. No further messages can be sent.</p>
              </div>
            )}

            <MessageInput onSend={handleSend} disabled={sessionEndedBanner || appointmentLoading} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-50/50">
            <div className="text-center">
              <p className="text-sm text-neutral-400">Select a student to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPage = () => {
  const { authUser } = useAuthStore();
  const isCounselor = authUser?.userType?.toLowerCase() === 'counselor';

  return isCounselor ? <CounselorChatView /> : <StudentChatView />;
};

export default ChatPage;
