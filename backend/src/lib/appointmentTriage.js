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

export const overlapsAppointment = (appointment, date, time) => {
  if (appointment.date !== date) return false;
  const start = timeToMinutes(appointment.time);
  const requested = timeToMinutes(time);
  if (start === null || requested === null) return false;
  const duration = Number.parseInt(appointment.duration, 10) || 45;
  return requested >= start && requested < start + duration;
};

export const mapConcernRisk = (severity) => ({
  none: "Minimal",
  low: "Low",
  medium: "High",
  high: "Urgent",
  critical: "Urgent",
})[severity] || "Minimal";
