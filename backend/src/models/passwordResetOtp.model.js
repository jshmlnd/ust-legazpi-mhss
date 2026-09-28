import mongoose from "mongoose";

// Password-reset one-time codes (hashed at rest). One lookup key per user so
// a new request invalidates any previous pending code.
const otpSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // `${model}:${userId}`
    hashedCode: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    // Cooldown until the next code can be requested (OTP_RESEND_COOLDOWN_MS).
    nextResendAt: { type: Date, default: 0 },
}, { timestamps: true });

// MongoDB TTL index deletes the doc automatically after expiry. The hook is
// mandatory here because the collection is safe to wipe (it only holds
// pending reset codes), unlike most collections in this app.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
