import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";

const userSocketMap = {};
let io;

export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

export const getIO = () => io;

const findUserById = async (userId) => {
  let user = await User.findById(userId).select("-password");
  if (!user) user = await Counselor.findById(userId).select("-password");
  return user;
};

export const setupSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return next(new Error("No cookies provided"));

      const jwtCookie = cookies
        .split(";")
        .find((c) => c.trim().startsWith("jwt="));
      if (!jwtCookie) return next(new Error("No JWT cookie found"));

      const token = jwtCookie.split("=")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await findUserById(decoded.userId);
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (error) {
      console.log("Socket auth error:", error.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);
    userSocketMap[userId] = socket.id;
    console.log(`User connected: ${socket.user.fullName} (${userId})`);

    io.emit("onlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("onlineUsers", Object.keys(userSocketMap));
      console.log(`User disconnected: ${socket.user.fullName} (${userId})`);
    });
  });

  return io;
};
