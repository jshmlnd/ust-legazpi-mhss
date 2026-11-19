import express from "express";
import { protectRoute, counselorOnly } from "../middleware/auth.middleware.js";
import { logCrisisDetection, logIdentityReveal, revealStudentIdentity, getAuditTrails } from "../controllers/auditTrail.controller.js";

const router = express.Router();

// Crisis logging is open to both chat participants (the controller checks
// membership); identity reveals and listing are counselor-only — entries
// contain student identities.
router.post("/crisis", protectRoute, logCrisisDetection);
router.post("/identity-reveal", counselorOnly, logIdentityReveal);
router.get("/identity/:studentId", counselorOnly, revealStudentIdentity);
router.get("/", counselorOnly, getAuditTrails);

export default router;
