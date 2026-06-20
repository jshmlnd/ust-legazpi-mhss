import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

let socket = null;

export const initializeSocket = (userId) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token: localStorage.getItem("token"),
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    if (userId) {
      socket.emit("userOnline", userId);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
};

export const getSocket = () => socket;

export const sendMessageViaSocket = (receiverId, text, image, senderId, senderModel, receiverModel) => {
  if (socket) {
    socket.emit("sendMessage", {
      receiverId,
      text,
      image,
      senderId,
      senderModel,
      receiverModel,
    });
  }
};

export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on("receiveMessage", callback);
  }
};

export const onOnlineUsers = (callback) => {
  if (socket) {
    socket.on("onlineUsers", callback);
  }
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.on("userTyping", callback);
  }
};

export const onUserStoppedTyping = (callback) => {
  if (socket) {
    socket.on("userStoppedTyping", callback);
  }
};

export const emitTyping = (receiverId, senderId) => {
  if (socket) {
    socket.emit("typing", { receiverId, senderId });
  }
};

export const emitStopTyping = (receiverId, senderId) => {
  if (socket) {
    socket.emit("stopTyping", { receiverId, senderId });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
