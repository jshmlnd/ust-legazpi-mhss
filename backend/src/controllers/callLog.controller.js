import CallLog from "../models/callLog.model.js";
import Appointment from "../models/appointment.model.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";

export const createCallLog = async (req, res) => {
    try {
        const { receiverId, duration, status } = req.body;
        const callerId = req.user._id;
        const callerModel = req.user.constructor.modelName;
        const receiverModel = callerModel === "User" ? "Counselor" : "User";

        // Scope the log to the session server-side: look up the active Chat
        // appointment between the pair instead of trusting a client-sent id.
        // Logs from calls with no active session stay unscoped, which keeps
        // them out of every per-session view by construction.
        // Newest-first: when two active sessions exist for the same pair,
        // stamp the log against the most recently *started* one — the client
        // is chatting inside that session, not the stale leftover.
        const activeSession = await Appointment.findOne({
            $or: [
                { studentId: callerId, counselorId: Number(receiverId) },
                { studentId: Number(receiverId), counselorId: callerId },
            ],
            type: "Chat",
            status: { $in: ["active", "confirmed", "on-going"] },
        }).sort({ startedAt: -1, createdAt: -1 }).select("_id");

        const callLog = new CallLog({
            callerId,
            callerModel,
            receiverId: Number(receiverId),
            receiverModel,
            duration: duration || 0,
            status: status || 'ended',
            ...(activeSession ? { appointmentId: activeSession._id } : {}),
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
        const { appointmentId } = req.query;

        const match = {
            $or: [
                { callerId: myId, receiverId: Number(userId) },
                { callerId: Number(userId), receiverId: myId },
            ],
        };
        if (appointmentId) {
            // Inside a session, show only that session's calls.
            match.appointmentId = appointmentId;
        } else {
            // Outside a session, exclude logs tied to any session so ended
            // sessions don't leak call history into a fresh chat view.
            match.appointmentId = { $exists: false };
        }

        const logs = await CallLog.find(match).sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        console.error("Error in getCallLogs:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
