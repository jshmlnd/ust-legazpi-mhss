import express from "express";
import { chat } from "../controllers/aiChat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/chat", protectRoute, chat);

export default router;
