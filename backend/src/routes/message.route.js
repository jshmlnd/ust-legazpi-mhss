import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendMessage, getMessages, getUsersForSidebar, deleteMessagesByAppointment } from "../controllers/message.controller.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

router.delete("/appointment/:appointmentId", protectRoute, deleteMessagesByAppointment);

router.post("/upload", protectRoute, async (req, res) => {
    try {
        const { file } = req.body;
        if (!file) return res.status(400).json({ error: "No file provided" });

        const uploadResponse = await cloudinary.uploader.upload(file, {
            resource_type: "auto",
            chunk_size: 6000000,
        });

        res.status(200).json({
            url: uploadResponse.secure_url,
            name: uploadResponse.original_filename || 'file',
            size: uploadResponse.bytes,
            type: uploadResponse.format,
        });
    } catch (error) {
        console.log("Error in file upload: ", error.message);
        res.status(500).json({ error: "File upload failed" });
    }
});

export default router;