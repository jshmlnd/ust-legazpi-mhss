import { axiosInstance } from './axios';

const BANNER_KEY = 'checkin_banner_dismissed';
const DAY_MS = 24 * 3600e3;

const toDate = (appt) => {
  // Appointments: date 'YYYY-MM-DD' + time 'HH:MM AM/PM'.
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(appt.time || '');
  const [y, mo, d] = (appt.date || '').split('-').map(Number);
  if (!m || !y || !mo || !d) return null;
  let hour = Number(m[1]);
  const min = Number(m[2]);
  const pm = /pm/i.test(m[3]);
  if (pm && hour !== 12) hour += 12;
  if (!pm && hour === 12) hour = 0;
  return new Date(y, mo - 1, d, hour, min);
};

/**
 * Re-check-in banner rule: the most recent completed/ended session happened
 * 3–7 days ago and the student has no pending/confirmed/active appointment
 * with that counselor. Returns the appointment to reference, or null.
 */
export const getCheckInSuggestion = (appointments) => {
  const now = Date.now();
  const dismissedAt = Number(localStorage.getItem(BANNER_KEY) || 0);
  if (dismissedAt && now - dismissedAt < 3 * DAY_MS) return null; // stay dismissed 3 days

  const done = appointments
    .filter((a) => ['completed', 'ended'].includes(a.status))
    .map((a) => ({ ...a, _when: toDate(a)?.getTime() || new Date(a.endedAt || a.updatedAt || a.createdAt).getTime() }))
    .sort((a, b) => b._when - a._when);
  const last = done[0];
  if (!last) return null;

  const since = now - last._when;
  if (since < 3 * DAY_MS || since > 7 * DAY_MS) return null;

  const openWithSame = appointments.some(
    (a) =>
      String(a.counselorId) === String(last.counselorId) &&
      ['pending', 'confirmed', 'active', 'on-going', 'paused'].includes(a.status)
  );
  if (openWithSame) return null;
  return last;
};

export const dismissCheckInBanner = () => localStorage.setItem(BANNER_KEY, String(Date.now()));

/**
 * Real sessionReminders, in-app: on login/app open, find the student's next
 * confirmed/active appointment inside 24h and fire a system notification
 * (through the existing service worker). Also subscribes to Web Push when
 * permission is granted so background reminders can reach the device.
 */
export const checkUpcomingSession = async () => {
  try {
    const res = await axiosInstance.get('/appointments');
    const now = Date.now();
    const next = res.data
      .filter((a) => ['confirmed', 'active'].includes(a.status))
      .map((a) => ({ ...a, _when: toDate(a)?.getTime() }))
      .filter((a) => a._when && a._when > now - 3600e3) // started <1h ago still counts
      .sort((a, b) => a._when - b._when)[0];
    if (!next) return null;

    const mins = Math.round((next._when - now) / 60e3);
    if (mins <= 0) return next;

    const { showNotification } = await import('./notifications');
    const when = mins >= 60 ? `in ${Math.round(mins / 60)}h` : `in ${mins} min`;
    showNotification(
      'Upcoming session',
      `Your ${next.type === 'Chat' ? 'chat' : 'face-to-face'} session with ${next.counselorName || 'your counselor'} is ${when}.`,
      { url: next.type === 'Chat' ? '/messages' : '/sessions' }
    );
    return next;
  } catch {
    return null;
  }
};

/** Subscribe this browser to Web Push (for background reminders). */
export const subscribeToPush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    const { data } = await axiosInstance.get('/push/key');
    if (!data?.publicKey) return;

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    }
    await axiosInstance.post('/push/subscribe', sub.toJSON());
  } catch {
    /* push is best-effort */
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};
