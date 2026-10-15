import mongoose from "mongoose";

// Self-signup email verification tokens (hashed at rest). One doc per email
// so requesting a new link invalidates the previous one.
const emailVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    userId: { type: Number, required: true },
    appUrl: { type: String, default: '' },
    hashedToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    // Cooldown until the next link can be requested.
    nextResendAt: { type: Date, default: 0 },
}, { timestamps: true });

// MongoDB TTL index deletes the doc automatically after expiry. Safe to wipe
// (it only holds pending verification tokens), same pattern as the OTP model.
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerification = mongoose.model("EmailVerification", emailVerificationSchema);

export default EmailVerification;
