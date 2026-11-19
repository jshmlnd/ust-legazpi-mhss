import mongoose from "mongoose";

const auditTrailSchema = new mongoose.Schema(
  {
    // Users and counselors have numeric _ids, not ObjectIds.
    studentId: {
      type: Number,
      ref: "User",
      required: true,
    },
    counselorId: {
      type: Number,
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

// One crisis entry per message, even when both chat clients report it at once.
auditTrailSchema.index(
  { messageId: 1, type: 1 },
  { unique: true, partialFilterExpression: { messageId: { $type: "objectId" } } },
);

const AuditTrail = mongoose.model("AuditTrail", auditTrailSchema);

export default AuditTrail;
