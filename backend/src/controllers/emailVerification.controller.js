// Email verification for legacy unverified accounts.
import crypto from "node:crypto";
import User from "../models/user.model.js";
import EmailVerification from "../models/emailVerification.model.js";
import { sendMail, verificationEmailTemplate } from "../lib/mailer.js";
import { maskEmail, assertIpBudget } from "./passwordReset.controller.js";

const VERIFY_TTL_HOURS = 24;
const VERIFY_TTL_MS = VERIFY_TTL_HOURS * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const GENERIC_RESEND_MESSAGE =
    "If that email has a pending verification, a new link is on its way. Links expire in 24 hours.";

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");

// Set VERIFY_BASE_URL/API_URL in production when the API has a public domain.
// Otherwise use the public host forwarded by the reverse proxy.
const publicApiBase = (req) => {
    const configured = process.env.VERIFY_BASE_URL || process.env.API_URL;
    if (configured) return configured.replace(/\/$/, "");
    const protocol = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0].trim();
    const host = String(req.headers["x-forwarded-host"] || req.get("host")).split(",")[0].trim();
    return `${protocol}://${host}`.replace(/\/$/, "");
};

const publicAppBase = (req) => {
    const configured = process.env.APP_URL;
    if (configured) return configured.replace(/\/$/, "");
    const origin = req.get("origin");
    if (origin) return origin.replace(/\/$/, "");
    const referer = req.get("referer");
    try {
        return referer ? new URL(referer).origin : "";
    } catch {
        return "";
    }
};

async function issueLink(email, user, req) {
    const now = Date.now();
    const token = crypto.randomBytes(32).toString("hex");
    await EmailVerification.findOneAndUpdate(
        { email },
        {
            email,
            userId: user._id,
            appUrl: publicAppBase(req),
            hashedToken: hashToken(token),
            expiresAt: new Date(now + VERIFY_TTL_MS),
            nextResendAt: new Date(now + RESEND_COOLDOWN_MS),
        },
        { upsert: true, new: true }
    );
    return sendMail({
        to: email,
        subject: "Verify your SafeSpace account",
        html: verificationEmailTemplate({
            fullName: user.fullName,
            verifyUrl: `${publicApiBase(req)}/api/auth/verify-email?token=${token}`,
            hours: VERIFY_TTL_HOURS,
        }),
        text: `Hi ${user.fullName || "there"}, verify your SafeSpace account within ${VERIFY_TTL_HOURS} hours: ${publicApiBase(req)}/api/auth/verify-email?token=${token}`,
    });
}

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
            const delivery = await issueLink(cleanEmail, user, req);
            if (!delivery.delivered) {
                return res.status(503).json({ message: "The verification email could not be sent. Please try again." });
            }
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
const verifyPage = ({ ok, message, appUrl = "" }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ok ? "Email verified" : "Verification failed"} — SafeSpace</title></head>
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:8vh auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">
<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f766e;letter-spacing:.06em;">SAFESPACE | UST-LEGAZPI</p>
<h1 style="margin:0 0 12px;font-size:22px;color:#111827;">${ok ? "Email verified 🎉" : "Link didn't work"}</h1>
<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#374151;">${message}</p>
${appUrl ? `<a href="${appUrl}/login" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-size:14px;font-weight:700;">Back to sign in</a>` : ""}
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
            return fail("This account no longer exists. Please contact support.");
        }

        user.emailVerified = true;
        await user.save();

        // Single use — burn the link.
        await EmailVerification.deleteOne({ _id: doc._id });

        return res.status(200).send(verifyPage({
            ok: true,
            appUrl: doc.appUrl,
            message: `Thanks, ${(user.fullName || "there").split(" ")[0]} — your university email is confirmed and your account is ready.`,
        }));
    } catch (error) {
        console.log("Error in verifyEmail controller: ", error.message);
        return fail("Something went wrong. Request a new link from the sign-in page.");
    }
};
