import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ["polling", "websocket"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
};

export const getSocket = () => socket;
