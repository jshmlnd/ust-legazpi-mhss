import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { mediaMultipart } from "../middleware/mediaUpload.middleware.js";
import { MAX_VIDEO_SIZE } from "../lib/mediaModeration.js";
import { sendMessage, getMessages, getUsersForSidebar, deleteMessagesByAppointment, requireActiveChat } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, requireActiveChat, mediaMultipart({ maxFiles: 1, maxFileSize: MAX_VIDEO_SIZE, maxTotalSize: MAX_VIDEO_SIZE }), sendMessage);

router.delete("/appointment/:appointmentId", protectRoute, deleteMessagesByAppointment);

export default router;
