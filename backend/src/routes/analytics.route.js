import express from "express";
import { counselorOnly } from "../middleware/auth.middleware.js";
import {
  getDashboard, getWeeklySentiment, getWeeklySessions,
  getSessionDistribution, getUpcomingSessions, getAnalyticsSummary, getStudentInfo,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/dashboard", counselorOnly, getDashboard);
router.get("/weekly-sentiment", counselorOnly, getWeeklySentiment);
router.get("/weekly-sessions", counselorOnly, getWeeklySessions);
router.get("/session-distribution", counselorOnly, getSessionDistribution);
router.get("/upcoming-sessions", counselorOnly, getUpcomingSessions);
router.get("/summary", counselorOnly, getAnalyticsSummary);
router.get("/student/:id", counselorOnly, getStudentInfo);

export default router;
