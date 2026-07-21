import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, AlertTriangle, Eye, Loader, ChevronLeft, Ban, WifiOff, Phone, Check, CheckCheck, User, Paperclip, File, Video, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore';
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

const MessageBubble = ({ message, isOwn, isCrisis }) => {
  if (message.callerId !== undefined) {
    const mins = Math.floor((message.duration || 0) / 60);
    const secs = (message.duration || 0) % 60;
    const statusText = message.status === 'cancelled'
      ? 'Call cancelled'
      : `Voice call ended (${mins}m ${secs}s)`;
    return (
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 text-neutral-500 text-xs">
          <Phone size={12} />
          <span>{statusText}</span>
          <span className="text-neutral-400">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  return (
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
        {message.type === 'file' && message.fileUrl && (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 p-2 rounded-sm mb-2 ${isOwn ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
            <File size={16} />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{message.fileName}</p>
              <p className="text-[10px] opacity-60">{formatFileSize(message.fileSize)}</p>
            </div>
          </a>
        )}
        {message.type === 'video' && message.fileUrl && (
          <video src={message.fileUrl} controls className="max-w-full rounded-sm mb-2 max-h-64" />
        )}
        {message.text && <p>{message.text}</p>}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <p className={`text-[10px] ${isOwn ? 'text-neutral-400' : 'text-neutral-400'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {isOwn && (
            <span className="flex items-center gap-0.5">
              {message.read
                ? <><CheckCheck size={12} className="text-blue-400" /><span className="text-[10px] text-blue-400">Read</span></>
                : <><Check size={12} className="text-neutral-400" /><span className="text-[10px] text-neutral-400">Sent</span></>
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const EmergencyBanner = ({ studentName, onReveal, onDismiss }) => (
  <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
        <Eye size={14} /> <span className="hidden sm:inline">Reveal Identity</span><span className="sm:hidden">Reveal</span>
      </button>
      <button onClick={onDismiss} className="text-[11px] text-red-500 hover:text-red-700 transition-colors uppercase tracking-[0.05em] font-medium">
        Dismiss
      </button>
    </div>
  </div>
);

const MessageInput = ({ onSend, disabled, receiverId }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const { emitTyping, emitStopTyping } = useChatStore();

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024;

  const handleChange = (e) => {
    setText(e.target.value);
    if (!receiverId || disabled) return;

    emitTyping(receiverId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitStopTyping(receiverId);
    }, 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;

    if (file.size > maxSize) {
      toast.error(isVideo ? 'Video exceeds 5GB limit' : 'File exceeds 10MB limit');
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!text.trim() && !selectedFile) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (receiverId) emitStopTyping(receiverId);

    if (selectedFile) {
      setUploading(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const isVideo = selectedFile.type.startsWith('video/');
        const isImage = selectedFile.type.startsWith('image/');

        if (isImage) {
          onSend({ text: text.trim() || undefined, image: base64 });
        } else {
          const type = isVideo ? 'video' : 'file';
          onSend({ text: text.trim() || undefined, type, fileUrl: base64, fileName: selectedFile.name, fileSize: selectedFile.size });
        }

        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch {
        toast.error('Failed to upload file');
      } finally {
        setUploading(false);
      }
    } else {
      onSend({ text: text.trim() });
    }
    setText('');
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 px-6 py-4 bg-white">
      {selectedFile && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-neutral-50 rounded-sm border border-neutral-200">
          {selectedFile.type.startsWith('video/') ? <Video size={14} className="text-neutral-500 shrink-0" /> :
           selectedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-neutral-500 shrink-0" /> :
           <File size={14} className="text-neutral-500 shrink-0" />}
          <span className="text-xs text-neutral-600 truncate flex-1">{selectedFile.name}</span>
          <button type="button" onClick={handleRemoveFile} className="text-neutral-400 hover:text-neutral-600">
            <X size={14} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="size-10 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 transition-colors shrink-0 disabled:opacity-50"
        >
          <Paperclip size={15} />
        </button>
        <input
          value={text}
          onChange={handleChange}
          placeholder={disabled ? 'Select a conversation to start chatting' : 'Type a message...'}
          disabled={disabled}
          className="flex-1 bg-transparent border border-neutral-200 text-sm rounded-sm px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || disabled || uploading}
          className="size-10 flex items-center justify-center rounded-sm bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors shrink-0"
        >
          {uploading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </form>
  );
};

const StudentChatView = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    users, messages, selectedUser, isUsersLoading, isMessagesLoading,
    getUsers, setSelectedUser, sendMessage, getMessages, subscribeToMessages, unsubscribeFromMessages,
    isSocketConnected, typingUsers,
  } = useChatStore();
  const { callState, endCall } = useCallStore();
  const messagesEndRef = useRef(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);

  useEffect(() => {
    getUsers();
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
      if (callState !== 'idle') endCall(false);
    };
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
    if (!selectedUser) return;
    const fetchAppointment = async () => {
      try {
        const res = await axiosInstance.get(`/appointments/active/${selectedUser._id}`);
        setActiveAppointment(res.data);
        getMessages(selectedUser._id, res.data?._id);
      } catch {
        setActiveAppointment(null);
        getMessages(selectedUser._id);
      }
    };
    fetchAppointment();
  }, [selectedUser]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (appointment) => {
      if (
        String(appointment.studentId) === String(authUser._id) &&
        appointment.type === 'Chat' &&
        appointment.status === 'completed'
      ) {
        if (callState !== 'idle') endCall(false);
        setSessionEnded(true);
        toast.success('Counselor ended the session');
        navigate(PATHS.HOME);
      }
    };

    socket.on("appointment:updated", handler);
    return () => socket.off("appointment:updated", handler);
  }, [authUser._id, navigate, callState, endCall]);

  const handleSend = useCallback((data) => sendMessage(data), [sendMessage]);

  const counselor = selectedUser?._id !== authUser?._id ? selectedUser : null;

  return (
    <div className="flex flex-col h-[calc(100vh-68px)]">
      <div className="border-b border-neutral-200 px-6 py-4 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
              {counselor?.profilePic ? (
                <img src={counselor.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-neutral-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {counselor ? counselor.fullName : 'Your Counselor'}
              </p>
            {sessionEnded ? (
              <p className="text-[11px] text-red-500 font-medium">Session has ended</p>
            ) : (
              <p className="text-[11px] text-neutral-400">
                {counselor ? counselor.department : '—'}
              </p>
            )}
          </div>
        </div>
        {counselor && !sessionEnded && callState === 'idle' && (
            <button
              onClick={() => initiateCall(counselor._id)}
              className="size-9 flex items-center justify-center rounded-sm border border-neutral-200 text-neutral-600 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
              title="Start voice call"
            >
              <Phone size={15} />
            </button>
          )}
        </div>
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
        {typingUsers[counselor?._id] && (
          <div className="flex justify-start mb-3">
            <div className="bg-neutral-100 px-4 py-2.5 rounded-xl rounded-sm">
              <p className="text-xs text-neutral-500 animate-pulse">typing...</p>
            </div>
          </div>
        )}
      </div>

      {sessionEnded && (
        <div className="flex items-center gap-2.5 px-6 py-3 bg-amber-50 border-t border-amber-200">
          <Ban size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Session has ended. You can no longer send messages.</p>
        </div>
      )}

      <MessageInput onSend={handleSend} disabled={!counselor || sessionEnded} receiverId={counselor?._id} />
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
    flaggedMessage, getUsers, setSelectedUser, sendMessage, getMessages,
    subscribeToMessages, unsubscribeFromMessages, clearFlaggedMessage, removeUser,
    unreadCounts, isSocketConnected, typingUsers,
  } = useChatStore();
  const { callState, initiateCall, endCall } = useCallStore();
  const messagesEndRef = useRef(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [sessionEndedBanner, setSessionEndedBanner] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  useEffect(() => {
    getUsers();
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
      if (callState !== 'idle') endCall(false);
    };
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
        getMessages(selectedUser._id, res.data?._id);
      } catch {
        setActiveAppointment(null);
        setSessionEndedBanner(true);
        getMessages(selectedUser._id);
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
        appointment.type === 'Chat'
      ) {
        if (appointment.status === 'completed') {
          if (callState !== 'idle') endCall(false);
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
  }, [selectedUser, callState, endCall]);

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
    if (callState !== 'idle') endCall(true);
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
      <div className={`w-full lg:w-80 border-r border-neutral-200 flex flex-col shrink-0 ${
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
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedUser?.profilePic ? (
                      <img src={selectedUser.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-neutral-400" />
                    )}
                  </div>
                  <div>
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
                </div>
              </div>
              {activeAppointment && !sessionEndedBanner && (
                <div className="flex items-center gap-2">
                  {callState === 'idle' && (
                    <button
                      onClick={() => initiateCall(selectedUser._id)}
                      className="px-3 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors rounded-sm inline-flex items-center gap-2"
                      title="Start voice call"
                    >
                      <Phone size={13} />
                      Call
                    </button>
                  )}
                  <button
                    onClick={handleEndSession}
                    disabled={isEndingSession}
                    className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isEndingSession ? <Loader size={12} className="animate-spin" /> : null}
                    End Session
                  </button>
                </div>
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
              {typingUsers[selectedUser._id] && (
                <div className="flex justify-start mb-3">
                  <div className="bg-neutral-100 px-4 py-2.5 rounded-xl rounded-sm">
                    <p className="text-xs text-neutral-500 animate-pulse">typing...</p>
                  </div>
                </div>
              )}
            </div>

            {sessionEndedBanner && (
              <div className="flex items-center gap-2.5 px-6 py-3 bg-amber-50 border-t border-amber-200">
                <Ban size={14} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Session has ended. No further messages can be sent.</p>
              </div>
            )}

            <MessageInput onSend={handleSend} disabled={sessionEndedBanner || appointmentLoading} receiverId={selectedUser?._id} />
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
