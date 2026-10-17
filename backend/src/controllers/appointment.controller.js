import Appointment from "../models/appointment.model.js";
import Counselor from "../models/counselor.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";
import SessionSummary from "../models/sessionSummary.model.js";
import AvailabilitySlot from "../models/availabilitySlot.model.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";
import { getDailyDynamicId } from "../lib/generateId.js";
import { analyzeCrisisAI } from "../lib/groqCrisis.js";
import { mapConcernRisk, overlapsAppointment } from "../lib/appointmentTriage.js";
import { busyRiskAlertEmailTemplate, sendMail } from "../lib/mailer.js";
import { generateSessionSummary, stripSummaryMarkdown } from "../lib/sessionSummary.js";

const FREED_STATUSES = ['declined', 'cancelled', 'archived'];
const BUSY_F2F_STATUSES = ['confirmed', 'active', 'on-going', 'paused'];
const OPEN_CHAT_STATUSES = ['pending', 'confirmed', 'active', 'on-going', 'paused'];
const GUIDANCE_EMAIL = 'joshuaklein.malonda@gmail.com';
const SUMMARY_STATUSES = ['completed', 'ended'];
const MAX_SUMMARY_LENGTH = 12000;
const ANONYMOUS_STUDENT = 'Anonymous Student';

const findOverlappingF2F = async (counselorId, date, time) => {
  const sessions = await Appointment.find({
    counselorId,
    type: 'Face-To-Face',
    date,
    status: { $in: BUSY_F2F_STATUSES },
  }).select('date time duration');
  return sessions.find((session) => overlapsAppointment(session, date, time));
};

const sendBusyRiskAlert = async ({ counselorId, concernRisk, date, time }) => {
  if (!['High', 'Urgent'].includes(concernRisk)) return;
  const counselor = await Counselor.findById(counselorId).select('email fullName').lean();
  const counselorName = counselor?.fullName || 'the assigned counselor';
  const subject = `${concernRisk} risk online session request for ${counselorName}`;
  const reviewUrl = `${(process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')}/manage/session-requests`;
  const text = `A ${concernRisk.toLowerCase()} risk online session was requested for ${date} at ${time} while ${counselorName} has a face-to-face session. Review it at ${reviewUrl}`;
  const html = busyRiskAlertEmailTemplate({ concernRisk, counselorName, date, time, reviewUrl });
  void Promise.all([
    sendMail({ to: counselor?.email, subject, text, html }),
    sendMail({ to: GUIDANCE_EMAIL, subject, text, html }),
  ]);
};

const takeSlot = async (counselorId, date, time) => {
  const slot = await AvailabilitySlot.findOne({ counselorId, date, time });
  if (slot && slot.isAvailable) {
    slot.isAvailable = false;
    await slot.save();
  }
};

const freeSlot = async (counselorId, date, time) => {
  const slot = await AvailabilitySlot.findOne({ counselorId, date, time });
  if (slot && !slot.isAvailable) {
    slot.isAvailable = true;
    await slot.save();
  }
};

const createSessionSummary = async (appointment) => {
  const messages = await Message.find({ appointmentId: appointment._id })
    .sort({ createdAt: 1 })
    .select('senderModel text')
    .lean();
  const generated = await generateSessionSummary({ appointment, messages });

  return SessionSummary.findOneAndUpdate(
    { appointmentId: appointment._id },
    {
      $set: {
        counselorId: appointment.counselorId,
        studentId: appointment.studentId,
        summary: generated.summary,
        generatedByAi: generated.generatedByAi,
        generatedAt: new Date(),
        editedAt: null,
      },
      $setOnInsert: { appointmentId: appointment._id },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

const findOwnedCounselorAppointment = async (req) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return { error: 'Appointment not found', status: 404 };
  if (String(appointment.counselorId) !== String(req.user._id)) {
    return { error: 'Not your appointment', status: 403 };
  }
  return { appointment };
};

const serializeSessionSummary = async (summary, appointment) => {
  const student = await User.findById(appointment.studentId)
    .select('fullName showNameToCounselor')
    .lean();
  const studentName = student?.showNameToCounselor && student.fullName
    ? student.fullName
    : ANONYMOUS_STUDENT;
  const data = summary?.toObject ? summary.toObject() : summary;
  return { ...data, studentName };
};

export const getAppointments = async (req, res) => {
  try {
    const isCounselor = req.user.constructor.modelName === "Counselor";
    let appointments;
    if (isCounselor) {
      appointments = await Appointment.find({ counselorId: req.user._id, counselorArchived: { $ne: true } }).sort({ date: -1, time: -1 });
    } else {
      appointments = await Appointment.find({ studentId: req.user._id, studentArchived: { $ne: true } }).sort({ date: -1, time: -1 });
    }

    const counselorIds = [...new Set(
      appointments.flatMap((appointment) => [appointment.counselorId, appointment.referredById]).filter(Boolean).map(String)
    )];
    if (counselorIds.length > 0) {
      const counselors = await Counselor.find({ _id: { $in: counselorIds } }).select("fullName _id").lean();
      const counselorMap = Object.fromEntries(counselors.map((counselor) => [String(counselor._id), counselor.fullName]));

      const studentIds = [...new Set(appointments.map((appointment) => appointment.studentId))];
      const students = await User.find({ _id: { $in: studentIds } }).select("dynamicId fullName showNameToCounselor").lean();
      const dynamicMap = Object.fromEntries(students.map((s) => [String(s._id), s.dynamicId]));
      const studentMap = Object.fromEntries(students.map((s) => [String(s._id), s]));

      appointments = appointments.map((appointment) => ({
        ...appointment.toObject(),
        counselorName: counselorMap[String(appointment.counselorId)] || null,
        referredByName: appointment.referredById ? counselorMap[String(appointment.referredById)] || null : null,
        studentDynamicId: getDailyDynamicId(dynamicMap[String(appointment.studentId)]) || null,
        studentName: studentMap[String(appointment.studentId)]?.showNameToCounselor
          ? studentMap[String(appointment.studentId)].fullName
          : null,
      }));
    }

    res.json(appointments);
  } catch (error) {
    console.error("Error in getAppointments:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { counselorId, type, date, time, concern, waitIfBusy = false } = req.body;
    if (typeof concern !== 'string' || concern.length > 4000) {
      return res.status(400).json({ error: "Concern must be text up to 4000 characters" });
    }
    const normalizedConcern = concern.trim();
    if (type === 'Face-To-Face' && !normalizedConcern) {
      return res.status(400).json({ error: "A concern is required for face-to-face sessions" });
    }

    if (type === 'Chat' && req.user.constructor.modelName === 'User') {
      const openChat = await Appointment.findOne({
        studentId: req.user._id,
        type: 'Chat',
        status: { $in: OPEN_CHAT_STATUSES },
      }).sort({ createdAt: -1 }).lean();
      if (openChat) {
        const counselor = await Counselor.findById(openChat.counselorId).select('fullName').lean();
        const counselorName = counselor?.fullName || 'your counselor';
        return res.status(409).json({
          code: 'STUDENT_CHAT_SESSION_EXISTS',
          counselorName,
          error: `You already have an active/open session with counselor ${counselorName}. If you want to change your counselor, you can ask/request your counselor to refer you to your chosen counselor.`,
        });
      }
    }

    const busySession = type === 'Chat'
      ? await findOverlappingF2F(counselorId, date, time)
      : null;
    if (busySession && !waitIfBusy) {
      return res.status(409).json({
        code: 'COUNSELOR_BUSY',
        error: 'Counselor is busy with a face-to-face session at this time',
      });
    }

    if (type === 'Face-To-Face') {
      const existingF2F = await Appointment.findOne({
        counselorId,
        type: 'Face-To-Face',
        date,
        time,
        status: { $in: ['pending', 'confirmed', 'active'] },
      });
      if (existingF2F) {
        return res.status(409).json({
          error: "Counselor already has a Face-To-Face session booked on this date and time",
          conflict: existingF2F,
        });
      }
    }

    const analysis = await analyzeCrisisAI(normalizedConcern);
    const concernRisk = mapConcernRisk(analysis.severity?.level, normalizedConcern);
    const appointment = new Appointment({
      studentId: req.user._id,
      counselorId,
      type,
      date,
      time,
      concern: normalizedConcern,
      concernRisk,
    });
    await appointment.save();

    if (type === 'Face-To-Face') {
      await takeSlot(counselorId, date, time);
    } else if (busySession) {
      await sendBusyRiskAlert({ counselorId, concernRisk, date, time });
    }

    const io = getIO();
    if (io) {
      getReceiverSocketIds(String(counselorId)).forEach(socketId => {
        io.to(socketId).emit("appointment:updated", appointment);
      });
      getReceiverSocketIds(String(req.user._id)).forEach(socketId => {
        io.to(socketId).emit("appointment:updated", appointment);
      });
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error in createAppointment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    const isCounselor = req.user.constructor.modelName === "Counselor";
    if (!isCounselor && SUMMARY_STATUSES.includes(req.body.status)) {
      return res.status(403).json({ error: "Only the assigned counselor can end a session" });
    }
    const touchesOwnership = Boolean(req.body.status || req.body.actionTaken || req.body.counselorId);
    if (isCounselor && touchesOwnership) {
      if (String(appointment.counselorId) !== String(req.user._id)) {
        return res.status(403).json({ error: "Not your appointment" });
      }
    }
    // Action taken / referrals are counselor decisions; students cannot set them.
    if (!isCounselor && (req.body.actionTaken || req.body.counselorId)) {
      return res.status(403).json({ error: "Only counselors can set the action taken" });
    }

    const previousCounselorId = appointment.counselorId;
    const reassigning = req.body.counselorId !== undefined
      && String(req.body.counselorId) !== String(previousCounselorId);
    if (reassigning) {
      const target = await Counselor.findById(req.body.counselorId).select("_id");
      if (!target) return res.status(404).json({ error: "Referred counselor not found" });
      appointment.referredById = previousCounselorId;
    }

    if ((req.body.status === 'on-going' || req.body.status === 'active') && appointment.status !== 'on-going' && appointment.status !== 'active') {
      appointment.startedAt = new Date();
    }
    const shouldGenerateSummary = isCounselor
      && SUMMARY_STATUSES.includes(req.body.status)
      && !SUMMARY_STATUSES.includes(appointment.status);
    if ((req.body.status === 'ended' || req.body.status === 'completed') && appointment.status !== 'ended' && appointment.status !== 'completed') {
      appointment.endedAt = new Date();
    }

    const updates = { ...req.body };
    delete updates.concernRisk;
    delete updates.waitIfBusy;
    delete updates.referredById;
    Object.assign(appointment, updates);
    await appointment.save();

    if (reassigning) {
      // The F2F slot held by the referring counselor is released and the same
      // slot is claimed under the referred counselor (takeSlot no-ops when
      // they didn't publish one at that time).
      if (appointment.type === 'Face-To-Face') {
        await freeSlot(previousCounselorId, appointment.date, appointment.time);
        await takeSlot(appointment.counselorId, appointment.date, appointment.time);
      }
    }

    if (req.body.status && FREED_STATUSES.includes(req.body.status) && appointment.type === 'Face-To-Face') {
      await freeSlot(appointment.counselorId, appointment.date, appointment.time);
    }

    if (shouldGenerateSummary) {
      try {
        // Generate before the Chat transcript purge below; F2F notes use the
        // recorded concern because those sessions have no stored transcript.
        await createSessionSummary(appointment);
      } catch (summaryError) {
        console.error("Error creating session summary:", summaryError.message);
      }
    }

    if (req.body.status === 'completed' && appointment.type === 'Chat') {
      // Session content is per-session: purge chat messages and voice-call
      // logs together when the session completes.
      await Message.deleteMany({ appointmentId: appointment._id });
      await CallLog.deleteMany({ appointmentId: appointment._id });
      // Sweep stray unscoped call logs between this pair (e.g. logged before
      // the appointmentId stamping existed) so they can't leak into the next
      // session's fresh chat view.
      await CallLog.deleteMany({
        appointmentId: { $exists: false },
        $or: [
          { callerId: appointment.studentId, receiverId: appointment.counselorId },
          { callerId: appointment.counselorId, receiverId: appointment.studentId },
        ],
      });
    }

    if (req.body.status === 'active' && appointment.type === 'Chat') {
      // A new session is starting: clear any pre-session stray call logs
      // between this pair so the fresh chat view starts empty.
      await CallLog.deleteMany({
        appointmentId: { $exists: false },
        $or: [
          { callerId: appointment.studentId, receiverId: appointment.counselorId },
          { callerId: appointment.counselorId, receiverId: appointment.studentId },
        ],
      });
    }

    const io = getIO();
    if (io) {
      getReceiverSocketIds(String(appointment.studentId)).forEach(socketId => {
        io.to(socketId).emit("appointment:updated", appointment);
      });
      getReceiverSocketIds(String(appointment.counselorId)).forEach(socketId => {
        io.to(socketId).emit("appointment:updated", appointment);
      });
      if (reassigning) {
        getReceiverSocketIds(String(previousCounselorId)).forEach(socketId => {
          io.to(socketId).emit("appointment:updated", appointment);
        });
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error in updateAppointment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSessionSummary = async (req, res) => {
  try {
    const result = await findOwnedCounselorAppointment(req);
    if (result.error) return res.status(result.status).json({ error: result.error });

    const summary = await SessionSummary.findOne({ appointmentId: result.appointment._id }).lean();
    if (!summary) return res.status(404).json({ error: "Session summary not found" });
    res.json({
      ...(await serializeSessionSummary(summary, result.appointment)),
      summary: stripSummaryMarkdown(summary.summary),
    });
  } catch (error) {
    console.error("Error in getSessionSummary:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const generateSessionSummaryForAppointment = async (req, res) => {
  try {
    const result = await findOwnedCounselorAppointment(req);
    if (result.error) return res.status(result.status).json({ error: result.error });
    if (!SUMMARY_STATUSES.includes(result.appointment.status)) {
      return res.status(400).json({ error: "A summary is available after the session ends" });
    }

    const summary = await createSessionSummary(result.appointment);
    res.json(await serializeSessionSummary(summary, result.appointment));
  } catch (error) {
    console.error("Error generating session summary:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSessionSummary = async (req, res) => {
  try {
    const result = await findOwnedCounselorAppointment(req);
    if (result.error) return res.status(result.status).json({ error: result.error });
    if (!SUMMARY_STATUSES.includes(result.appointment.status)) {
      return res.status(400).json({ error: "A summary can be edited after the session ends" });
    }

    const summaryText = typeof req.body.summary === "string" ? stripSummaryMarkdown(req.body.summary) : "";
    if (!summaryText || summaryText.length > MAX_SUMMARY_LENGTH) {
      return res.status(400).json({ error: "Summary must be between 1 and 12000 characters" });
    }

    const summary = await SessionSummary.findOneAndUpdate(
      { appointmentId: result.appointment._id },
      {
        $set: {
          counselorId: result.appointment.counselorId,
          studentId: result.appointment.studentId,
          summary: summaryText,
          editedAt: new Date(),
        },
        $setOnInsert: { appointmentId: result.appointment._id, generatedByAi: false },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json(await serializeSessionSummary(summary, result.appointment));
  } catch (error) {
    console.error("Error updating session summary:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCounselors = async (req, res) => {
  try {
    // Referral picker: every counselor except the one asking.
    const counselors = await Counselor.find({ _id: { $ne: req.user._id } })
      .select("fullName _id")
      .sort({ fullName: 1 })
      .lean();
    res.json(counselors);
  } catch (error) {
    console.error("Error in getCounselors:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getActiveAppointment = async (req, res) => {
  try {
    const { studentId } = req.params;
    // The peer's id is in the URL regardless of who is asking: students pass
    // their counselor's id, counselors pass the student's id.
    const isStudent = req.user.constructor.modelName === "User";
    const appointment = await Appointment.findOne({
      [isStudent ? "studentId" : "counselorId"]: req.user._id,
      [isStudent ? "counselorId" : "studentId"]: Number(studentId),
      type: "Chat",
      status: { $in: ["active", "confirmed", "on-going"] },
    });
    if (!appointment) return res.status(404).json({ error: "No active appointment found" });
    res.json(appointment);
  } catch (error) {
    console.error("Error in getActiveAppointment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    // Session-scoped content would be orphaned by the hard delete.
    await CallLog.deleteMany({ appointmentId: appointment._id });
    await SessionSummary.deleteOne({ appointmentId: appointment._id });
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Error in deleteAppointment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearAllRequests = async (req, res) => {
  try {
    const result = await Appointment.updateMany(
      { counselorId: req.user._id, counselorArchived: { $ne: true } },
      { $set: { counselorArchived: true } }
    );
    const io = getIO();
    if (io) {
      getReceiverSocketIds(String(req.user._id)).forEach((socketId) => {
        io.to(socketId).emit("appointment:updated", { cleared: true });
      });
    }
    res.json({ message: `Cleared ${result.modifiedCount} request(s)` });
  } catch (error) {
    console.error("Error in clearAllRequests:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const archivePastSessions = async (req, res) => {
  try {
    const result = await Appointment.updateMany(
      {
        studentId: req.user._id,
        status: { $in: ["completed", "cancelled", "declined", "ended"] },
      },
      { $set: { studentArchived: true } }
    );
    res.json({ message: `Archived ${result.modifiedCount} session(s)` });
  } catch (error) {
    console.error("Error in archivePastSessions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
