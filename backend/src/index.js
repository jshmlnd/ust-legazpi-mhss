import express from "express";
import http from "http";

import path from "path";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import appointmentRoutes from "./routes/appointment.route.js";
import resourceRoutes from "./routes/resource.route.js";
import selfCareRoutes from "./routes/selfCare.route.js";
import journalRoutes from "./routes/journal.route.js";
import availabilityRoutes from "./routes/availability.route.js";
import announcementRoutes from "./routes/announcement.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import suggestionRoutes from "./routes/suggestion.route.js";
import agoraRoutes from "./routes/agora.route.js";
import aiChatRoutes from "./routes/aiChat.route.js";

import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupSocket } from "./socket/socket.js";

const app = express();
const server = http.createServer(app);

dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/self-care", selfCareRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/agora", agoraRoutes);
app.use("/api/ai", aiChatRoutes);

if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get('{/*splat}', (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

setupSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    connectDB();
});