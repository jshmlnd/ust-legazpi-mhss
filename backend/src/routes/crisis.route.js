import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { analyzeCrisis } from "../lib/crisisDetector.js";

const router = express.Router();

router.post("/analyze", protectRoute, async (req, res) => {
  try {
    const result = analyzeCrisis(req.body.text || '');
    res.json(result);
  } catch (error) {
    console.error("Error in crisis analyze:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
