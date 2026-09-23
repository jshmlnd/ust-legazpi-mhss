import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Message from "../models/message.model.js";

const userSocketMap = {};
let io;

export const getReceiverSocketIds = (receiverId) => {
  const socketIds = userSocketMap[receiverId];
  return socketIds ? [...socketIds] : [];
};

export const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  for (const socketId of userSocketMap[String(userId)] || []) {
    io.to(socketId).emit(event, payload);
  }
};

const findUserById = async (userId) => {
  let user = await User.findById(userId).select("-password");
  if (!user) user = await Counselor.findById(userId).select("-password");
  return user;
};

export const setupSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
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

    if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
    userSocketMap[userId].add(socket.id);
    console.log(`User connected: ${socket.user.fullName} (${userId})`);

    io.emit("onlineUsers", Object.keys(userSocketMap));

    socket.on("call:offer", ({ calleeId, callerName, channelName }) => {
      emitToUser(calleeId, "call:initiated", {
        callerId: userId,
        callerName: socket.user.fullName,
        callerModel: socket.user.constructor.modelName,
        channelName,
      });
    });

    socket.on("call:answer", ({ callerId, channelName }) => {
      emitToUser(callerId, "call:answer", { channelName });
    });

    socket.on("call:ended", ({ targetId }) => {
      emitToUser(targetId, "call:ended");
    });

    socket.on("call:rejected", ({ callerId }) => {
      emitToUser(callerId, "call:rejected");
    });

    socket.on("typing", ({ receiverId }) => {
      emitToUser(receiverId, "typing", { userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      emitToUser(receiverId, "stopTyping", { userId });
    });

    socket.on("markAsRead", async ({ senderId }) => {
      try {
        await Message.updateMany(
          { senderId: senderId, receiverId: Number(userId), read: false },
          { $set: { read: true } }
        );
        emitToUser(senderId, "messagesRead", { readerId: userId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("disconnect", () => {
      userSocketMap[userId].delete(socket.id);
      if (userSocketMap[userId].size === 0) delete userSocketMap[userId];
      io.emit("onlineUsers", Object.keys(userSocketMap));
      console.log(`User disconnected: ${socket.user.fullName} (${userId})`);
    });
  });

  return io;
};
