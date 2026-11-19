import express from "express";
import { protectRoute, counselorOnly } from "../middleware/auth.middleware.js";
import { mediaMultipart } from "../middleware/mediaUpload.middleware.js";
import { MAX_IMAGE_SIZE } from "../lib/mediaModeration.js";
import {
  getAnnouncements, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, permanentDeleteAnnouncement, restoreAnnouncement, incrementViews, toggleReaction,
} from "../controllers/announcement.controller.js";

const router = express.Router();

const deletedAnnouncementsOnly = (req, res, next) => (
  req.query.deleted === "true" ? counselorOnly(req, res, next) : next()
);

router.get("/", deletedAnnouncementsOnly, getAnnouncements);
router.post("/", counselorOnly, mediaMultipart({ maxFiles: 4, maxFileSize: MAX_IMAGE_SIZE, maxTotalSize: MAX_IMAGE_SIZE * 4 }), createAnnouncement);
router.put("/:id", counselorOnly, mediaMultipart({ maxFiles: 4, maxFileSize: MAX_IMAGE_SIZE, maxTotalSize: MAX_IMAGE_SIZE * 4 }), updateAnnouncement);
router.patch("/:id/views", protectRoute, incrementViews);
router.post("/:id/react", protectRoute, toggleReaction);
router.delete("/:id/permanent", counselorOnly, permanentDeleteAnnouncement);
router.delete("/:id", counselorOnly, deleteAnnouncement);
router.patch("/:id/restore", counselorOnly, restoreAnnouncement);

export default router;
