// ── Background appointment reminders (node-cron + Web Push) ──
//
// Schedules:
//   • T-24h and T-1h before a confirmed/active appointment
//   • Missed-chat nudge: a confirmed Chat session whose scheduled time has
//     passed by >30 min and never started — nudges both sides.
//
// Delivery uses the Web Push protocol (VAPID) so reminders reach users even
// with no tab open; the existing sw.js notificationclick routes the tap to
// the right page. When a user has no push subscription the reminder is
// skipped (the frontend in-app poll covers logged-in sessions).
//
// Reminder bookkeeping lives in-memory (Map): reminders are advisory, and
// rebuilding a Map on server start is simpler and safer than persisting a
// schedule that would need migrations. After a restart the cron re-evaluates
// upcoming appointments against the same rules; T-24h reminders for slots
// that already passed simply never re-fire.
import cron from "node-cron";
import webpush from "web-push";
import Appointment from "../models/appointment.model.js";
import Counselor from "../models/counselor.model.js";
import User from "../models/user.model.js";
import PushSubscription from "../models/pushSubscription.model.js";

let started = false;
// key: `${appointmentId}:${kind}` → true once sent this server lifetime
const sent = new Map();
// Keep the Map bounded; a week of reminders is plenty for one process.
const PRUNE_THRESHOLD = 2000;

const CRON_SCHEDULE = "*/5 * * * *"; // every 5 minutes
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:ogt@ust-legazpi.edu.ph";

function initPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[reminders] VAPID keys not set — push reminders disabled (in-app reminders still work)");
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
  return true;
}

async function pushToUser(userId, payload) {
  const subs = await PushSubscription.find({ userId });
  if (subs.length === 0) return;
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
      } catch (err) {
        // 404/410 = subscription expired; prune it so we stop trying.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    })
  );
}

function slotToDate(dateStr, timeStr) {
  // Appointments store date 'YYYY-MM-DD' + time like '02:30 PM' (12h, en-US).
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(timeStr || "");
  const [y, mo, d] = (dateStr || "").split("-").map(Number);
  if (!m || !y || !mo || !d) return null;
  let hour = Number(m[1]);
  const min = Number(m[2]);
  const pm = /pm/i.test(m[3]);
  if (pm && hour !== 12) hour += 12;
  if (!pm && hour === 12) hour = 0;
  return new Date(y, mo - 1, d, hour, min, 0, 0);
}

async function sendReminder(appointment, kind) {
  const when = kind === "t24h" ? "tomorrow" : "in 1 hour";
  const title = kind === "nudge" ? "Did we miss each other?" : "Upcoming session reminder";
  const base = {
    kind: "appointment-reminder",
    reminderKind: kind,
    appointmentId: appointment._id,
    url: appointment.type === "Chat" ? "/messages" : "/sessions",
  };

  let studentBody, counselorBody;
  if (kind === "nudge") {
    studentBody = `Your chat session with your counselor at ${appointment.time} didn't start. Still want to talk? Open a chat or rebook.`;
    counselorBody = `The chat session scheduled at ${appointment.time} never started. You can nudge the student or mark it completed.`;
  } else {
    studentBody = `Your ${appointment.type === "Chat" ? "chat" : "face-to-face"} session is ${when} at ${appointment.time}.`;
    counselorBody = `You have a ${appointment.type === "Chat" ? "chat" : "face-to-face"} session ${when} at ${appointment.time}.`;
  }

  await Promise.allSettled([
    pushToUser(appointment.studentId, { ...base, title, body: studentBody }),
    pushToUser(appointment.counselorId, { ...base, title, body: counselorBody }),
  ]);
}

async function tick() {
  try {
    const now = Date.now();
    const upcoming = await Appointment.find({
      status: { $in: ["confirmed", "active"] },
    }).lean();

    for (const appt of upcoming) {
      const when = slotToDate(appt.date, appt.time);
      if (!when) continue;
      const delta = when.getTime() - now;

      const fire = (kind) => {
        const key = `${appt._id}:${kind}`;
        if (sent.has(key)) return;
        sent.set(key, true);
        if (sent.size > PRUNE_THRESHOLD) {
          // Drop the oldest entries (Map preserves insertion order).
          for (const k of sent) {
            sent.delete(k);
            if (sent.size <= PRUNE_THRESHOLD / 2) break;
          }
        }
        sendReminder(appt, kind).catch((e) => console.warn("[reminders] send failed:", e.message));
      };

      // T-24h window: between 23.5h and 24.5h before (one cron tick wide).
      if (delta > 23.5 * 3600e3 && delta < 24.5 * 3600e3) fire("t24h");
      // T-1h window.
      if (delta > 55 * 60e3 && delta < 65 * 60e3) fire("t1h");
      // Missed-chat nudge: 30–120 min past scheduled start, never began.
      if (
        appt.type === "Chat" &&
        appt.status === "confirmed" &&
        delta < -30 * 60e3 &&
        delta > -120 * 60e3
      ) {
        fire("nudge");
      }
    }
  } catch (err) {
    console.error("[reminders] tick error:", err.message);
  }
}

export function startReminderScheduler() {
  if (started) return;
  started = true;
  const pushEnabled = initPush();
  // Run once at boot (catches reminders inside the first window), then every
  // 5 minutes. Startup tick is delayed so Mongo is connected first.
  setTimeout(tick, 15_000);
  cron.schedule(CRON_SCHEDULE, tick);
  console.log(`[reminders] scheduler running (${CRON_SCHEDULE}), push ${pushEnabled ? "enabled" : "disabled"}`);
}
