import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getDashboard, getWeeklySentiment,
  getSessionDistribution, getUpcomingSessions, getAnalyticsSummary, getStudentInfo,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/dashboard", protectRoute, getDashboard);
router.get("/weekly-sentiment", protectRoute, getWeeklySentiment);
router.get("/session-distribution", protectRoute, getSessionDistribution);
router.get("/upcoming-sessions", protectRoute, getUpcomingSessions);
router.get("/summary", protectRoute, getAnalyticsSummary);
router.get("/student/:id", protectRoute, getStudentInfo);

export default router;
