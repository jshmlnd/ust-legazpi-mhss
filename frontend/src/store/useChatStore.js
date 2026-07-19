import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";
import { showNotification } from "../lib/notifications";
import { useAuthStore } from "./useAuthStore";

const CRISIS_KEYWORDS = [
  'self-harm', 'suicide', 'kill myself', 'want to die',
  'end my life', 'life-threatening', 'crisis', 'emergency',
  'hurt myself', 'not safe', 'help me please',
];

const containsCrisisContent = (text) =>
  CRISIS_KEYWORDS.some((kw) => text?.toLowerCase().includes(kw));

export const useChatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  flaggedMessage: null,
  onlineUsers: [],
  isSocketConnected: false,
  unreadCounts: {},
  typingUsers: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      set({ users: res.data });
    } catch (error) {
      toast.error("Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    const text = messageData.text || '';
    try {
      const res = await axiosInstance.post(`/message/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });

      if (containsCrisisContent(text)) {
        set({ flaggedMessage: { userId: selectedUser._id, text, messageId: res.data._id } });
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

  setSelectedUser: (user) => {
    set({ selectedUser: user, messages: [], flaggedMessage: null });
    if (user) {
      get().markAsRead(user._id);
      get().markMessagesAsRead(user._id);
      get().getMessages(user._id);
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

    socket.off("newMessage").on("newMessage", (message) => {
      const { selectedUser, messages, unreadCounts } = get();
      const isRelevant =
        selectedUser &&
        (String(message.senderId) === String(selectedUser._id) ||
          String(message.receiverId) === String(selectedUser._id));

      if (isRelevant) {
        set({ messages: [...messages, message] });

        if (containsCrisisContent(message.text)) {
          set({ flaggedMessage: { userId: message.senderId, text: message.text, messageId: message._id } });
        }

        get().markMessagesAsRead(message.senderId);
      } else {
        const otherId = String(message.senderId) === String(selectedUser?._id)
          ? message.receiverId
          : message.senderId;
        set({ unreadCounts: { ...unreadCounts, [String(otherId)]: (unreadCounts[String(otherId)] || 0) + 1 } });

        const senderName = message.senderModel === 'Counselor' ? 'Counselor' : `Student STU-${message.senderId}`;
        const notifBody = message.type === 'call-log' ? message.text : (message.text || 'Sent an image');
        showNotification(senderName, notifBody);
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
    socket.off("onlineUsers");
    socket.off("connect");
    socket.off("disconnect");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("messagesRead");
  },

  clearFlaggedMessage: () => set({ flaggedMessage: null }),

  removeUser: (userId) => {
    const { users } = get();
    set({ users: users.filter((u) => u._id !== userId) });
  },
}));
