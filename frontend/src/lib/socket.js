import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
let socket = null;

/**
 * Lazily creates (or returns) the app-wide singleton socket.
 * Safe to call from anywhere at any time — if no connection exists yet it
 * starts one, so UI code can subscribe to events even before App's auth
 * effect has run.
 */
export const connectSocket = () => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ["polling", "websocket"],
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
