import test from "node:test";
import assert from "node:assert/strict";
import { protectRoute, counselorOnly } from "../src/middleware/auth.middleware.js";
import resourceRoutes from "../src/routes/resource.route.js";
import selfCareRoutes from "../src/routes/selfCare.route.js";

const routes = (router) => router.stack.filter((l) => l.route).map((l) => ({
  method: Object.keys(l.route.methods)[0],
  path: l.route.path,
  guard: l.route.stack[0].handle,
}));

for (const [name, router] of [["resources", resourceRoutes], ["self-care", selfCareRoutes]]) {
  test(`${name}: students can read, only counselors can write`, () => {
    const all = routes(router);
    assert.ok(all.length > 0);
    for (const r of all) {
      const expected = r.method === "get" ? protectRoute : counselorOnly;
      assert.equal(r.guard, expected, `${r.method.toUpperCase()} ${r.path}`);
    }
  });
}

test("counselorOnly answers 403 to a logged-in student and passes a counselor", async (t) => {
  const { default: jwt } = await import("jsonwebtoken");
  const { default: mongoose } = await import("mongoose");
  const { default: User } = await import("../src/models/user.model.js");
  process.env.JWT_SECRET ||= "test-secret";
  // Shadow the inherited getter; t.mock.getter on it never restores and hangs the run.
  Object.defineProperty(mongoose.connection, "readyState", { get: () => 1, configurable: true });
  t.after(() => delete mongoose.connection.readyState);

  const run = async (userType) => {
    t.mock.method(User, "findById", () => ({ select: async () => ({ userType, dynamicId: "X" }) }));
    const req = { cookies: { jwt: jwt.sign({ userId: "u1" }, process.env.JWT_SECRET) } };
    const res = { code: 200, status(c) { this.code = c; return this; }, json() { return this; } };
    let passed = false;
    await counselorOnly(req, res, () => { passed = true; });
    return { code: res.code, passed };
  };

  assert.deepEqual(await run("student"), { code: 403, passed: false });
  assert.deepEqual(await run("counselor"), { code: 200, passed: true });
});
