import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAppointments, createAppointment,
  updateAppointment, deleteAppointment,
} from "../controllers/appointment.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAppointments);
router.post("/", protectRoute, createAppointment);
router.patch("/:id", protectRoute, updateAppointment);
router.delete("/:id", protectRoute, deleteAppointment);

export default router;
