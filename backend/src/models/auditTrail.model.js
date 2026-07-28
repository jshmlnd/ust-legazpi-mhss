import mongoose from "mongoose";

const auditTrailSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    counselorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Counselor",
      default: null,
    },
    type: {
      type: String,
      enum: ["crisis_detected", "identity_revealed"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["critical", "high", "medium", "low", "none"],
      default: "none",
    },
    crisisScore: {
      type: Number,
      default: 0,
    },
    messageText: {
      type: String,
      default: "",
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const AuditTrail = mongoose.model("AuditTrail", auditTrailSchema);

export default AuditTrail;
