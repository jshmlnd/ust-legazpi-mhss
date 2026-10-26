import mongoose from "mongoose";
import { generateUniqueId } from "../lib/generateId.js";

const counselorSchema = new mongoose.Schema(
    {
        _id: {
            type: Number,
        },
        counselorId: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
        },
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: "",
        },
        profilePic: {
            type: String,
            default: "",
        },
        pin: {
            type: String,
            default: "",
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        // Encrypted TOTP secret (AES-256-GCM, see lib/totp.js) for Google
        // Authenticator; empty when the counselor has never enrolled TOTP.
        totpSecret: {
            type: String,
            default: '',
        },
        // Set once the TOTP secret is confirmed with a valid code; TOTP then
        // takes over as the account's second factor (replacing PIN 2FA).
        totpEnabled: {
            type: Boolean,
            default: false,
        },
        userType: {
            type: String,
            default: "Counselor",
        },
        // College the counselor is affiliated with (visual grouping on the
        // student-facing counselor list). Empty until an admin assigns one.
        department: {
            type: String,
            enum: ['', 'CEAFA', 'CHS', 'CBMA', 'CASE'],
            default: '',
        },
        // Account-level app preferences — same shape as User.preferences
        // (see lib/prefs.js SYNCED_PREFS on the frontend).
        preferences: {
            sessionReminders: { type: Boolean, default: true },
            messageNotifications: { type: Boolean, default: true },
        },

    },
    { timestamps: true, _id: false });

counselorSchema.pre("save", async function () {
  if (!this._id) {
    this._id = await generateUniqueId(mongoose.model("Counselor"));
  }
});

const Counselor = mongoose.model("Counselor", counselorSchema);

export default Counselor;
