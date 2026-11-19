import test from "node:test";
import assert from "node:assert/strict";
import { isStudentCancellable } from "../src/controllers/appointment.controller.js";

test("students can cancel pending requests and approved face-to-face sessions only", () => {
  const ok = [
    { type: "Chat", status: "pending" },
    { type: "Face-To-Face", status: "pending" },
    { type: "Face-To-Face", status: "confirmed" },
    { type: "Face-To-Face", status: "active" },
  ];
  const no = [
    { type: "Chat", status: "active" },
    { type: "Face-To-Face", status: "on-going" },
    { type: "Face-To-Face", status: "paused" },
    { type: "Chat", status: "completed" },
    { type: "Face-To-Face", status: "cancelled" },
    { type: "Face-To-Face", status: "declined" },
  ];
  for (const a of ok) assert.equal(isStudentCancellable(a), true, `${a.type} ${a.status}`);
  for (const a of no) assert.equal(isStudentCancellable(a), false, `${a.type} ${a.status}`);
});
