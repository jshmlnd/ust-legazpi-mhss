import Announcement from "../models/announcement.model.js";
import { getIO } from "../socket/socket.js";

export const getAnnouncements = async (req, res) => {
  try {
    const filter = req.query.deleted === 'true' ? { isDeleted: true } : { isDeleted: { $ne: true } };
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error("Error in getAnnouncements:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    getIO().emit("announcements:updated");
    res.status(201).json(announcement);
  } catch (error) {
    console.error("Error in createAnnouncement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    getIO().emit("announcements:updated");
    res.json(announcement);
  } catch (error) {
    console.error("Error in updateAnnouncement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    getIO().emit("announcements:updated");
    res.json(announcement);
  } catch (error) {
    console.error("Error in deleteAnnouncement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const restoreAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, { isDeleted: false }, { new: true });
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    getIO().emit("announcements:updated");
    res.json(announcement);
  } catch (error) {
    console.error("Error in restoreAnnouncement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const incrementViews = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });

    const userId = req.user._id;
    if (!announcement.viewedBy.includes(userId)) {
      announcement.viewedBy.push(userId);
      announcement.views = (announcement.views || 0) + 1;
      await announcement.save();
    }

    getIO().emit("announcements:updated");
    res.json(announcement);
  } catch (error) {
    console.error("Error in incrementViews:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const userId = req.user._id;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });

    const reactions = announcement.reactions || {};
    const users = reactions[emoji] || [];

    const idx = users.indexOf(userId);
    if (idx === -1) {
      users.push(userId);
    } else {
      users.splice(idx, 1);
    }

    reactions[emoji] = users;
    announcement.reactions = reactions;
    announcement.markModified('reactions');
    await announcement.save();

    getIO().emit("announcements:updated");
    res.json(announcement);
  } catch (error) {
    console.error("Error in toggleReaction:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
