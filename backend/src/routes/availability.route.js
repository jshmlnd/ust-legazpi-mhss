import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSlots, setSlots, toggleSlot } from "../controllers/availability.controller.js";

const router = express.Router();

router.get("/:counselorId", protectRoute, getSlots);
router.post("/", protectRoute, setSlots);
router.patch("/:id", protectRoute, toggleSlot);

export default router;
