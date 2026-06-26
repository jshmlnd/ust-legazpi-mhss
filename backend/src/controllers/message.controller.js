import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Appointment from "../models/appointment.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO, getReceiverSocketId } from "../socket/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const isStudent = req.user.constructor.modelName === "User";

        let filteredUsers;
        if (isStudent) {
            filteredUsers = await Counselor.find({ _id: { $ne: loggedInUserId } }).select("-password");
        } else {
            const appointments = await Appointment.find({ counselorId: loggedInUserId }).select("studentId");
            const studentIds = [...new Set(appointments.map((a) => a.studentId))];
            filteredUsers = await User.find({ _id: { $in: studentIds } }).select("-password");
        }

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({ $or: [{ senderId:myId, receiverId:userToChatId }, { senderId:userToChatId, receiverId:myId }] });

        res.status(200).json(messages)
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

        const activeAppointment = await Appointment.findOne({
            $or: [
                { studentId: senderId, counselorId: Number(receiverId) },
                { studentId: Number(receiverId), counselorId: senderId },
            ],
            type: "chat",
            status: { $in: ["active", "confirmed"] },
        });
        if (!activeAppointment) {
            return res.status(403).json({ error: "No active chat session" });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const senderModel = req.user.constructor.modelName;
        const receiverModel = senderModel === "User" ? "Counselor" : "User";

        const newMessage = new Message({ senderId, senderModel, receiverId, receiverModel, text, image: imageUrl, });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(String(receiverId));
        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage)

    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" })
    }
};