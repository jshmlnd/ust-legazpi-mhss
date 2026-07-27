import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getNotice, updateNotice } from "../controllers/notice.controller.js";

const router = express.Router();

router.get("/", getNotice);
router.put("/", protectRoute, updateNotice);

export default router;
