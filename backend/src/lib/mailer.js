// ── Email delivery (nodemailer + Mailtrap) ──
//
// Two supported transports, picked by which env vars are present:
//   1. Mailtrap HTTP API (default): MAILTRAP_API_TOKEN → send.api.mailtrap.io
//      via a custom nodemailer transport.
//   2. SMTP fallback: MAILTRAP_USER + MAILTRAP_PASS → sandbox.smtp.mailtrap.io.
//
// Mailtrap Sandbox traps every message so nothing reaches real inboxes —
// safe for development/testing. Point MAILTRAP_HOST at live.smtp.mailtrap.io
// (with live SMTP credentials) or a verified sender domain to go to prod.
//
// Env vars (backend/.env):
//   MAILTRAP_API_TOKEN  Mailtrap API token (Sending Domains → API tokens)
//   MAILTRAP_HOST       sandbox.smtp.mailtrap.io (SMTP fallback)
//   MAILTRAP_PORT       2525 (SMTP fallback)
//   MAILTRAP_USER/PASS  SMTP credentials (fallback)
//   MAIL_FROM           e.g. "SafeSpace OGT <no-reply@ust-legazpi.edu.ph>"
//
// ponytail: every send is fire-and-optimistic — delivery failures are logged
// and swallowed so a Mailtrap outage can never block a login, password
// change, or announcement from succeeding. The user-facing action already
// completed by the time the email is attempted.
import nodemailer from "nodemailer";

const BRAND = {
  name: "SafeSpace | UST-Legazpi ",
  footer:
    "University of Santo Tomas - Legazpi - Office of Guidance & Testing",
};

const API_ENDPOINT = "https://send.api.mailtrap.io/api/send";

/* ── Address helpers: accept "Name <a@b>" strings or {name,email} objects ── */

const extractAddress = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const m = /<([^>]+)>/.exec(value);
    return (m ? m[1] : value).trim();
  }
  if (Array.isArray(value)) return extractAddress(value[0]);
  return String(value.email || value.address || "").trim();
};

const extractName = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const m = /^\s*"?([^"<]+?)"?\s*</.exec(value);
  return m ? m[1].trim() : undefined;
};

/* ── Custom nodemailer transport backed by the Mailtrap HTTP API ── */

const createApiTransport = (token) => ({
  name: "mailtrap-api",
  version: 1,
  send: (mail, callback) => {
    const data = mail.data || {};
    const payload = {
      from: {
        email: extractAddress(data.from) || "no-reply@ust-legazpi.edu.ph",
        ...(extractName(data.from) ? { name: extractName(data.from) } : {}),
      },
      to: [{ email: extractAddress(data.to) }],
      subject: data.subject || "",
      html: data.html || undefined,
      text: data.text || undefined,
    };
    fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Api-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(json.errors) ? json.errors.join("; ") : JSON.stringify(json);
          return callback(new Error(`Mailtrap API ${res.status}: ${detail}`));
        }
        callback(null, { messageId: json.message_ids?.[0] });
      })
      .catch((err) => callback(err));
  },
});

let transporter = null;
let transportReady = false;

const getTransporter = () => {
  if (transporter) return transporter;
  if (process.env.MAILTRAP_API_TOKEN) {
    transporter = nodemailer.createTransport(createApiTransport(process.env.MAILTRAP_API_TOKEN));
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.MAILTRAP_PORT) || 2525,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  }
  return transporter;
};

const fromAddress = () => process.env.MAIL_FROM || "SafeSpace OGT <no-reply@ust-legazpi.edu.ph>";

/** Returns true if email credentials are configured; logs a clear warning once otherwise. */
export const isMailConfigured = () => {
  if (transportReady) return true;
  if (process.env.MAILTRAP_API_TOKEN || (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS)) {
    transportReady = true;
    return true;
  }
  console.warn("[mailer] MAILTRAP_API_TOKEN (or SMTP creds) not set — emails will be skipped");
  return false;
};

/** Fire-and-forget send; resolves to { delivered } and never rejects. */
export const sendMail = async ({ to, subject, html, text }) => {
  if (!isMailConfigured() || !to) return { delivered: false };
  try {
    const info = await getTransporter().sendMail({
      from: fromAddress(),
      to,
      subject,
      html,
      text: text || subject,
    });
    console.log(`[mailer] sent "${subject}" → ${Array.isArray(to) ? to.join(", ") : to}`);
    return { delivered: true, messageId: info?.messageId };
  } catch (error) {
    console.error(`[mailer] failed to send "${subject}":`, error.message);
    return { delivered: false };
  }
};

/* ── Shared HTML shell ── */

const layout = ({ heading, bodyHtml, footerNote }) => `
  <div style="margin:0;padding:24px;background-color:#f4f5f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
      <tr>
        <td style="padding:28px 32px 8px;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#0f766e;letter-spacing:0.06em;text-transform:uppercase;">
            ${BRAND.name}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 32px 28px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">${heading}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 28px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:12px;line-height:1.6;color:#6b7280;">${footerNote || ""}</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">${BRAND.footer}</p>
        </td>
      </tr>
    </table>
  </div>`;

const paragraph = (text) =>
  `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">${text}</p>`;

/* ── 1. Password-reset OTP ── */

export const otpEmailTemplate = ({ fullName, otp, minutes = 10 }) => {
  const firstName = (fullName || "there").split(" ")[0];
  const spaced = otp.split("").join(" ");
  return layout({
    heading: "Reset your password",
    bodyHtml: `
      ${paragraph(`Hi ${firstName},`)}
      ${paragraph(
        `We received a request to reset your SafeSpace password. Use the one-time code below to continue:`
      )}
      <div style="margin:20px 0;text-align:center;">
        <span style="display:inline-block;padding:14px 28px;border-radius:10px;background-color:#0f766e;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:8px;">
          ${spaced}
        </span>
      </div>
      ${paragraph(`This code expires in <strong>${minutes} minutes</strong> and can only be used once.`)}
      ${paragraph(
        `Didn't request a reset? You can safely ignore this email — your password stays unchanged.`
      )}
    `,
    footerNote: "If you keep receiving reset codes you didn't ask for, contact the Office of Guidance and Testing.",
  });
};

/* ── 2. "Did you change your password?" notification ── */

export const passwordChangedEmailTemplate = ({ fullName, when }) => {
  const firstName = (fullName || "there").split(" ")[0];
  return layout({
    heading: "Did you change your password?",
    bodyHtml: `
      ${paragraph(`Hi ${firstName},`)}
      ${paragraph(
        `The password for your SafeSpace account was just changed on <strong>${when}</strong>.`
      )}
      ${paragraph(
        `Was this you? If <strong>yes</strong> no action is needed — you can sign in with your new password.`
      )}
      ${paragraph(
        `If you <strong>didn't</strong> make this change, someone else may have accessed your account. Please reset your password immediately using "Forgot password?" on the sign-in page, and contact the Office of Guidance and Testing.`
      )}
    `,
  });
};

/* ── 3. Busy counselor high-risk alert ── */

export const busyRiskAlertEmailTemplate = ({ concernRisk, counselorName, date, time, reviewUrl }) => {
  const safe = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
  const risk = safe(concernRisk);
  const counselor = safe(counselorName || 'Counselor unavailable');

  return layout({
  heading: `${risk} risk session request`,
  bodyHtml: `
    ${paragraph(`A student requested an online session while the assigned counselor is in a face-to-face session.`)}
    <div style="margin:18px 0;padding:18px;border:1px solid #e5e7eb;border-left:4px solid ${concernRisk === 'Urgent' ? '#dc2626' : '#d97706'};border-radius:8px;background-color:#f9fafb;">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Assigned counselor</p>
      <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">${counselor}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#6b7280;">Risk level</td>
          <td style="font-size:13px;font-weight:700;color:#111827;text-align:right;">${risk}</td>
        </tr>
        <tr>
          <td style="padding-top:8px;font-size:13px;color:#6b7280;">Requested schedule</td>
          <td style="padding-top:8px;font-size:13px;font-weight:700;color:#111827;text-align:right;">${safe(date)} at ${safe(time)}</td>
        </tr>
      </table>
    </div>
    <div style="margin:22px 0 8px;text-align:center;">
      <a href="${safe(reviewUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background-color:#0f766e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Review Session Request</a>
    </div>
    ${paragraph(`Please review and coordinate the appropriate response as soon as possible.`)}
  `,
  footerNote: "This alert contains no student identity or concern details. Sign in to SafeSpace to review the request securely.",
  });
};

/* ── 4. Announcement newsletter (bulk) ── */

export const newsletterEmailTemplate = ({ title, body, author, when, appUrl }) => {
  const cta = appUrl
    ? `<a href="${appUrl}" style="color:#0f766e;font-weight:600;">Open SafeSpace →</a>`
    : "";
  return layout({
    heading: `Announcement: ${title}`,
    bodyHtml: `
      ${paragraph(`<strong>${author}</strong> posted a new announcement on ${when}:`)}
      <div style="margin:16px 0;padding:16px 18px;border-left:4px solid #0f766e;background-color:#f9fafb;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;white-space:pre-line;">${body}</p>
      </div>
      ${cta ? paragraph(`${cta} to read it together with counseling resources and your sessions.`) : ""}
    `,
    footerNote:
      "You are receiving this because you are a registered student of UST-Legazpi SafeSpace. Announcements also appear under OGT Updates.",
  });
};
