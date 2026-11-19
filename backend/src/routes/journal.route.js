import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getEntries, createEntry, updateEntry, deleteEntry, getMoodAnalytics } from "../controllers/journal.controller.js";

const router = express.Router();

router.get("/", protectRoute, getEntries);
router.get("/mood", protectRoute, getMoodAnalytics);
router.post("/", protectRoute, createEntry);
router.patch("/:id", protectRoute, updateEntry);
router.delete("/:id", protectRoute, deleteEntry);

export default router;
