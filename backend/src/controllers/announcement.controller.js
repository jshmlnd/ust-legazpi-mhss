import Announcement from "../models/announcement.model.js";
import { getIO } from "../socket/socket.js";
import cloudinary from "../lib/cloudinary.js";

const uploadImages = async (images) => {
  if (!images || images.length === 0) return [];
  const uploads = await Promise.all(
    images.filter(Boolean).map((img) =>
      cloudinary.uploader.upload(img, {
        resource_type: 'auto',
        transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
      })
    )
  );
  return uploads.map((u) => u.secure_url);
};

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
    const { images, ...rest } = req.body;
    const uploadedImages = await uploadImages(images);
    const announcement = new Announcement({ ...rest, images: uploadedImages });
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
    const { images, ...rest } = req.body;
    const updateData = { ...rest };
    if (images !== undefined) {
      updateData.images = await uploadImages(images);
    }
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

export const permanentDeleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    getIO().emit("announcements:updated");
    res.json({ message: "Announcement permanently deleted" });
  } catch (error) {
    console.error("Error in permanentDeleteAnnouncement:", error.message);
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
