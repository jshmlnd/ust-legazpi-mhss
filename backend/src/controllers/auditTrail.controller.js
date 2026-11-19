import mongoose from "mongoose";
import AuditTrail from "../models/auditTrail.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Appointment from "../models/appointment.model.js";
import { getDailyDynamicId } from "../lib/generateId.js";

const IDENTITY_FIELDS = "studentId fullName dynamicId department program yearLevel email phone mother father guardian emergencyContact";

// Emergency identity reveal: counselor-only, limited to students the counselor
// has a session with, and logged in the same request that returns the data.
export const revealStudentIdentity = async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!Number.isInteger(studentId)) return res.status(400).json({ error: "Invalid student" });
    const counselorId = Number(req.user._id);

    const linked = await Appointment.exists({ studentId, counselorId });
    if (!linked) return res.status(403).json({ error: "You have no session with this student" });

    const student = await User.findById(studentId).select(IDENTITY_FIELDS).lean();
    if (!student) return res.status(404).json({ error: "Student not found" });

    await AuditTrail.create({ studentId, counselorId, type: "identity_revealed", messageId: null });
    res.json({ ...student, dynamicId: getDailyDynamicId(student.dynamicId) });
  } catch (error) {
    console.error("Error in revealStudentIdentity:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const SEVERITIES = ["critical", "high", "medium", "low", "none"];
const isDuplicateKey = (error) => error?.code === 11000;

// Student and counselor IDs come from the stored message, never from the
// request body, and only someone in that conversation may log it.
export const logCrisisDetection = async (req, res) => {
  try {
    const messageId = String(req.body.messageId ?? "");
    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ error: "A valid messageId is required" });
    }

    const message = await Message.findById(messageId).select("senderId senderModel receiverId receiverModel");
    if (!message) return res.status(404).json({ error: "Message not found" });

    const me = { id: Number(req.user._id), model: req.user.constructor.modelName };
    const sides = [
      { id: message.senderId, model: message.senderModel },
      { id: message.receiverId, model: message.receiverModel },
    ];
    if (!sides.some((s) => s.id === me.id && s.model === me.model)) {
      return res.status(403).json({ error: "Not part of this conversation" });
    }
    const studentId = sides.find((s) => s.model === "User")?.id;
    const counselorId = sides.find((s) => s.model === "Counselor")?.id ?? null;
    if (!studentId) return res.status(400).json({ error: "Message has no student" });

    const { severity, crisisScore, matches, language } = req.body;
    const doc = {
      studentId,
      counselorId,
      type: "crisis_detected",
      severity: SEVERITIES.includes(severity) ? severity : "none",
      crisisScore: Number.isFinite(Number(crisisScore)) ? Number(crisisScore) : 0,
      messageText: "",
      messageId,
      metadata: {
        matches: Array.isArray(matches) ? matches.slice(0, 50).map(String) : [],
        language: typeof language === "string" ? language.slice(0, 20) : "english",
      },
    };

    // Both chat clients report the same message; the unique index keeps the first.
    try {
      const entry = await AuditTrail.findOneAndUpdate(
        { messageId, type: "crisis_detected" },
        { $setOnInsert: doc },
        { upsert: true, new: true },
      );
      return res.status(201).json(entry);
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      const entry = await AuditTrail.findOne({ messageId, type: "crisis_detected" });
      return res.status(200).json(entry);
    }
  } catch (error) {
    console.error("Error in logCrisisDetection:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Counselor-only route: the counselor is whoever is signed in.
export const logIdentityReveal = async (req, res) => {
  try {
    const studentId = Number(req.body.studentId);
    if (!Number.isInteger(studentId)) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const entry = await AuditTrail.create({
      studentId,
      counselorId: Number(req.user._id),
      type: "identity_revealed",
      messageId: null,
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error("Error in logIdentityReveal:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAuditTrails = async (req, res) => {
  try {
    const { studentId, counselorId, type } = req.query;
    const filter = {};

    if (studentId) filter.studentId = Number(studentId);
    if (counselorId) filter.counselorId = Number(counselorId);
    if (type) filter.type = String(type);

    const trails = await AuditTrail.find(filter)
      .sort({ createdAt: -1 })
      .populate("studentId", "fullName studentId")
      .populate("counselorId", "fullName");

    res.json(trails);
  } catch (error) {
    console.error("Error in getAuditTrails:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
