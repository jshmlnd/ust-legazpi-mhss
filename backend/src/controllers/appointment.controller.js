import Appointment from "../models/appointment.model.js";
import Counselor from "../models/counselor.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";
import AvailabilitySlot from "../models/availabilitySlot.model.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";
import { getDailyDynamicId } from "../lib/generateId.js";
import { analyzeCrisisAI } from "../lib/jevCrisis.js";
import { mapConcernRisk, overlapsAppointment } from "../lib/appointmentTriage.js";
import { busyRiskAlertEmailTemplate, sendMail } from "../lib/mailer.js";

const FREED_STATUSES = ['declined', 'cancelled', 'archived'];
const BUSY_F2F_STATUSES = ['confirmed', 'active', 'on-going', 'paused'];
const GUIDANCE_EMAIL = 'joshuaklein.malonda@gmail.com';

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

export const getAppointments = async (req, res) => {
  try {
    const isCounselor = req.user.constructor.modelName === "Counselor";
    let appointments;
    if (isCounselor) {
      appointments = await Appointment.find({ counselorId: req.user._id, counselorArchived: { $ne: true } }).sort({ date: -1, time: -1 });
    } else {
      appointments = await Appointment.find({ studentId: req.user._id, studentArchived: { $ne: true } }).sort({ date: -1, time: -1 });
    }

    const counselorIds = [...new Set(appointments.map((appointment) => String(appointment.counselorId)))];
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
    const concernRisk = mapConcernRisk(analysis.severity?.level);
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
    if (isCounselor && req.body.status) {
      if (String(appointment.counselorId) !== String(req.user._id)) {
        return res.status(403).json({ error: "Not your appointment" });
      }
    }

    if ((req.body.status === 'on-going' || req.body.status === 'active') && appointment.status !== 'on-going' && appointment.status !== 'active') {
      appointment.startedAt = new Date();
    }
    if ((req.body.status === 'ended' || req.body.status === 'completed') && appointment.status !== 'ended' && appointment.status !== 'completed') {
      appointment.endedAt = new Date();
    }

    const updates = { ...req.body };
    delete updates.concernRisk;
    delete updates.waitIfBusy;
    Object.assign(appointment, updates);
    await appointment.save();

    if (req.body.status && FREED_STATUSES.includes(req.body.status) && appointment.type === 'Face-To-Face') {
      await freeSlot(appointment.counselorId, appointment.date, appointment.time);
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
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error in updateAppointment:", error.message);
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
