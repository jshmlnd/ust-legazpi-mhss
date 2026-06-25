import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getEntries, createEntry, deleteEntry, getMoodAnalytics } from "../controllers/journal.controller.js";

const router = express.Router();

router.get("/", protectRoute, getEntries);
router.get("/mood", protectRoute, getMoodAnalytics);
router.post("/", protectRoute, createEntry);
router.delete("/:id", protectRoute, deleteEntry);

export default router;
