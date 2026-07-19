import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Appointment from "../models/appointment.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";

const MALWARE_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.vbs', '.js', '.ws', '.wsh'];
const DLP_PATTERNS = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024;

const detectFileType = (mimetype, originalname) => {
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('image/')) return 'image';
    return 'file';
};

const scanForMalware = (filename) => {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    return MALWARE_EXTENSIONS.includes(ext);
};

const scanForDLP = (text) => {
    return DLP_PATTERNS.some(pattern => pattern.test(text || ''));
};

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
        const { appointmentId } = req.query;
        const myId = req.user._id;

        const query = {
            $or: [
                { senderId: myId, receiverId: Number(userToChatId) },
                { senderId: Number(userToChatId), receiverId: myId }
            ]
        };

        if (appointmentId) {
            query.appointmentId = appointmentId;
        }

        const messages = await Message.find(query);
        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, type, callDuration, appointmentId, fileUrl, fileName, fileSize } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const activeAppointment = await Appointment.findOne({
            $or: [
                { studentId: senderId, counselorId: Number(receiverId) },
                { studentId: Number(receiverId), counselorId: senderId },
            ],
            type: "Chat",
            status: { $in: ["active", "confirmed"] },
        });
        if (!activeAppointment) {
            return res.status(403).json({ error: "No active Chat session" });
        }

        if (type === 'file' || type === 'video') {
            if (scanForMalware(fileName || '')) {
                return res.status(400).json({ error: "File type not allowed for security reasons" });
            }
            if (type === 'video' && fileSize > MAX_VIDEO_SIZE) {
                return res.status(400).json({ error: "Video file size exceeds 5GB limit" });
            }
            if (type === 'file' && fileSize > MAX_FILE_SIZE) {
                return res.status(400).json({ error: "File size exceeds 10MB limit" });
            }
        }

        if (scanForDLP(text)) {
            return res.status(400).json({ error: "Message contains sensitive information that cannot be shared" });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const senderModel = req.user.constructor.modelName;
        const receiverModel = senderModel === "User" ? "Counselor" : "User";

        const newMessage = new Message({
            senderId, senderModel, receiverId, receiverModel,
            text, image: imageUrl,
            type: type || 'text',
            callDuration: callDuration || 0,
            appointmentId: appointmentId || activeAppointment._id,
            fileUrl, fileName, fileSize,
        });

        await newMessage.save();

        const receiverSocketIds = getReceiverSocketIds(String(receiverId));
        receiverSocketIds.forEach(socketId => {
            getIO().to(socketId).emit("newMessage", newMessage);
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};