import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";

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
    if (user) get().getMessages(user._id);
  },

  subscribeToMessages: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("newMessage").on("newMessage", (message) => {
      const { selectedUser, messages } = get();
      const isRelevant =
        selectedUser &&
        (String(message.senderId) === String(selectedUser._id) ||
          String(message.receiverId) === String(selectedUser._id));

      if (isRelevant) {
        set({ messages: [...messages, message] });

        if (containsCrisisContent(message.text)) {
          set({ flaggedMessage: { userId: message.senderId, text: message.text, messageId: message._id } });
        }
      }
    });

    socket.off("onlineUsers").on("onlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off("newMessage");
    socket.off("onlineUsers");
  },

  clearFlaggedMessage: () => set({ flaggedMessage: null }),
}));
