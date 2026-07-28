import AuditTrail from "../models/auditTrail.model.js";

export const logCrisisDetection = async (req, res) => {
  try {
    const { studentId, counselorId, severity, crisisScore, messageText, messageId, matches, language } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const entry = await AuditTrail.create({
      studentId,
      counselorId: counselorId || null,
      type: "crisis_detected",
      severity: severity || "none",
      crisisScore: crisisScore || 0,
      messageText: messageText || "",
      messageId: messageId || null,
      metadata: { matches: matches || [], language: language || "english" },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error("Error in logCrisisDetection:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logIdentityReveal = async (req, res) => {
  try {
    const { studentId, counselorId, messageId } = req.body;

    if (!studentId || !counselorId) {
      return res.status(400).json({ error: "studentId and counselorId are required" });
    }

    const entry = await AuditTrail.create({
      studentId,
      counselorId,
      type: "identity_revealed",
      messageId: messageId || null,
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

    if (studentId) filter.studentId = studentId;
    if (counselorId) filter.counselorId = counselorId;
    if (type) filter.type = type;

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
