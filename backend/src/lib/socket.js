import { Server } from "socket.io";

let io;
const userSocketMap = {}; // {userId: socketId}

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    socket.on("userOnline", (userId) => {
      userSocketMap[userId] = socket.id;
      console.log(`User ${userId} is online - Socket: ${socket.id}`);
      io.emit("onlineUsers", Object.keys(userSocketMap));
    });

    socket.on("sendMessage", async (data) => {
      const { receiverId, text, image, senderId, senderModel, receiverModel } = data;
      
      const receiverSocket = userSocketMap[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          senderId,
          senderModel,
          receiverId,
          receiverModel,
          text,
          image,
          timestamp: new Date(),
        });
      }
    });

    socket.on("typing", (data) => {
      const { receiverId } = data;
      const receiverSocket = userSocketMap[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("userTyping", { senderId: data.senderId });
      }
    });

    socket.on("stopTyping", (data) => {
      const { receiverId } = data;
      const receiverSocket = userSocketMap[receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit("userStoppedTyping", { senderId: data.senderId });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [userId, socketId] of Object.entries(userSocketMap)) {
        if (socketId === socket.id) {
          delete userSocketMap[userId];
          break;
        }
      }
      io.emit("onlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};

export const getIO = () => io;

export const getUserSocketMap = () => userSocketMap;
