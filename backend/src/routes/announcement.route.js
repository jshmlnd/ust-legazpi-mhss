import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAnnouncements, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, restoreAnnouncement, incrementViews, toggleReaction,
} from "../controllers/announcement.controller.js";

const router = express.Router();

router.get("/", getAnnouncements);
router.post("/", protectRoute, createAnnouncement);
router.put("/:id", protectRoute, updateAnnouncement);
router.patch("/:id/views", protectRoute, incrementViews);
router.post("/:id/react", protectRoute, toggleReaction);
router.delete("/:id", protectRoute, deleteAnnouncement);
router.patch("/:id/restore", protectRoute, restoreAnnouncement);

export default router;
