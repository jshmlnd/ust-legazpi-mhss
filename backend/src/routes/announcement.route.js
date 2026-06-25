import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAnnouncements, createAnnouncement,
  deleteAnnouncement, incrementViews, toggleReaction,
} from "../controllers/announcement.controller.js";

const router = express.Router();

router.get("/", getAnnouncements);
router.post("/", protectRoute, createAnnouncement);
router.patch("/:id/views", incrementViews);
router.post("/:id/react", protectRoute, toggleReaction);
router.delete("/:id", protectRoute, deleteAnnouncement);

export default router;
