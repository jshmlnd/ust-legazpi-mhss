import { analyzeCrisis } from "./crisisDetector.js";

const timeToMinutes = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minute > 59 || (period ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (period) hour = (hour % 12) + (period === "PM" ? 12 : 0);
  return hour * 60 + minute;
};

// Only finished requests may be archived; live ones must stay in the counselor's lists.
export const ARCHIVABLE_STATUSES = ["completed", "ended", "cancelled", "declined"];

// Counselor list filter: unarchived, plus anything still live even if an older
// "Clear All" archived it.
export const counselorVisible = { $or: [{ counselorArchived: { $ne: true } }, { status: { $nin: ARCHIVABLE_STATUSES } }] };

// Local start time of an appointment ("YYYY-MM-DD" + "09:00 AM"), or null when unparsable.
export const appointmentStart = (appointment) => {
  const minutes = timeToMinutes(appointment?.time);
  const [y, m, d] = String(appointment?.date || "").split("-").map(Number);
  if (minutes === null || !y || !m || !d) return null;
  return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
};

export const overlapsAppointment = (appointment, date, time) => {
  if (appointment.date !== date) return false;
  const start = timeToMinutes(appointment.time);
  const requested = timeToMinutes(time);
  if (start === null || requested === null) return false;
  const duration = Number.parseInt(appointment.duration, 10) || 45;
  return requested >= start && requested < start + duration;
};

const INTENSE_DEPRESSION = /\b(?:very|extremely|severely|deeply)\s+depress(?:ed|ion)\b|\b(?:severe|intense|persistent)\s+depression\b/i;
const RISK_ORDER = { Minimal: 0, Low: 1, High: 2, Urgent: 3 };

const riskForSeverity = (severity) => ({
  none: "Minimal",
  low: "Low",
  medium: "High",
  high: "Urgent",
  critical: "Urgent",
  Minimal: "Minimal",
  Low: "Low",
  High: "High",
  Urgent: "Urgent",
})[severity] || "Minimal";

export const mapConcernRisk = (severity, concern = "") => {
  let risk = riskForSeverity(severity);

  // The local detector is the safety floor when the remote model under-scores
  // an appointment concern, such as "I want to kill myself" as low.
  if (typeof concern === "string" && concern.trim()) {
    const fallbackRisk = riskForSeverity(analyzeCrisis(concern).severity?.level);
    if (RISK_ORDER[fallbackRisk] > RISK_ORDER[risk]) risk = fallbackRisk;
  }
  if (INTENSE_DEPRESSION.test(concern) && ['Minimal', 'Low'].includes(risk)) return "High";
  return risk;
};
