import test from "node:test";
import assert from "node:assert/strict";
import Appointment from "../src/models/appointment.model.js";
import Counselor from "../src/models/counselor.model.js";
import { updateAppointment } from "../src/controllers/appointment.controller.js";

const counselorUser = { _id: 22, constructor: { modelName: "Counselor" } };
const pendingChat = () => ({ _id: "a2", type: "Chat", status: "pending", studentId: 11, counselorId: 22, save: async () => {} });
const call = async () => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await updateAppointment({ params: { id: "a2" }, user: counselorUser, body: { status: "active" } }, res);
  return res;
};

test("accepting a chat is refused while another counselor has the student", async (t) => {
  t.mock.method(Appointment, "findById", async () => pendingChat());
  let query;
  t.mock.method(Appointment, "findOne", (q) => { query = q; return { select: () => ({ lean: async () => ({ counselorId: 33 }) }) }; });
  t.mock.method(Counselor, "findById", () => ({ select: () => ({ lean: async () => ({ fullName: "Counselor A" }) }) }));
  const res = await call();
  assert.equal(res.code, 409);
  assert.equal(res.body.code, "STUDENT_IN_OTHER_SESSION");
  assert.match(res.body.error, /already in a session with Counselor A/);
  assert.deepEqual(query.counselorId, { $ne: 22 });
  assert.equal(query.studentId, 11);
});

test("two simultaneous accepts: exactly one keeps the student, the other rolls back", async (t) => {
  // Tiny in-memory store standing in for Mongo.
  const store = {
    a1: { _id: "a1", type: "Chat", status: "pending", studentId: 11, counselorId: 22 },
    a2: { _id: "a2", type: "Chat", status: "pending", studentId: 11, counselorId: 33 },
  };
  const tick = () => new Promise((r) => setImmediate(r));
  const doc = (id) => ({ ...store[id], async save() { await tick(); const { save, ...rest } = this; store[id] = { ...rest }; } });
  t.mock.method(Appointment, "findById", async (id) => doc(id));
  // Pre-check runs before either save lands, so it sees no rival (the race).
  t.mock.method(Appointment, "findOne", () => ({ select: () => ({ lean: async () => null }) }));
  t.mock.method(Appointment, "find", (q) => ({ select: () => ({ lean: async () => Object.values(store).filter((a) =>
    a.studentId === q.studentId && a.type === q.type && q.status.$in.includes(a.status) && a.counselorId !== q.counselorId.$ne) }) }));
  t.mock.method(Counselor, "findById", () => ({ select: () => ({ lean: async () => ({ fullName: "Counselor A" }) }) }));
  const { default: CallLog } = await import("../src/models/callLog.model.js");
  t.mock.method(CallLog, "deleteMany", async () => ({}));

  const accept = async (id, counselorId) => {
    const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await updateAppointment({ params: { id }, user: { _id: counselorId, constructor: { modelName: "Counselor" } }, body: { status: "active", actionTaken: "gca" } }, res);
    return res.code;
  };
  const codes = await Promise.all([accept("a1", 22), accept("a2", 33)]);

  assert.deepEqual([...codes].sort(), [200, 409]);
  const statuses = Object.values(store).map((a) => a.status).sort();
  assert.deepEqual(statuses, ["active", "pending"]);
  const loser = Object.values(store).find((a) => a.status === "pending");
  assert.equal(loser.actionTaken, undefined);
});
