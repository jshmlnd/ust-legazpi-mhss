import test from "node:test";
import assert from "node:assert/strict";
import Appointment from "../src/models/appointment.model.js";
import User from "../src/models/user.model.js";
import AuditTrail from "../src/models/auditTrail.model.js";
import { counselorView } from "../src/controllers/message.controller.js";
import { revealStudentIdentity } from "../src/controllers/auditTrail.controller.js";

const student = {
  _id: 4210043, dynamicId: "ABCD2345", fullName: "Juan Dela Cruz", email: "j@x.edu", studentId: "2021-1",
  department: "CEAFA", program: "BSCS", yearLevel: 3, showNameToCounselor: false,
  mother: { name: "M", contact: "0917" }, emergencyContact: { address: "Somewhere" }, pin: "hash", totpSecret: "enc",
};

test("counselors only get the code and school details unless the student shares their name", () => {
  const hidden = counselorView(student);
  assert.deepEqual(Object.keys(hidden).sort(), ["_id", "department", "dynamicId", "program", "showNameToCounselor", "yearLevel"]);
  assert.equal(counselorView({ ...student, showNameToCounselor: true }).fullName, "Juan Dela Cruz");
});

test("identity reveal needs a session with the student and is always logged", async (t) => {
  const call = async () => {
    const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await revealStudentIdentity({ params: { studentId: "4210043" }, user: { _id: 22 } }, res);
    return res;
  };
  const logged = [];
  t.mock.method(AuditTrail, "create", async (doc) => { logged.push(doc); return doc; });
  t.mock.method(User, "findById", () => ({ select: () => ({ lean: async () => ({ ...student }) }) }));

  t.mock.method(Appointment, "exists", async () => null);
  assert.equal((await call()).code, 403);
  assert.equal(logged.length, 0);

  Appointment.exists.mock.mockImplementation(async () => ({ _id: "a1" }));
  const ok = await call();
  assert.equal(ok.code, 200);
  assert.equal(ok.body.fullName, "Juan Dela Cruz");
  assert.deepEqual(logged, [{ studentId: 4210043, counselorId: 22, type: "identity_revealed", messageId: null }]);
});
