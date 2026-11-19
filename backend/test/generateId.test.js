import test from "node:test";
import assert from "node:assert/strict";
import { getDailyDynamicId } from "../src/lib/generateId.js";

test("daily session IDs always mix letters and digits and stay stable", () => {
  for (let i = 0; i < 5000; i++) {
    const code = getDailyDynamicId(`seed-${i}`);
    assert.match(code, /^[A-Z0-9]{8}$/);
    assert.match(code, /[A-Z]/, code);
    assert.match(code, /[0-9]/, code);
    assert.equal(getDailyDynamicId(`seed-${i}`), code);
  }
  assert.equal(getDailyDynamicId(null), null);
});
