import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";
import { showNotification } from "../lib/notifications";
import { useAuthStore } from "./useAuthStore";

export const analyzeCrisis = async (text) => {
  try {
    const res = await axiosInstance.post("/crisis/analyze", { text });
    return res.data;
  } catch {
    return { isCrisis: false, severity: { level: 'none', label: 'None', color: 'green' }, score: 0, matches: [], language: 'english' };
  }
};

const logCrisisAudit = async ({ studentId, counselorId, messageId, analysis }) => {
  try {
    await axiosInstance.post("/audit-trails/crisis", {
      studentId,
      counselorId,
      messageId,
      severity: analysis.severity?.level,
      crisisScore: analysis.score,
      messageText: '',
      matches: analysis.matches,
      language: analysis.language,
    });
  } catch { /* audit logging should not block UI */ }
};

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  flaggedMessage: null,
  crisisAnalysis: null,
  crisisMessageMap: {},
  onlineUsers: [],
  isSocketConnected: false,
  unreadCounts: {},
  typingUsers: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      set({ users: res.data });
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId, appointmentId) => {
    set({ isMessagesLoading: true });
    try {
      const params = appointmentId ? `?appointmentId=${appointmentId}` : '';
      const [msgRes, logRes] = await Promise.all([
        axiosInstance.get(`/message/${userId}${params}`),
        axiosInstance.get(`/call-logs/${userId}`),
      ]);
      const combined = [...msgRes.data, ...logRes.data]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      set({ messages: combined });
    } catch {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    const authUser = useAuthStore.getState().authUser;
    const isCounselor = authUser?.userType?.toLowerCase() === 'counselor';
    const text = messageData.text || '';
    try {
      const res = await axiosInstance.post(`/message/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });

      if (!isCounselor && text) {
        const analysis = await analyzeCrisis(text);
        if (analysis.isCrisis) {
          set((state) => ({
            flaggedMessage: { userId: selectedUser._id, text, messageId: res.data._id },
            crisisAnalysis: analysis,
            crisisMessageMap: { ...state.crisisMessageMap, [res.data._id]: analysis.severity.level },
          }));
          logCrisisAudit({
            studentId: selectedUser._id,
            counselorId: authUser?._id,
            messageId: res.data._id,
            analysis,
          });
        }
      }
    } catch (error) {
      const msg = error.response?.data?.error || "Failed to send message";
      toast.error(msg);
      if (error.response?.status === 403 && msg === "No active Chat session") {
        throw error;
      }
    }
  },

  setSelectedUser: (user, appointmentId) => {
    set({ selectedUser: user, messages: [], crisisMessageMap: {} });
    if (user) {
      get().markAsRead(user._id);
      get().markMessagesAsRead(user._id);
      if (appointmentId) {
        get().getMessages(user._id, appointmentId);
      }
    }
  },

  setSocketConnected: (connected) => set({ isSocketConnected: connected }),

  markAsRead: (userId) => {
    const { unreadCounts } = get();
    if (unreadCounts[userId]) {
      const updated = { ...unreadCounts };
      delete updated[userId];
      set({ unreadCounts: updated });
    }
  },

  markMessagesAsRead: (senderId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("markAsRead", { senderId });
  },

  incrementUnread: (userId) => {
    const { unreadCounts } = get();
    set({ unreadCounts: { ...unreadCounts, [userId]: (unreadCounts[userId] || 0) + 1 } });
  },

  emitTyping: (receiverId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("typing", { receiverId });
  },

  emitStopTyping: (receiverId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("stopTyping", { receiverId });
  },

  subscribeToMessages: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("connect").on("connect", () => {
      set({ isSocketConnected: true });
    });

    socket.off("disconnect").on("disconnect", () => {
      set({ isSocketConnected: false });
    });

    socket.off("newMessage").on("newMessage", async (message) => {
      const { selectedUser, messages, unreadCounts } = get();
      const isRelevant =
        selectedUser &&
        (String(message.senderId) === String(selectedUser._id) ||
          String(message.receiverId) === String(selectedUser._id));

      if (isRelevant) {
        set({ messages: [...messages, message] });

        if (message.senderModel !== 'Counselor' && message.text) {
          const analysis = await analyzeCrisis(message.text);
          if (analysis.isCrisis) {
            const authUser = useAuthStore.getState().authUser;
            set((state) => ({
              flaggedMessage: { userId: message.senderId, text: message.text, messageId: message._id },
              crisisAnalysis: analysis,
              crisisMessageMap: { ...state.crisisMessageMap, [message._id]: analysis.severity.level },
            }));
            logCrisisAudit({
              studentId: message.senderId,
              counselorId: authUser?._id,
              messageId: message._id,
              analysis,
            });
          }
        }

        get().markMessagesAsRead(message.senderId);
      } else {
        const otherId = String(message.senderId) === String(selectedUser?._id)
          ? message.receiverId
          : message.senderId;
        set({ unreadCounts: { ...unreadCounts, [String(otherId)]: (unreadCounts[String(otherId)] || 0) + 1 } });

        const senderName = message.senderModel === 'Counselor' ? 'Counselor' : `Student STU-${message.senderId}`;
        const notifBody = message.text || 'Sent an image';
        showNotification(senderName, notifBody);
      }
    });

    socket.off("callLog").on("callLog", (callLog) => {
      const { selectedUser, messages } = get();
      const isRelevant =
        selectedUser &&
        (String(callLog.callerId) === String(selectedUser._id) ||
          String(callLog.receiverId) === String(selectedUser._id));

      if (isRelevant) {
        set({ messages: [...messages, callLog] });
      }
    });

    socket.off("typing").on("typing", ({ userId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [userId]: true },
      }));
    });

    socket.off("stopTyping").on("stopTyping", ({ userId }) => {
      set((state) => {
        const updated = { ...state.typingUsers };
        delete updated[userId];
        return { typingUsers: updated };
      });
    });

    socket.off("messagesRead").on("messagesRead", ({ readerId }) => {
      const myId = useAuthStore.getState().authUser?._id;
      if (!myId) return;
      set((state) => ({
        messages: state.messages.map((msg) =>
          String(msg.senderId) === String(myId) && String(msg.receiverId) === String(readerId)
            ? { ...msg, read: true }
            : msg
        ),
      }));
    });

    socket.off("onlineUsers").on("onlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    if (socket.connected) {
      set({ isSocketConnected: true });
    }
  },

  unsubscribeFromMessages: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off("newMessage");
    socket.off("callLog");
    socket.off("onlineUsers");
    socket.off("connect");
    socket.off("disconnect");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("messagesRead");
  },

  clearFlaggedMessage: () => set({ flaggedMessage: null, crisisAnalysis: null }),

  removeUser: (userId) => {
    const { users } = get();
    set({ users: users.filter((u) => u._id !== userId) });
  },
}));
