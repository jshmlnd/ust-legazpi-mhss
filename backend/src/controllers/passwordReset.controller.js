// ── Password reset (email OTP) ──
//
// Flow: user submits Student ID or Counselor ID → a 6-digit OTP is emailed to
// the account's email → code + new password complete the reset. Codes are
// stored hashed (like passwords), are single-use, and expire in 10 minutes.
//
// ponytail: the forgot-password response is intentionally generic and
// per-IP rate-limited, so the endpoint can't be used to enumerate registered
// accounts or flood inboxes; the only hint returned is a masked email for UX.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Otp from "../models/passwordResetOtp.model.js";
import { sendMail, otpEmailTemplate, passwordChangedEmailTemplate } from "../lib/mailer.js";

const OTP_TTL_MINUTES = 10;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const GENERIC_MESSAGE =
    "If that ID is registered, a one-time code has been sent to the email on file. The code expires in 10 minutes.";

// ── Account resolution (shared) ──
// Same lookup order as login: exact ID match first, then numeric _id.
// Returns { account, modelName } or { account: null, modelName: null } —
// never throws for unknown IDs.
async function findAccount(idOrId) {
    const id = String(idOrId).trim();

    let account = await User.findOne({ studentId: id });
    if (!account && !isNaN(Number(id))) account = await User.findById(Number(id));
    if (account) return { account, modelName: "User" };

    let counselor = await Counselor.findOne({ counselorId: id });
    if (!counselor && !isNaN(Number(id))) counselor = await Counselor.findById(Number(id));
    if (counselor) return { account: counselor, modelName: "Counselor" };

    return { account: null, modelName: null };
}

// Per-IP limiter for the forgot-password endpoint: 8 requests / 15 min is
// plenty for a human mistyping their ID, and stops inbox-bombing via repeat
// submits. In-memory per-process, same trade-off as the 2FA attempt budget in
// auth.controller.js.
const ipAttempts = new Map();
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_REQUESTS = 8;

function assertIpBudget(req) {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = ipAttempts.get(key);
    if (!entry || now > entry.resetAt) {
        ipAttempts.set(key, { count: 1, resetAt: now + IP_WINDOW_MS });
        return;
    }
    entry.count += 1;
    if (entry.count > IP_MAX_REQUESTS) {
        const secs = Math.ceil((entry.resetAt - now) / 1000);
        const err = new Error(`Too many reset requests. Try again in ${secs}s.`);
        err.statusCode = 429;
        throw err;
    }
}

const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

// Brute-force guard for code entry (verify + reset). Per-account, in-memory —
// same trade-off as the 2FA budget in auth.controller.js. ponytail: 5 wrong
// entries per 10-minute code lifetime caps online guessing at ~5/10⁶ per code
// without locking a legitimate user out past expiry (a new code = new budget).
const codeAttempts = new Map(); // key: `${modelName}:${userId}` → { count, resetAt }
const CODE_MAX_ATTEMPTS = 5;
const CODE_WINDOW_MS = 10 * 60 * 1000;

function assertResetBudget(account, modelName) {
    const key = `${modelName}:${account._id}`;
    const now = Date.now();
    const entry = codeAttempts.get(key);
    if (!entry || now > entry.resetAt) {
        codeAttempts.set(key, { count: 0, resetAt: now + CODE_WINDOW_MS });
        return;
    }
    if (entry.count >= CODE_MAX_ATTEMPTS) {
        const secs = Math.ceil((entry.resetAt - now) / 1000);
        const err = new Error(`Too many incorrect codes. Request a new one in ${secs}s.`);
        err.statusCode = 429;
        throw err;
    }
}

function noteResetFailure(account, modelName) {
    const key = `${modelName}:${account._id}`;
    const entry = codeAttempts.get(key);
    if (entry) entry.count += 1;
}

function clearResetBudget(account, modelName) {
    codeAttempts.delete(`${modelName}:${account._id}`);
}

// jdoe@ust-legazpi.edu.ph → j***@ust-legazpi.edu.ph
export const maskEmail = (email) => {
    if (!email) return "your university email";
    const [local, domain] = String(email).split("@");
    if (!domain) return "your university email";
    return `${local.slice(0, 1)}***@${domain}`;
};

// POST /api/auth/forgot-password  { studentId }   (accepts counselor IDs too)
export const forgotPassword = async (req, res) => {
    try {
        assertIpBudget(req);

        const { studentId } = req.body;
        if (!studentId || !String(studentId).trim()) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        const { account, modelName } = await findAccount(studentId);

        if (account) {
            const key = `${modelName}:${account._id}`;
            const existing = await Otp.findOne({ key });
            const now = Date.now();
            if (existing && existing.nextResendAt && existing.nextResendAt.getTime() > now) {
                // Treat like success (no user enumeration), but skip the resend.
                return res.status(200).json({
                    message: GENERIC_MESSAGE,
                    maskedEmail: maskEmail(account.email),
                    retryAfterSecs: Math.ceil((existing.nextResendAt.getTime() - now) / 1000),
                });
            }

            const otp = generateOtp();
            await Otp.findOneAndUpdate(
                { key },
                {
                    key,
                    hashedCode: hashCode(otp),
                    expiresAt: new Date(now + OTP_TTL_MS),
                    nextResendAt: new Date(now + OTP_RESEND_COOLDOWN_MS),
                },
                { upsert: true, new: true }
            );

            // Fire-and-optimistic: a Mailtrap hiccup logs but never 500s the
            // request — the user just wouldn't receive the code.
            sendMail({
                to: account.email,
                subject: "Your SafeSpace password reset code",
                html: otpEmailTemplate({ fullName: account.fullName, otp, minutes: OTP_TTL_MINUTES }),
                text: `Your SafeSpace password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
            });
        }

        // Deliberately identical shape for unknown IDs (no account probing).
        return res.status(200).json({
            message: GENERIC_MESSAGE,
            maskedEmail: account ? maskEmail(account.email) : undefined,
        });
    } catch (error) {
        console.log("Error in forgotPassword controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};

// POST /api/auth/verify-reset-code  { studentId, code }
// Pre-checks the emailed code WITHOUT consuming it, so the UI can gate the
// new-password form behind a verified code. Shares the per-account attempt
// budget with resetPassword — failed verifies count against the same code.
export const verifyResetCode = async (req, res) => {
    try {
        const { studentId, code } = req.body;
        if (!studentId || !code || !/^\d{6}$/.test(String(code))) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        const { account, modelName } = await findAccount(studentId);
        // Identical error for unknown IDs and bad codes (no enumeration).
        if (!account) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        assertResetBudget(account, modelName);

        const otpDoc = await Otp.findOne({ key: `${modelName}:${account._id}` });
        if (!otpDoc || otpDoc.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        const expected = Buffer.from(otpDoc.hashedCode, "hex");
        const provided = Buffer.from(hashCode(code), "hex");
        const ok = expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
        if (!ok) {
            noteResetFailure(account, modelName);
            return res.status(400).json({ message: "Incorrect code. Check the email and try again." });
        }
        clearResetBudget(account, modelName);

        return res.status(200).json({ verified: true, maskedEmail: maskEmail(account.email) });
    } catch (error) {
        console.log("Error in verifyResetCode controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};

// POST /api/auth/reset-password  { studentId, code, newPassword }
export const resetPassword = async (req, res) => {
    try {
        const { studentId, code, newPassword } = req.body;

        if (!studentId || !code || !newPassword) {
            return res.status(400).json({ message: "Student ID, code and new password are required" });
        }
        if (!/^\d{6}$/.test(String(code))) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }
        if (String(newPassword).length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters" });
        }

        const { account, modelName } = await findAccount(studentId);
        // Identical error for unknown IDs and bad codes (no enumeration).
        if (!account) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        assertResetBudget(account, modelName);

        const otpDoc = await Otp.findOne({ key: `${modelName}:${account._id}` });
        if (!otpDoc || otpDoc.expiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired code" });
        }

        const expected = Buffer.from(otpDoc.hashedCode, "hex");
        const provided = Buffer.from(hashCode(code), "hex");
        const ok = expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
        if (!ok) {
            noteResetFailure(account, modelName);
            return res.status(400).json({ message: "Incorrect code. Check the email and try again." });
        }
        clearResetBudget(account, modelName);

        const salt = await bcrypt.genSalt(10);
        account.password = await bcrypt.hash(newPassword, salt);
        await account.save();

        // Single use — burn the code and any cooldown state with it.
        await Otp.deleteOne({ _id: otpDoc._id });

        // Security confirmation: "Did you change your password?" (fire-and-forget).
        sendMail({
            to: account.email,
            subject: "Did you change your password?",
            html: passwordChangedEmailTemplate({
                fullName: account.fullName,
                when: new Intl.DateTimeFormat("en-PH", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date()),
            }),
        });

        return res.status(200).json({ message: "Password reset successful. You can now sign in with your new password." });
    } catch (error) {
        console.log("Error in resetPassword controller: ", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};
