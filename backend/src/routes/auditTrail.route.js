import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { logCrisisDetection, logIdentityReveal, getAuditTrails } from "../controllers/auditTrail.controller.js";

const router = express.Router();

router.post("/crisis", protectRoute, logCrisisDetection);
router.post("/identity-reveal", protectRoute, logIdentityReveal);
router.get("/", protectRoute, getAuditTrails);

export default router;
