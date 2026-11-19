import express from "express";
import { protectRoute, counselorOnly } from "../middleware/auth.middleware.js";
import {
  getAppointments, createAppointment,
  updateAppointment, deleteAppointment, getActiveAppointment, archivePastSessions, clearAllRequests, getCounselors,
  getSessionSummary, generateSessionSummaryForAppointment, updateSessionSummary,
} from "../controllers/appointment.controller.js";

const router = express.Router();

router.get("/counselors", counselorOnly, getCounselors);
router.get("/active/:studentId", protectRoute, getActiveAppointment);
router.get("/:id/summary", counselorOnly, getSessionSummary);
router.post("/:id/summary/generate", counselorOnly, generateSessionSummaryForAppointment);
router.patch("/:id/summary", counselorOnly, updateSessionSummary);
router.get("/", protectRoute, getAppointments);
router.post("/", protectRoute, createAppointment);
router.patch("/:id", protectRoute, updateAppointment);
router.delete("/:id", protectRoute, deleteAppointment);
router.post("/clear-all", protectRoute, clearAllRequests);
router.post("/archive-past", protectRoute, archivePastSessions);

export default router;
