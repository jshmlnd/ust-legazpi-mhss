import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAllSlots, getSlots, setSlots, toggleSlot } from "../controllers/availability.controller.js";

const router = express.Router();

router.get("/", protectRoute, getAllSlots);
router.get("/:counselorId", protectRoute, getSlots);
router.post("/", protectRoute, setSlots);
router.patch("/:id", protectRoute, toggleSlot);

export default router;
