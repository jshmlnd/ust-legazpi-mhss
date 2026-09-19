import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendMessage, getMessages, getUsersForSidebar, deleteMessagesByAppointment, uploadFile } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

router.delete("/appointment/:appointmentId", protectRoute, deleteMessagesByAppointment);

router.post("/upload", protectRoute, uploadFile);

export default router;