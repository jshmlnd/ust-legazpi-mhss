import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Appointment from "../models/appointment.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";
import { generateUniqueDynamicId, getDailyDynamicId } from "../lib/generateId.js";
import { overlapsAppointment } from "../lib/appointmentTriage.js";
import { MAX_VIDEO_SIZE, MediaRejectedError, detectMediaFileType, isSupportedDocumentType, isSupportedMediaType, scanMediaFile } from "../lib/mediaModeration.js";

const MALWARE_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.vbs', '.js', '.ws', '.wsh'];
const DLP_PATTERNS = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const OPEN_CHAT_STATUSES = ['pending', 'confirmed', 'active', 'on-going', 'paused'];

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
        let busyCounselorIds = new Set();
        if (isStudent) {
            const chatOnly = req.query.scope === 'chat';
            const openChatAppointments = chatOnly
                ? await Appointment.find({
                    studentId: loggedInUserId,
                    type: 'Chat',
                    status: { $in: OPEN_CHAT_STATUSES },
                }).select('counselorId')
                : [];
            const counselorIds = [...new Set(openChatAppointments.map((appointment) => appointment.counselorId))];
            filteredUsers = await Counselor.find(
                chatOnly ? { _id: { $in: counselorIds } } : { _id: { $ne: loggedInUserId } },
            ).select("-password");
            const now = new Date();
            const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const faceToFaceSessions = await Appointment.find({
                counselorId: { $in: filteredUsers.map((user) => user._id) },
                type: 'Face-To-Face',
                date,
                status: { $in: ['confirmed', 'active', 'on-going', 'paused'] },
            }).select('counselorId date time duration');
            busyCounselorIds = new Set(faceToFaceSessions
                .filter((session) => overlapsAppointment(session, date, time))
                .map((session) => String(session.counselorId)));
        } else {
            const appointments = await Appointment.find({
                counselorId: loggedInUserId,
                type: 'Chat',
                status: { $in: ['active', 'confirmed', 'on-going'] },
            }).select("studentId");
            const studentIds = [...new Set(appointments.map((a) => a.studentId))];
            filteredUsers = await User.find({ _id: { $in: studentIds } }).select("-password");
        }

        for (const u of filteredUsers) {
            if (!u.dynamicId) {
                u.dynamicId = await generateUniqueDynamicId(User);
                await u.save();
            }
        }

        res.status(200).json(filteredUsers.map((u) => ({
            ...u.toObject(),
            dynamicId: getDailyDynamicId(u.dynamicId),
            ...(isStudent ? { status: busyCounselorIds.has(String(u._id)) ? 'Busy' : 'Available' } : {}),
        })));
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

export const requireActiveChat = async (req, res, next) => {
    try {
        const activeAppointment = await Appointment.findOne({
            $or: [
                { studentId: req.user._id, counselorId: Number(req.params.id) },
                { studentId: Number(req.params.id), counselorId: req.user._id },
            ],
            type: "Chat",
            status: { $in: ["active", "confirmed"] },
        }).select("_id");
        if (!activeAppointment) return res.status(403).json({ error: "No active Chat session" });
        next();
    } catch (error) {
        console.log("Error in requireActiveChat middleware: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
export const deleteMessagesByAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            $or: [{ studentId: req.user._id }, { counselorId: req.user._id }],
        }).select("_id");
        if (!appointment) return res.status(403).json({ error: "Not authorized for this session" });
        await Message.deleteMany({ appointmentId });
        res.status(200).json({ message: "Messages deleted" });
    } catch (error) {
        console.log("Error in deleteMessagesByAppointment: ", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    let uploadedAsset;
    try {
        const { text, image, type, appointmentId, fileUrl, fileName, fileSize } = req.body;
        const uploadedFile = req.mediaFiles?.[0];
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const appointmentQuery = {
            $or: [
                { studentId: senderId, counselorId: Number(receiverId) },
                { studentId: Number(receiverId), counselorId: senderId },
            ],
            type: "Chat",
            status: { $in: ["active", "confirmed"] },
        };
        if (appointmentId) appointmentQuery._id = appointmentId;
        const activeAppointment = await Appointment.findOne(appointmentQuery);
        if (!activeAppointment) {
            return res.status(403).json({ error: "No active Chat session" });
        }

        if (!uploadedFile && (image || fileUrl || ["image", "file", "video"].includes(type))) {
            return res.status(400).json({ error: "Media must be uploaded as a file" });
        }

        if (type === 'file' || type === 'video' || uploadedFile) {
            const effectiveFileName = uploadedFile?.filename || fileName || '';
            const effectiveFileSize = uploadedFile?.size || Number(fileSize);
            if (scanForMalware(effectiveFileName)) {
                return res.status(400).json({ error: "File type not allowed for security reasons" });
            }
            if (type === 'video' && effectiveFileSize > MAX_VIDEO_SIZE) {
                return res.status(400).json({ error: "Video file size exceeds 250MB limit" });
            }
            if (type === 'file' && effectiveFileSize > MAX_FILE_SIZE) {
                return res.status(400).json({ error: "File size exceeds 10MB limit" });
            }
        }

        if (scanForDLP(text)) {
            return res.status(400).json({ error: "Message contains sensitive information that cannot be shared" });
        }

        let imageUrl;
        let uploadedFileUrl;
        let storedType = type || 'text';
        let storedFileName = fileName;
        let storedFileSize = fileSize;
        if (uploadedFile) {
            const detected = await detectMediaFileType(uploadedFile.path);
            if (!detected) throw new MediaRejectedError();
            storedFileName = uploadedFile.filename;
            storedFileSize = uploadedFile.size;
            if (detected.mime.startsWith("image/") && !isSupportedMediaType(detected.mime)) {
                throw new MediaRejectedError();
            }
            if (isSupportedMediaType(detected.mime)) {
                const scan = await scanMediaFile(uploadedFile);
                const uploadResponse = await cloudinary.uploader.upload(uploadedFile.path, {
                    folder: "Chat Attachments",
                    resource_type: scan.resourceType,
                });
                uploadedAsset = uploadResponse;
                if (scan.resourceType === "image") imageUrl = uploadResponse.secure_url;
                else uploadedFileUrl = uploadResponse.secure_url;
                storedType = scan.resourceType === "video" ? "video" : "image";
            } else {
                if (!isSupportedDocumentType(detected.mime)) throw new MediaRejectedError();
                if (uploadedFile.size > MAX_FILE_SIZE) {
                    return res.status(400).json({ error: "File size exceeds 10MB limit" });
                }
                const uploadResponse = await cloudinary.uploader.upload(uploadedFile.path, {
                    folder: "Chat Attachments",
                    resource_type: "auto",
                });
                uploadedAsset = uploadResponse;
                uploadedFileUrl = uploadResponse.secure_url;
                storedType = "file";
            }
        } else if (image || fileUrl) {
            return res.status(400).json({ error: "Media must be uploaded as a file" });
        }

        const senderModel = req.user.constructor.modelName;
        const receiverModel = senderModel === "User" ? "Counselor" : "User";

        const newMessage = new Message({
            senderId, senderModel, receiverId, receiverModel,
            text, image: imageUrl,
            type: storedType,
            appointmentId: activeAppointment._id,
            fileUrl: uploadedFileUrl, fileName: storedFileName, fileSize: storedFileSize,
        });

        await newMessage.save();
        uploadedAsset = null;

        const receiverSocketIds = getReceiverSocketIds(String(receiverId));
        receiverSocketIds.forEach(socketId => {
            getIO().to(socketId).emit("newMessage", newMessage);
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        if (uploadedAsset?.public_id) {
            await cloudinary.uploader.destroy(uploadedAsset.public_id, { resource_type: uploadedAsset.resource_type || "image", invalidate: true }).catch(() => {});
        }
        if (error instanceof MediaRejectedError) {
            return res.status(400).json({ error: "Media could not be uploaded" });
        }
        if (req.mediaFiles?.length) {
            return res.status(503).json({ error: "Media moderation is temporarily unavailable" });
        }
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await req.cleanupMediaFiles?.();
    }
};
