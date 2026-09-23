import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { analyzeCrisisAI } from "../lib/jevCrisis.js";

const router = express.Router();

const MAX_BATCH = 100;

router.post("/analyze", protectRoute, async (req, res) => {
  try {
    const { text, texts } = req.body;
    if (Array.isArray(texts)) {
      const batch = texts.slice(0, MAX_BATCH).map((t) => String(t ?? ""));
      res.json(await Promise.all(batch.map(analyzeCrisisAI)));
      return;
    }
    res.json(await analyzeCrisisAI(text || ""));
  } catch (error) {
    console.error("Error in crisis analyze:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
