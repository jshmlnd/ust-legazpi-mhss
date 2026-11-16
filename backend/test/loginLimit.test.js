import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import User from "../src/models/user.model.js";
import { login, LOGIN_MAX_ATTEMPTS } from "../src/controllers/auth.controller.js";

process.env.JWT_SECRET ||= "test-secret";

const attempt = async (studentId, password) => {
  const res = {
    code: 200,
    status(c) { this.code = c; return this; },
    json() { return this; },
    cookie() { return this; },
  };
  await login({ body: { studentId, password } }, res);
  return res.code;
};

test("login locks an account after repeated wrong passwords, and a correct one clears the count", async (t) => {
  const accounts = {
    "9000001": { _id: 1, studentId: "9000001", dynamicId: "X", password: bcrypt.hashSync("right", 4) },
    "9000002": { _id: 2, studentId: "9000002", dynamicId: "Y", password: bcrypt.hashSync("right", 4) },
  };
  t.mock.method(User, "findOne", async ({ studentId }) => accounts[studentId] ?? null);

  // A correct password before the limit resets the failure count.
  for (let i = 0; i < LOGIN_MAX_ATTEMPTS - 1; i++) assert.equal(await attempt("9000002", "wrong"), 401);
  assert.equal(await attempt("9000002", "right"), 200);
  assert.equal(await attempt("9000002", "wrong"), 401);

  // Hitting the limit blocks even the correct password.
  for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) assert.equal(await attempt("9000001", "wrong"), 401);
  assert.equal(await attempt("9000001", "right"), 429);

  // Other accounts are unaffected.
  assert.equal(await attempt("9000002", "right"), 200);
});
