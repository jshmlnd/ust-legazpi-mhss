import mongoose from "mongoose";

const sessionSummarySchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
    unique: true,
  },
  counselorId: { type: Number, ref: "Counselor", required: true },
  studentId: { type: Number, ref: "User", required: true },
  summary: { type: String, required: true, trim: true, maxlength: 12000 },
  generatedByAi: { type: Boolean, default: true },
  generatedAt: { type: Date },
  editedAt: { type: Date },
}, { timestamps: true });

const SessionSummary = mongoose.model("SessionSummary", sessionSummarySchema);

export default SessionSummary;
