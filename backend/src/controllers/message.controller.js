import Counselor from "../models/counselor.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getIO, getUserSocketMap } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        // If the logged in user is a counselor, return only users (students)
        // who have messaged or been messaged by this counselor.
        let users = [];

        if (req.user.userType && req.user.userType.toLowerCase() === "counselor") {
            // Find messages involving this counselor
            const msgs = await Message.find({
                $or: [
                    { senderId: loggedInUserId },
                    { receiverId: loggedInUserId }
                ]
            }).select("senderId receiverId -_id");

            const otherIds = new Set();
            msgs.forEach((m) => {
                const s = String(m.senderId);
                const r = String(m.receiverId);
                const me = String(loggedInUserId);
                if (s !== me) otherIds.add(s);
                if (r !== me) otherIds.add(r);
            });

            if (otherIds.size > 0) {
                users = await User.find({ _id: { $in: Array.from(otherIds) } }).select("-password");
            } else {
                users = [];
            }
        } else {
            // For non-counselors, return all other students and counselors
            const students = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
            users = [...users, ...students];

            const counselors = await Counselor.find({ _id: { $ne: loggedInUserId } }).select("-password");
            users = [...users, ...counselors];
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        const senderModel = req.user.userType === "student" ? "User" : "Counselor";

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            senderModel,
            receiverId,
            receiverModel: "Counselor",
            text,
            image: imageUrl,
        });

        await newMessage.save();

        // Emit real-time message via Socket.io
        const io = getIO();
        const userSocketMap = getUserSocketMap();
        const receiverSocket = userSocketMap[receiverId];

        if (io && receiverSocket) {
            io.to(receiverSocket).emit("receiveMessage", {
                _id: newMessage._id,
                senderId,
                senderModel,
                receiverId,
                receiverModel: "Counselor",
                text,
                image: imageUrl,
                createdAt: newMessage.createdAt,
            });
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Try to find a student/user first
        let user = await User.findById(id).select("-password");
        if (user) return res.status(200).json(user);

        // Otherwise try counselors
        const counselor = await Counselor.findById(id).select("-password");
        if (counselor) return res.status(200).json(counselor);

        return res.status(404).json({ error: "User not found" });
    } catch (error) {
        console.error("Error in getUserById:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getUnreadConversations = async (req, res) => {
    try {
        const counselorId = req.user._id;

        // Find messages involving this counselor, newest first
        const msgs = await Message.find({
            $or: [
                { senderId: counselorId },
                { receiverId: counselorId }
            ]
        }).sort({ createdAt: -1 });

        // Reduce to one last message per other participant
        const map = new Map(); // otherId -> lastMessage
        msgs.forEach((m) => {
            const s = String(m.senderId);
            const r = String(m.receiverId);
            const me = String(counselorId);
            const other = s === me ? r : s;
            if (!map.has(other)) map.set(other, m);
        });

        const result = [];
        for (const [otherId, lastMessage] of map.entries()) {
            let user = await User.findById(otherId).select("-password");
            if (!user) user = await Counselor.findById(otherId).select("-password");

            const unread = (
                String(lastMessage.receiverId) === String(counselorId) &&
                lastMessage.senderModel !== "Counselor"
            );

            result.push({ user, lastMessage, unread });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getUnreadConversations:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};