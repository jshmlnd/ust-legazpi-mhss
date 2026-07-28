import CallLog from "../models/callLog.model.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";

export const createCallLog = async (req, res) => {
    try {
        const { receiverId, duration, status } = req.body;
        const callerId = req.user._id;
        const callerModel = req.user.constructor.modelName;
        const receiverModel = callerModel === "User" ? "Counselor" : "User";

        const callLog = new CallLog({
            callerId,
            callerModel,
            receiverId: Number(receiverId),
            receiverModel,
            duration: duration || 0,
            status: status || 'ended',
        });

        await callLog.save();

        const receiverSocketIds = getReceiverSocketIds(String(receiverId));
        receiverSocketIds.forEach(socketId => {
            getIO().to(socketId).emit("callLog", callLog);
        });

        res.status(201).json(callLog);
    } catch (error) {
        console.error("Error in createCallLog:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getCallLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        const logs = await CallLog.find({
            $or: [
                { callerId: myId, receiverId: Number(userId) },
                { callerId: Number(userId), receiverId: myId },
            ],
        }).sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        console.error("Error in getCallLogs:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
