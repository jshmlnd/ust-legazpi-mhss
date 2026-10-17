import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCrisis } from "../src/lib/crisisDetector.js";

test("recognizes intense depression in the fallback detector", () => {
  const analysis = analyzeCrisis("I feel very depressed");
  assert.equal(analysis.severity.level, "medium");
  assert.equal(analysis.isCrisis, true);
});
