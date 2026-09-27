import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, AlertTriangle, Eye, Loader, ChevronLeft, Ban, WifiOff, Phone, Check, CheckCheck, User, Paperclip, File, Video, Image as ImageIcon, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useCallStore } from '../store/useCallStore';
import { axiosInstance } from '../lib/axios';
import { getSocket } from '../lib/socket';
import { toast } from 'react-toastify';
import { PATHS } from '../lib/routes';
import SessionFeedbackModal from '../components/SessionFeedbackModal';

const MessageBubble = ({ message, isOwn, isCrisis, crisisSeverity, ownPic, peerPic, ownName, peerName }) => {
  if (message.callerId !== undefined) {
    const mins = Math.floor((message.duration || 0) / 60);
    const secs = (message.duration || 0) % 60;
    const statusText = message.status === 'cancelled'
      ? 'Call cancelled'
      : `Voice call ended (${mins}m ${secs}s)`;
    return (
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center gap-2 px-4 rounded-full bg-line text-ink-muted text-xs">
          <Phone size={12} />
          <span>{statusText}</span>
          <span className="text-ink-muted">
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

  const avatarPic = isOwn ? ownPic : peerPic;
  const senderName = isOwn ? ownName : peerName;

  /* daisyUI: Chat with image, header and footer */
  return (
    <div className={`chat ${isOwn ? 'chat-end' : 'chat-start'} mb-3`}>
      {/* chat-image: avatar beside the bubble */}
      <div className="chat-image avatar">
        <figure className="size-10 rounded-full overflow-hidden bg-line flex items-center justify-center">
          {avatarPic ? (
            <img src={avatarPic} alt={senderName || 'avatar'} className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-ink-muted" />
          )}
        </figure>
      </div>

      {/* chat-header: sender name + timestamp */}
      <div className="chat-header text-xs font-medium text-ink-soft">
        {senderName}
        <time className="ml-1.5 text-xs opacity-50">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>

      <div
        className={`chat-bubble max-w-[85%] sm:max-w-[60%] text-sm leading-relaxed ${
          isOwn ? 'bg-brand-600 text-ink' : 'bg-line text-ink'
        }`}
      >
        {message.image && (
          <img src={message.image} alt="attachment" className="max-w-full rounded-lg mb-2" />
        )}
        {message.type === 'file' && message.fileUrl && (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${isOwn ? 'bg-raised' : 'bg-line'}`}>
            <File size={16} />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{message.fileName}</p>
              <p className="text-xs opacity-60">{formatFileSize(message.fileSize)}</p>
            </div>
          </a>
        )}
        {message.type === 'video' && message.fileUrl && (
          <video src={message.fileUrl} controls className="max-w-full rounded-lg mb-2 max-h-64" />
        )}
        {message.text && <p>{message.text}</p>}
      </div>

      {/* chat-footer: delivery status / crisis flag (monochrome — severity as text, not color) */}
      {isOwn ? (
        <div className="chat-footer flex items-center gap-1 text-xs text-ink-muted opacity-50">
          {message.read ? (
            <span className="inline-flex items-center gap-0.5 text-info"><CheckCheck size={12} />Read</span>
          ) : (
            <span className="inline-flex items-center gap-0.5"><Check size={12} />Sent</span>
          )}
        </div>
      ) : isCrisis ? (
        <div className="chat-footer flex items-center gap-1 text-xs text-ink-muted opacity-70">
          <AlertTriangle size={10} />
          <span className="font-semibold">Flagged · {crisisSeverity || 'review'}</span>
        </div>
      ) : null}
    </div>
  );
};

const TypingBubble = ({ pic }) => (
  <div className="chat chat-start mb-3">
    <div className="chat-image avatar">
      <figure className="size-10 rounded-full overflow-hidden bg-line flex items-center justify-center">
        {pic ? (
          <img src={pic} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={20} className="text-ink-muted" />
        )}
      </figure>
    </div>
    <div className="chat-bubble bg-line">
      <p className="text-xs text-ink-muted animate-pulse">typing...</p>
    </div>
  </div>
);

const EmergencyBanner = ({ onReveal, onDismiss, severity }) => {
  const severityConfig = {
    critical: { bg: 'bg-danger-soft', border: 'border-danger/30', iconBg: 'bg-danger-soft', iconColor: 'text-danger-ink', title: 'text-danger-ink', subtitle: 'text-danger-ink', btn: 'bg-danger hover:bg-danger/90' },
    high: { bg: 'bg-danger-soft', border: 'border-danger/30', iconBg: 'bg-danger-soft', iconColor: 'text-danger-ink', title: 'text-danger-ink', subtitle: 'text-danger-ink', btn: 'bg-danger hover:bg-danger/90' },
    medium: { bg: 'bg-warning-soft', border: 'border-warning/30', iconBg: 'bg-warning-soft', iconColor: 'text-warning-ink', title: 'text-warning-ink', subtitle: 'text-warning-ink', btn: 'bg-warning hover:bg-warning/90' },
    low: { bg: 'bg-warning-soft', border: 'border-warning/30', iconBg: 'bg-warning-soft', iconColor: 'text-warning-ink', title: 'text-warning-ink', subtitle: 'text-warning-ink', btn: 'bg-warning hover:bg-warning/90' },
  };
  const s = severityConfig[severity] || severityConfig.high;

  return (
    <div className={`${s.bg} border-b ${s.border} px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`size-8 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
          <AlertTriangle size={16} className={s.iconColor} />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${s.title} truncate`}>Crisis Alert Detected</p>
          <p className={`text-xs ${s.subtitle} truncate`}>This student may be in immediate danger</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onReveal}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-ink ${s.btn} transition-colors rounded-lg`}
        >
          <Eye size={14} /> <span className="hidden sm:inline">Reveal Identity</span><span className="sm:hidden">Reveal</span>
        </button>
        <button onClick={onDismiss} className={`text-xs ${s.subtitle} hover:opacity-70 transition-opacity font-medium`}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

const MessageInput = ({ onSend, disabled, receiverId, placeholder }) => {
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
    <form onSubmit={handleSubmit} className="border-t border-line px-6 py-4 bg-surface">
      {selectedFile && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-canvas rounded-lg border border-line">
          {selectedFile.type.startsWith('video/') ? <Video size={14} className="text-ink-muted shrink-0" /> :
           selectedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-ink-muted shrink-0" /> :
           <File size={14} className="text-ink-muted shrink-0" />}
          <span className="text-xs text-ink-soft truncate flex-1">{selectedFile.name}</span>
          <button type="button" onClick={handleRemoveFile} className="text-ink-muted hover:text-ink-soft">
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
          className="size-10 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink hover:border-line-strong transition-colors shrink-0 disabled:opacity-50"
        >
          <Paperclip size={15} />
        </button>
        <input
          value={text}
          onChange={handleChange}
          placeholder={placeholder ?? (disabled ? 'Select a conversation to start chatting' : 'Type a message...')}
          disabled={disabled}
          className="flex-1 bg-transparent border border-line text-sm rounded-lg px-4 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || disabled || uploading}
          className="size-10 flex items-center justify-center rounded-lg bg-brand-600 text-ink hover:bg-brand-700 disabled:bg-line disabled:text-ink-muted transition-colors shrink-0"
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
    isSocketConnected, typingUsers, crisisMessageMap,
  } = useChatStore();
  const { callState, initiateCall } = useCallStore();
  const messagesEndRef = useRef(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [feedbackAppointment, setFeedbackAppointment] = useState(null);

  useEffect(() => {
    getUsers();
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
      const st = useCallStore.getState();
      if (st.callState !== 'idle') st.endCall(false);
    };
  }, [getUsers, subscribeToMessages, unsubscribeFromMessages]);

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
      setAppointmentLoading(true);
      try {
        const res = await axiosInstance.get(`/appointments/active/${selectedUser._id}`);
        setActiveAppointment(res.data);
        getMessages(selectedUser._id, res.data?._id);
      } catch {
        setActiveAppointment(null);
        getMessages(selectedUser._id);
      } finally {
        setAppointmentLoading(false);
      }
    };
    fetchAppointment();
  }, [selectedUser, getMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (appointment) => {
      if (String(appointment.studentId) !== String(authUser._id)) return;
      if (appointment.type !== 'Chat') return;

      if (appointment.status === 'completed') {
        const st = useCallStore.getState();
        if (st.callState !== 'idle') st.endCall(false);
        setActiveAppointment(null);
        setSessionEnded(true);
        setFeedbackAppointment(appointment); // close the loop: how are you feeling?
        toast.success('Counselor ended the session');
      } else if (appointment.status === 'active' || appointment.status === 'confirmed') {
        // A new session activated while this thread stayed open: adopt it and
        // re-fetch so the thread shows this session's content.
        if (String(activeAppointment?._id || '') !== String(appointment._id || '')) {
          setSessionEnded(false);
          setActiveAppointment(appointment);
          getMessages(selectedUser._id, appointment._id);
        }
      }
    };

    socket.on("appointment:updated", handler);
    return () => socket.off("appointment:updated", handler);
  }, [authUser._id, navigate, selectedUser, getMessages, activeAppointment?._id]);

  const handleSend = useCallback(async (data) => {
    try {
      await sendMessage(data);
    } catch {
      navigate(PATHS.HOME);
    }
  }, [sendMessage, navigate]);

  const counselor = selectedUser?._id !== authUser?._id ? selectedUser : null;
  const hasActiveSession = !!activeAppointment && !sessionEnded;
  const noActiveSession = !!counselor && !appointmentLoading && !hasActiveSession;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      <div className="border-b border-line px-6 py-4 bg-surface shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-line flex items-center justify-center overflow-hidden shrink-0">
              {counselor?.profilePic ? (
                <img src={counselor.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-ink-muted" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {counselor ? counselor.fullName : 'Your Counselor'}
              </p>
            {sessionEnded ? (
              <p className="text-xs text-danger font-medium">Session has ended</p>
            ) : noActiveSession ? (
              <p className="text-xs text-ink-muted">No active session</p>
            ) : (
              <p className="text-xs text-ink-muted">
                {counselor ? counselor.department : '—'}
              </p>
            )}
          </div>
        </div>
        {counselor && !sessionEnded && hasActiveSession && callState === 'idle' && (
            <button
              onClick={() => initiateCall(counselor._id)}
              className="size-9 flex items-center justify-center rounded-lg border border-line text-ink-soft hover:text-brand-soft-ink hover:border-brand-200 transition-colors"
              title="Start voice call"
            >
              <Phone size={15} />
            </button>
          )}
        </div>
      </div>

      {!isSocketConnected && (
        <div className="flex items-center gap-2 px-6 py-2 bg-warning-soft border-b border-warning/30">
          <WifiOff size={14} className="text-warning-ink shrink-0" />
          <p className="text-xs text-warning-ink font-medium">Connection lost. Reconnecting...</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 bg-canvas/50">
        {isUsersLoading || (!selectedUser && users.length > 0) ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={20} className="animate-spin text-ink-muted" />
          </div>
        ) : !counselor ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-ink-muted">No counselor assigned yet.</p>
          </div>
        ) : isMessagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader size={20} className="animate-spin text-ink-muted" />
          </div>
        ) : messages.length === 0 && !sessionEnded ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-ink-muted">No messages yet. Start a conversation.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.senderId === authUser._id}
              ownPic={authUser.profilePic}
              peerPic={counselor?.profilePic}
              ownName={`STU-${authUser.dynamicId || authUser._id}`}
              peerName={counselor?.fullName}
              isCrisis={msg.senderId !== authUser._id && !!crisisMessageMap[msg._id]}
              crisisSeverity={msg.senderId !== authUser._id ? crisisMessageMap[msg._id] : undefined}
            />
          ))
        )}
        <div ref={messagesEndRef} />
        {typingUsers[counselor?._id] && <TypingBubble pic={counselor?.profilePic} />}
      </div>

      {sessionEnded && (
        <div className="flex items-center gap-2.5 px-6 py-3 bg-warning-soft border-t border-warning/30">
          <Ban size={14} className="text-warning-ink shrink-0" />
          <p className="text-xs text-warning-ink font-medium">Session has ended. You can no longer send messages.</p>
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        disabled={!counselor || sessionEnded || !hasActiveSession}
        receiverId={counselor?._id}
        placeholder={
          !counselor ? 'Select a conversation to start chatting'
          : sessionEnded ? 'Session has ended'
          : !hasActiveSession ? 'No active session — messaging is disabled'
          : 'Type a message...'
        }
      />

      <SessionFeedbackModal
        open={!!feedbackAppointment}
        onClose={() => setFeedbackAppointment(null)}
        appointment={feedbackAppointment}
        counselorName={counselor?.fullName || selectedUser?.fullName}
        isStudent
      />
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

  return <span className="text-xs text-brand-soft-ink font-medium">Elapsed Time: {elapsed}</span>;
};

const CounselorChatView = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser } = useAuthStore();
  const {
    users, messages, selectedUser, isUsersLoading, isMessagesLoading,
    flaggedMessage, crisisAnalysis, getUsers, setSelectedUser, sendMessage, getMessages,
    subscribeToMessages, unsubscribeFromMessages, clearFlaggedMessage, removeUser,
    unreadCounts, isSocketConnected, typingUsers, crisisMessageMap,
  } = useChatStore();
  const { callState, initiateCall, endCall } = useCallStore();
  const messagesEndRef = useRef(null);
  const [showMobileList, setShowMobileList] = useState(() => !searchParams.get('user'));
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [sessionEndedBanner, setSessionEndedBanner] = useState(false);
  const [noSessionBanner, setNoSessionBanner] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [feedbackAppointment, setFeedbackAppointment] = useState(null);

  useEffect(() => {
    getUsers();
    subscribeToMessages();
    return () => {
      unsubscribeFromMessages();
      const st = useCallStore.getState();
      if (st.callState !== 'idle') st.endCall(false);
    };
  }, [getUsers, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (users.length > 0) {
      const userIdFromUrl = searchParams.get('user');
      if (userIdFromUrl) {
        const match = users.find((u) => String(u._id) === userIdFromUrl);
        if (match && (!selectedUser || String(selectedUser._id) !== userIdFromUrl)) {
          setSelectedUser(match);
        }
      }
    }
  }, [users, searchParams, selectedUser, setSelectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!selectedUser) {
        setActiveAppointment(null);
        return;
      }
      setAppointmentLoading(true);
      try {
        const res = await axiosInstance.get(`/appointments/active/${selectedUser._id}`);
        setActiveAppointment(res.data);
        setSessionEndedBanner(false);
        setNoSessionBanner(false);
        getMessages(selectedUser._id, res.data?._id);
      } catch {
        // No active Chat appointment for this student — messaging stays
        // disabled, but this is not a "session ended" state.
        setActiveAppointment(null);
        setSessionEndedBanner(false);
        setNoSessionBanner(true);
        getMessages(selectedUser._id);
      } finally {
        setAppointmentLoading(false);
      }
    };
    fetchAppointment();
  }, [selectedUser, getMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedUser) return;

    const handler = (appointment) => {
      if (
        String(appointment.studentId) === String(selectedUser._id) &&
        appointment.type === 'Chat'
      ) {
        if (appointment.status === 'completed' || appointment.status === 'ended' || appointment.status === 'cancelled' || appointment.status === 'declined' || appointment.status === 'archived') {
          const st = useCallStore.getState();
          if (st.callState !== 'idle') st.endCall(false);
          setActiveAppointment(null);
          setSessionEndedBanner(true);
          getUsers();
          // Re-fetch so the thread drops to session-less content (messages
          // without appointmentId) instead of showing the ended session's
          // call logs and messages.
          getMessages(selectedUser._id);
        } else if (appointment.status === 'active' || appointment.status === 'confirmed') {
          setActiveAppointment(appointment);
          setSessionEndedBanner(false);
          setNoSessionBanner(false);
          // A new session activated while the chat stayed open: re-fetch with
          // its id so currentAppointmentId is fresh and only this session's
          // call logs/messages render.
          if (String(activeAppointment?._id || '') !== String(appointment._id || '')) {
            getMessages(selectedUser._id, appointment._id);
          }
        }
      }
    };

    socket.on("appointment:updated", handler);
    return () => socket.off("appointment:updated", handler);
  }, [selectedUser, getUsers, getMessages, activeAppointment?._id]);

  const handleSend = useCallback(async (data) => {
    try {
      await sendMessage(data);
    } catch {
      /* session-ended errors are expected; toast shown by store */
    }
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
      setFeedbackAppointment(activeAppointment); // close the loop

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
    <div className="flex h-[calc(100dvh-3.5rem)] bg-surface">
      {/* ─── Sidebar ─── */}
      <div className={`w-full lg:w-80 border-r border-line flex flex-col shrink-0 ${
        showMobileList ? 'block' : 'hidden lg:block'
      }`}>
        <div className="px-5 py-[24px] border-b border-line">
          <h2 className="text-sm font-medium text-ink tracking-[-0.01em]">Active Conversations</h2>
          <p className="text-xs text-ink-muted mt-0.5">{users.length} students</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isUsersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={18} className="animate-spin text-ink-muted" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-ink-muted">No conversations yet</p>
            </div>
          ) : (
            users.map((user) => {
              const isSelected = selectedUser?._id === user._id;
              return (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full text-left px-5 py-4 border-b border-line transition-colors hover:bg-canvas ${
                    isSelected ? 'bg-canvas' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink font-mono tracking-tight truncate">
                      {user.showNameToCounselor ? user.fullName : `STU-${user.dynamicId || user._id}`}
                    </p>
                    {unreadCounts[String(user._id)] > 0 && (
                      <span className="shrink-0 size-5 rounded-lg bg-danger text-ink text-xs font-bold flex items-center justify-center">
                        {unreadCounts[String(user._id)]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
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
            <div className="border-b border-line px-6 py-4 bg-surface shrink-0 flex items-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="lg:hidden size-8 flex items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-line flex items-center justify-center overflow-hidden shrink-0">
                    {selectedUser?.profilePic ? (
                      <img src={selectedUser.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-ink-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink font-mono tracking-tight">
                      {selectedUser.showNameToCounselor ? selectedUser.fullName : `STU-${selectedUser.dynamicId || selectedUser._id}`}
                    </p>
                    {sessionEndedBanner ? (
                      <p className="text-xs text-danger font-medium">Session has ended</p>
                    ) : noSessionBanner ? (
                      <p className="text-xs text-ink-muted">No active session</p>
                    ) : (
                      <>
                        <p className="text-xs text-ink-muted">
                          {selectedUser.department} · {selectedUser.program}
                        </p>
                        {activeAppointment?.startedAt && (
                          <p className="text-xs text-ink-muted mt-0.5">
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
                      className="px-3 py-2 text-xs font-semibold text-brand-soft-ink bg-brand-soft hover:bg-brand-soft border border-brand-200 transition-colors rounded-lg inline-flex items-center gap-2"
                      title="Start voice call"
                    >
                      <Phone size={13} />
                      Call
                    </button>
                  )}
                  <button
                    onClick={handleEndSession}
                    disabled={isEndingSession}
                    className="px-4 py-2 text-xs font-semibold text-ink bg-danger hover:bg-danger/90 transition-colors rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isEndingSession ? <Loader size={12} className="animate-spin" /> : null}
                    End Session
                  </button>
                </div>
              )}
            </div>

            {/* Reconnecting Banner */}
            {!isSocketConnected && (
              <div className="flex items-center gap-2 px-6 py-2 bg-warning-soft border-b border-warning/30">
                <WifiOff size={14} className="text-warning-ink shrink-0" />
                <p className="text-xs text-warning-ink font-medium">Connection lost. Reconnecting...</p>
              </div>
            )}

            {/* Emergency Banner */}
            {flaggedMessage && flaggedMessage.userId === selectedUser._id && (
              <EmergencyBanner
                studentName={selectedUser.showNameToCounselor ? selectedUser.fullName : `STU-${selectedUser.dynamicId || selectedUser._id}`}
                onReveal={handleReveal}
                onDismiss={clearFlaggedMessage}
                severity={crisisAnalysis?.severity?.level}
              />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-canvas/50">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader size={20} className="animate-spin text-ink-muted" />
                </div>
              ) : sessionEndedBanner ? (
                <div className="flex items-center justify-center h-full px-6 text-center">
                  <p className="text-xs text-ink-muted">This session has ended. The conversation is no longer available.</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-ink-muted">No messages yet with this student.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={msg.senderId === authUser._id}
                    ownPic={authUser.profilePic}
                    peerPic={selectedUser?.profilePic}
                    ownName={authUser.fullName}
                    peerName={selectedUser.showNameToCounselor ? selectedUser.fullName : `STU-${selectedUser.dynamicId || selectedUser._id}`}
                    isCrisis={msg.senderId !== authUser._id && !!crisisMessageMap[msg._id]}
                    crisisSeverity={msg.senderId !== authUser._id ? crisisMessageMap[msg._id] : undefined}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
              {typingUsers[selectedUser._id] && <TypingBubble pic={selectedUser?.profilePic} />}
            </div>

            {sessionEndedBanner && (
              <div className="flex items-center gap-2.5 px-6 py-3 bg-warning-soft border-t border-warning/30">
                <Ban size={14} className="text-warning-ink shrink-0" />
                <p className="text-xs text-warning-ink font-medium">Session has ended. No further messages can be sent.</p>
              </div>
            )}

            {noSessionBanner && (
              <div className="flex items-center gap-2.5 px-6 py-3 bg-canvas border-t border-line">
                <Ban size={14} className="text-ink-muted shrink-0" />
                <p className="text-xs text-ink-soft font-medium">No active session. Messaging is disabled until an appointment is accepted.</p>
              </div>
            )}

            <MessageInput
              onSend={handleSend}
              disabled={sessionEndedBanner || noSessionBanner || appointmentLoading}
              receiverId={selectedUser?._id}
              placeholder={
                sessionEndedBanner ? 'Session has ended'
                : noSessionBanner ? 'No active session — messaging is disabled'
                : 'Type a message...'
              }
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-canvas/50">
            <div className="text-center">
              <p className="text-sm text-ink-muted">Select a student to start chatting</p>
            </div>
          </div>
        )}
      </div>

      <SessionFeedbackModal
        open={!!feedbackAppointment}
        onClose={() => setFeedbackAppointment(null)}
        appointment={feedbackAppointment}
        counselorName={selectedUser?.fullName}
        isStudent={false}
      />
    </div>
  );
};

const ChatPage = () => {
  const { authUser } = useAuthStore();
  const isCounselor = authUser?.userType?.toLowerCase() === 'counselor';

  return isCounselor ? <CounselorChatView /> : <StudentChatView />;
};

export default ChatPage;
