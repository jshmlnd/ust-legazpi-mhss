// Runs the face-to-face session clock every minute, so sessions start and end
// on time even when nobody has the app open.
import cron from "node-cron";
import { runFaceToFaceClock } from "../controllers/appointment.controller.js";

let started = false;

const tick = async () => {
  try {
    await runFaceToFaceClock();
  } catch (err) {
    console.error("[session-clock] tick error:", err.message);
  }
};

export function startSessionClock() {
  if (started) return;
  started = true;
  tick(); // catch up on anything that started or ended while the server was down
  cron.schedule("* * * * *", tick);
  console.log("[session-clock] running every minute");
}
