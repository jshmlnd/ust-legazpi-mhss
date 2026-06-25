import Appointment from "../models/appointment.model.js";
import User from "../models/user.model.js";

export const getAppointments = async (req, res) => {
  try {
    const isCounselor = req.user.constructor.modelName === "Counselor";
    let appointments;
    if (isCounselor) {
      appointments = await Appointment.find({ counselorId: req.user._id }).sort({ date: -1, time: -1 });
    } else {
      appointments = await Appointment.find({ studentId: req.user._id }).sort({ date: -1, time: -1 });
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
    const appointment = new Appointment({
      studentId: req.user._id,
      counselorId,
      type,
      date,
      time,
      concern,
    });
    await appointment.save();
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

    Object.assign(appointment, req.body);
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error("Error in updateAppointment:", error.message);
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
