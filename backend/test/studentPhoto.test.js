import test from "node:test";
import assert from "node:assert/strict";
import User from "../src/models/user.model.js";
import { updateProfile } from "../src/controllers/auth.controller.js";

test("students cannot set a profile photo, and stored ones are never loaded", async () => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await updateProfile({ user: { _id: 1, constructor: { modelName: "User" } }, body: { profilePic: "" }, mediaFiles: [] }, res);
  assert.equal(res.code, 403);
  assert.equal(User.schema.path("profilePic").options.select, false);
});
