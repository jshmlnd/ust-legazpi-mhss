import test from "node:test";
import assert from "node:assert/strict";
import { faceToFaceClockAction } from "../src/controllers/appointment.controller.js";

const at = (h, m) => new Date(2026, 10, 20, h, m);
const f2f = (status) => ({ type: "Face-To-Face", status, date: "2026-11-20", time: "09:00 AM" });

test("face-to-face sessions start at their time and end one hour later", () => {
  assert.equal(faceToFaceClockAction(f2f("confirmed"), at(8, 59)), null);
  assert.equal(faceToFaceClockAction(f2f("confirmed"), at(9, 0)), "start");
  assert.equal(faceToFaceClockAction(f2f("active"), at(9, 30)), "start");
  assert.equal(faceToFaceClockAction(f2f("on-going"), at(9, 59)), null);
  assert.equal(faceToFaceClockAction(f2f("on-going"), at(10, 0)), "end");
  assert.equal(faceToFaceClockAction(f2f("paused"), at(10, 5)), "end");
  // Missed while the server was down: goes straight to ended.
  assert.equal(faceToFaceClockAction(f2f("confirmed"), at(11, 0)), "end");
  // Untouched: pending, finished, chats, unreadable times.
  assert.equal(faceToFaceClockAction(f2f("pending"), at(9, 30)), null);
  assert.equal(faceToFaceClockAction(f2f("ended"), at(11, 0)), null);
  assert.equal(faceToFaceClockAction({ ...f2f("active"), type: "Chat" }, at(9, 30)), null);
  assert.equal(faceToFaceClockAction({ ...f2f("active"), time: "soon" }, at(9, 30)), null);
});
