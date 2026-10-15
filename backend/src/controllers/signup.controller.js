// ── Student self-signup with email verification ──
//
// Flow: student submits the same profile fields the admin registration uses,
// restricted to @ust-legazpi.edu.ph emails → account is created UNVERIFIED
// (no session is issued) → a signed link is emailed → clicking it flips
// emailVerified and the student can sign in. Login rejects unverified
// students (see auth.controller.js) until then.
//
// ponytail: tokens are random 256-bit hex stored hashed, single-use, 24h TTL
// with a TTL index; resend has a 60s cooldown; per-IP budgets mirror the
// forgot-password endpoint so this can't be used to flood inboxes.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import EmailVerification from "../models/emailVerification.model.js";
import { sendMail, verificationEmailTemplate } from "../lib/mailer.js";
import { maskEmail, assertIpBudget } from "./passwordReset.controller.js";

export const STUDENT_EMAIL_DOMAIN = "ust-legazpi.edu.ph";
const VERIFY_TTL_HOURS = 24;
const VERIFY_TTL_MS = VERIFY_TTL_HOURS * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const GENERIC_RESEND_MESSAGE =
    "If that email has a pending verification, a new link is on its way. Links expire in 24 hours.";

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

// The link must hit the API origin (dev backend is :5001, not the :5173 app).
const apiBase = () =>
    (process.env.API_URL || process.env.APP_URL || "http://localhost:5001").replace(/\/$/, "");
const appBase = () =>
    (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

const isStudentEmail = (email) => String(email).trim().toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`);

async function issueLink(email, user) {
    const now = Date.now();
    const token = crypto.randomBytes(32).toString("hex");
    await EmailVerification.findOneAndUpdate(
        { email },
        {
            email,
            userId: user._id,
            hashedToken: hashToken(token),
            expiresAt: new Date(now + VERIFY_TTL_MS),
            nextResendAt: new Date(now + RESEND_COOLDOWN_MS),
        },
        { upsert: true, new: true }
    );
    sendMail({
        to: email,
        subject: "Verify your SafeSpace account",
        html: verificationEmailTemplate({
            fullName: user.fullName,
            verifyUrl: `${apiBase()}/api/auth/verify-email?token=${token}`,
            hours: VERIFY_TTL_HOURS,
        }),
        text: `Hi ${user.fullName || "there"}, verify your SafeSpace account within ${VERIFY_TTL_HOURS} hours: ${apiBase()}/api/auth/verify-email?token=${token}`,
    });
}

// POST /api/auth/signup  { studentId, password, fullName, email, phone, department, program }
export const signup = async (req, res) => {
    try {
        assertIpBudget(req);

        const { studentId, password, fullName, email, phone, department, program } = req.body;
        if (!studentId || !password || !fullName || !email || !department || !program) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        const id = String(studentId).trim();
        if (id.length !== 7) {
            return res.status(400).json({ message: "Student ID must be exactly 7 characters" });
        }
        if (String(password).length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long" });
        }
        const cleanEmail = String(email).trim().toLowerCase();
        if (!isStudentEmail(cleanEmail)) {
            return res.status(400).json({ message: `Sign-up is limited to @${STUDENT_EMAIL_DOMAIN} email addresses` });
        }

        if (await User.findOne({ studentId: id })) {
            return res.status(400).json({ message: "This Student ID is already registered. Try signing in instead." });
        }
        if (await User.findOne({ email: cleanEmail })) {
            return res.status(400).json({ message: "This email is already registered. Try signing in instead." });
        }

        const salt = await bcrypt.genSalt(10);
        const newUser = new User({
            studentId: id,
            password: await bcrypt.hash(String(password), salt),
            fullName: String(fullName).trim(),
            email: cleanEmail,
            phone: phone ? String(phone).trim() : '',
            userType: "Student",
            department,
            program: String(program).trim(),
            emailVerified: false, // flipped by the emailed link, never here
        });
        await newUser.save();

        // Deliberately NO session cookie — the account can't sign in until verified.
        await issueLink(cleanEmail, newUser);

        return res.status(201).json({
            message: "Account created. Check your university email for the verification link.",
            maskedEmail: maskEmail(cleanEmail),
        });
    } catch (error) {
        console.log("Error in signup controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};

// POST /api/auth/resend-verification  { email }
// Generic response for verified/unknown emails (no account enumeration);
// unverified accounts get a fresh link honoring the resend cooldown.
export const resendVerification = async (req, res) => {
    try {
        assertIpBudget(req);

        const { email } = req.body;
        if (!email || !String(email).trim()) {
            return res.status(400).json({ message: "Email is required" });
        }
        const cleanEmail = String(email).trim().toLowerCase();

        const user = await User.findOne({ email: cleanEmail });
        if (user && user.emailVerified === false) {
            const now = Date.now();
            const existing = await EmailVerification.findOne({ email: cleanEmail });
            if (existing && existing.nextResendAt && existing.nextResendAt.getTime() > now) {
                return res.status(200).json({
                    message: GENERIC_RESEND_MESSAGE,
                    maskedEmail: maskEmail(cleanEmail),
                    retryAfterSecs: Math.ceil((existing.nextResendAt.getTime() - now) / 1000),
                });
            }
            await issueLink(cleanEmail, user);
            return res.status(200).json({ message: GENERIC_RESEND_MESSAGE, maskedEmail: maskEmail(cleanEmail) });
        }

        return res.status(200).json({ message: GENERIC_RESEND_MESSAGE });
    } catch (error) {
        console.log("Error in resendVerification controller: ", error.message);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Internal server error" });
    }
};

// Self-contained result page for the emailed link (opened by a plain browser
// GET, so HTML — not JSON — with a way back to sign in). ponytail: one tiny
// template here instead of a whole frontend route for a two-state page.
const verifyPage = ({ ok, message }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ok ? "Email verified" : "Verification failed"} — SafeSpace</title></head>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:8vh auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">
<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f766e;letter-spacing:.06em;">SAFESPACE | UST-LEGAZPI</p>
<h1 style="margin:0 0 12px;font-size:22px;color:#111827;">${ok ? "Email verified 🎉" : "Link didn't work"}</h1>
<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#374151;">${message}</p>
<a href="${appBase()}/login" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-size:14px;font-weight:700;">Back to sign in</a>
</div></body></html>`;

// GET /api/auth/verify-email?token=…  (clicked from the email)
export const verifyEmail = async (req, res) => {
    const fail = (message) => res.status(400).send(verifyPage({ ok: false, message }));
    try {
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            return fail("This verification link is invalid. Request a new one from the sign-in page.");
        }

        const doc = await EmailVerification.findOne({ hashedToken: hashToken(token) });
        if (!doc || doc.expiresAt.getTime() < Date.now()) {
            return fail("This verification link is invalid or has expired. Request a new one from the sign-in page.");
        }

        const user = await User.findById(doc.userId);
        if (!user) {
            await EmailVerification.deleteOne({ _id: doc._id });
            return fail("This account no longer exists. Please sign up again.");
        }

        user.emailVerified = true;
        await user.save();

        // Single use — burn the link.
        await EmailVerification.deleteOne({ _id: doc._id });

        return res.status(200).send(verifyPage({
            ok: true,
            message: `Thanks, ${(user.fullName || "there").split(" ")[0]} — your university email is confirmed and your account is ready.`,
        }));
    } catch (error) {
        console.log("Error in verifyEmail controller: ", error.message);
        return fail("Something went wrong. Request a new link from the sign-in page.");
    }
};
