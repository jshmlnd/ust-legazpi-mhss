import Appointment from "../models/appointment.model.js";
import Counselor from "../models/counselor.model.js";
import User from "../models/user.model.js";
import { getIO, getReceiverSocketIds } from "../socket/socket.js";

export const getAppointments = async (req, res) => {
  try {
    const isCounselor = req.user.constructor.modelName === "Counselor";
    let appointments;
    if (isCounselor) {
      appointments = await Appointment.find({ counselorId: req.user._id }).sort({ date: -1, time: -1 });
    } else {
      appointments = await Appointment.find({ studentId: req.user._id }).sort({ date: -1, time: -1 });
    }

    const counselorIds = [...new Set(appointments.map((appointment) => String(appointment.counselorId)))];
    if (counselorIds.length > 0) {
      const counselors = await Counselor.find({ _id: { $in: counselorIds } }).select("fullName _id").lean();
      const counselorMap = Object.fromEntries(counselors.map((counselor) => [String(counselor._id), counselor.fullName]));

      appointments = appointments.map((appointment) => ({
        ...appointment.toObject(),
        counselorName: counselorMap[String(appointment.counselorId)] || null,
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
    const { counselorId, type, date, time, concern } = req.body;

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

    const appointment = new Appointment({
      studentId: req.user._id,
      counselorId,
      type,
      date,
      time,
      concern,
    });
    await appointment.save();

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

    if (req.body.status === 'active' && appointment.status !== 'active') {
      appointment.startedAt = new Date();
    }
    if (req.body.status === 'completed' && appointment.status !== 'completed') {
      appointment.endedAt = new Date();
    }

    Object.assign(appointment, req.body);
    await appointment.save();

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
    const appointment = await Appointment.findOne({
      studentId,
      counselorId: req.user._id,
      type: "Chat",
      status: { $in: ["active", "confirmed"] },
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
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Error in deleteAppointment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const archivePastSessions = async (req, res) => {
  try {
    const result = await Appointment.updateMany(
      {
        studentId: req.user._id,
        status: { $in: ["completed", "cancelled", "declined"] },
      },
      { $set: { status: "archived" } }
    );
    res.json({ message: `Archived ${result.modifiedCount} session(s)` });
  } catch (error) {
    console.error("Error in archivePastSessions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
