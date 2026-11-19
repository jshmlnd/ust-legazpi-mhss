import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Message from "../src/models/message.model.js";
import AuditTrail from "../src/models/auditTrail.model.js";
import { logCrisisDetection } from "../src/controllers/auditTrail.controller.js";

const MSG_ID = new mongoose.Types.ObjectId().toString();
const message = { senderId: 11, senderModel: "User", receiverId: 22, receiverModel: "Counselor" };
const as = (id, modelName) => ({ _id: id, constructor: { modelName } });

const call = async (user, body) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await logCrisisDetection({ user, body: { messageId: MSG_ID, severity: "high", ...body } }, res);
  return res;
};

test("crisis audit: IDs come from the message and outsiders are refused", async (t) => {
  t.mock.method(Message, "findById", () => ({ select: async () => message }));
  const upsert = t.mock.method(AuditTrail, "findOneAndUpdate", async (_f, { $setOnInsert }) => $setOnInsert);

  // Forged body IDs are ignored; the counselor in the conversation logs it.
  const ok = await call(as(22, "Counselor"), { studentId: 999, counselorId: 888 });
  assert.equal(ok.code, 201);
  assert.equal(ok.body.studentId, 11);
  assert.equal(ok.body.counselorId, 22);

  // Same numeric id but the wrong model, or a stranger: refused, nothing written.
  const before = upsert.mock.callCount();
  assert.equal((await call(as(22, "User"), {})).code, 403);
  assert.equal((await call(as(33, "User"), {})).code, 403);
  assert.equal(upsert.mock.callCount(), before);

  assert.equal((await call(as(11, "User"), { messageId: { $ne: null } })).code, 400);
});

test("crisis audit: a concurrent duplicate is treated as already logged", async (t) => {
  t.mock.method(Message, "findById", () => ({ select: async () => message }));
  t.mock.method(AuditTrail, "findOneAndUpdate", async () => { throw Object.assign(new Error("E11000"), { code: 11000 }); });
  t.mock.method(AuditTrail, "findOne", async () => ({ messageId: MSG_ID, existing: true }));
  const res = await call(as(11, "User"), {});
  assert.equal(res.code, 200);
  assert.equal(res.body.existing, true);
});
