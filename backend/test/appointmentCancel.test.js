import test from "node:test";
import assert from "node:assert/strict";
import Appointment from "../src/models/appointment.model.js";
import { isStudentCancellable, createAppointment, clearAllRequests } from "../src/controllers/appointment.controller.js";

const NOW = new Date(2026, 10, 19, 12, 0); // 2026-11-19 12:00 local
const future = { date: "2026-11-20", time: "09:00 AM" };
const past = { date: "2026-10-16", time: "09:00 AM" };
const earlierToday = { date: "2026-11-19", time: "11:30 AM" };

test("students can cancel pending requests and upcoming face-to-face sessions only", () => {
  const ok = [
    { type: "Chat", status: "pending", ...past },
    { type: "Face-To-Face", status: "pending", ...future },
    { type: "Face-To-Face", status: "confirmed", ...future },
    { type: "Face-To-Face", status: "active", ...future },
  ];
  const no = [
    { type: "Chat", status: "active", ...future },
    { type: "Face-To-Face", status: "on-going", ...future },
    { type: "Face-To-Face", status: "paused", ...future },
    { type: "Chat", status: "completed", ...future },
    { type: "Face-To-Face", status: "cancelled", ...future },
    { type: "Face-To-Face", status: "declined", ...future },
    { type: "Face-To-Face", status: "active", ...past },
    { type: "Face-To-Face", status: "pending", ...earlierToday },
    { type: "Face-To-Face", status: "active", date: "bad", time: "09:00 AM" },
  ];
  for (const a of ok) assert.equal(isStudentCancellable(a, NOW), true, `${a.type} ${a.status} ${a.date}`);
  for (const a of no) assert.equal(isStudentCancellable(a, NOW), false, `${a.type} ${a.status} ${a.date}`);
});

test("face-to-face booking rejects a slot whose time has passed", async () => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  const req = { user: { _id: 1, constructor: { modelName: "User" } }, body: { counselorId: 2, type: "Face-To-Face", date: "2026-10-16", time: "09:00 AM", concern: "need help" } };
  await createAppointment(req, res);
  assert.equal(res.code, 400);
  assert.match(res.body.error, /already passed/);
});

test("Clear All only archives finished requests", async (t) => {
  let filter;
  t.mock.method(Appointment, "updateMany", async (f) => { filter = f; return { modifiedCount: 0 }; });
  const res = { status() { return this; }, json() { return this; } };
  await clearAllRequests({ user: { _id: 5 } }, res);
  assert.equal(filter.counselorId, 5);
  assert.deepEqual([...filter.status.$in].sort(), ["cancelled", "completed", "declined", "ended"]);
});
