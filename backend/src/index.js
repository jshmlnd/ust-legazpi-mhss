import express from "express";
import { createServer } from "http";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import counselorRoutes from "./routes/counselor.route.js";

import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import { initializeSocket } from "./lib/socket.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const server = createServer(app);

dotenv.config();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"], credentials: true }));

// Initialize Socket.io
initializeSocket(server);

app.use("/api/auth", authRoutes); 
app.use("/api/message", messageRoutes);
app.use("/api/counselor", counselorRoutes);

server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    connectDB();
});
