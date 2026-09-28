import Announcement from "../models/announcement.model.js";
import User from "../models/user.model.js";
import { getIO } from "../socket/socket.js";
import cloudinary from "../lib/cloudinary.js";
import { sendMail, newsletterEmailTemplate } from "../lib/mailer.js";

// Announcement → newsletter email. Sent in background batches so a slow SMTP
// round-trip never blocks the HTTP response; failures are logged only.
const dispatchNewsletter = async (announcement) => {
    try {
        // Only registered students get the newsletter, and only those who
        // haven't opted out via the "Receive OGT Updates" preference.
        const students = await User.find({
            email: { $exists: true, $ne: "" },
            receiveOgtUpdates: { $ne: false },
        })
            .select("email")
            .lean();
        const recipients = [...new Set(students.map((s) => s.email))];
        if (recipients.length === 0) return;

        const when = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(announcement.createdAt || new Date());
        const html = newsletterEmailTemplate({
            title: announcement.title,
            body: announcement.body,
            author: announcement.author || "Counseling Office",
            when,
            appUrl: process.env.APP_URL || undefined,
        });

        // Mailtrap testing plans throttle sends per second; pace the batch
        // sequentially with a gap so rate-limit (550) rejections don't
        // silently drop students from the newsletter. A failed send logs a
        // warning but doesn't abort the rest of the batch.
        const SEND_GAP_MS = Number(process.env.NEWSLETTER_SEND_GAP_MS) || 1100;
        for (const email of recipients) {
            await sendMail({
                to: email,
                subject: `[SafeSpace] New announcement: ${announcement.title}`,
                html,
            });
            await new Promise((resolve) => setTimeout(resolve, SEND_GAP_MS));
        }
        console.log(`[announcements] newsletter dispatched to ${recipients.length} student email(s)`);
    } catch (error) {
        console.error("[announcements] newsletter dispatch failed:", error.message);
    }
};

// Socket.io may not be initialized (e.g. server still booting or the socket
// server failed to attach); emitting must never fail an otherwise-successful
// write — the same guard appointment.controller uses.
const emitAnnouncementsUpdated = () => {
  const io = getIO();
  if (io) io.emit("announcements:updated");
};

/* Upload any non-URL images to Cloudinary and return their URLs.
   Throws UploadConfigError when the service is unconfigured, so callers can
   fail fast with an actionable message instead of a generic 500. */
export class UploadConfigError extends Error {
  constructor() {
    super("Image upload is not configured: missing CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET");
    this.name = "UploadConfigError";
  }
}

const uploadImages = async (images) => {
  if (!images || images.length === 0) return [];
  const pending = images.filter(Boolean);
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const hasUploadable = pending.some((img) => !/^https?:\/\//i.test(img));
    if (hasUploadable) throw new UploadConfigError();
  }
  const uploads = await Promise.all(
    pending.map((img) => {
      // Already-hosted URLs (re-saving an existing announcement) are kept
      // as-is; only new files (data URIs) are uploaded to Cloudinary.
      if (/^https?:\/\//i.test(img)) return Promise.resolve(img);
      // Note: the SDK's `v2` export rejects named qualities like 'good'
      // inside a transformation; 'auto' (adaptive quality) is accepted.
      return cloudinary.uploader.upload(img, {
        folder: "Announcement Photos",
        resource_type: 'auto',
        transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
      }).then((u) => u.secure_url);
    })
  );
  return uploads;
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
    emitAnnouncementsUpdated();
    // Newsletter is auxiliary: respond first, send in the background.
    dispatchNewsletter(announcement);
    res.status(201).json(announcement);
  } catch (error) {
    console.error("Error in createAnnouncement:", error.message);
    if (error instanceof UploadConfigError) {
      return res.status(503).json({ error: error.message });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
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
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    emitAnnouncementsUpdated();
    res.json(announcement);
    return;
  } catch (error) {
    console.error("Error in updateAnnouncement:", error.message);
    if (error instanceof UploadConfigError) {
      return res.status(503).json({ error: error.message });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid announcement id" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    emitAnnouncementsUpdated();
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
    emitAnnouncementsUpdated();
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
    emitAnnouncementsUpdated();
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

    emitAnnouncementsUpdated();
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

    emitAnnouncementsUpdated();
    res.json(announcement);
  } catch (error) {
    console.error("Error in toggleReaction:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
