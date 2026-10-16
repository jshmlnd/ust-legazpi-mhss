import express from "express";
import { protectRoute, counselorOnly } from "../middleware/auth.middleware.js";
import { logCrisisDetection, logIdentityReveal, getAuditTrails } from "../controllers/auditTrail.controller.js";

const router = express.Router();

// Logging stays open to both roles (students reveal their own identity and
// both sides can surface crisis events); listing is counselor-only — the
// entries contain crisis message text and student full names.
router.post("/crisis", protectRoute, logCrisisDetection);
router.post("/identity-reveal", protectRoute, logIdentityReveal);
router.get("/", counselorOnly, getAuditTrails);

export default router;
