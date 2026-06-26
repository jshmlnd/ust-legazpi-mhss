import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAppointments, createAppointment,
  updateAppointment, deleteAppointment, getActiveAppointment, archivePastSessions,
} from "../controllers/appointment.controller.js";

const router = express.Router();

router.get("/active/:studentId", protectRoute, getActiveAppointment);
router.get("/", protectRoute, getAppointments);
router.post("/", protectRoute, createAppointment);
router.patch("/:id", protectRoute, updateAppointment);
router.delete("/:id", protectRoute, deleteAppointment);
router.post("/archive-past", protectRoute, archivePastSessions);

export default router;
