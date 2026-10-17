import test from "node:test";
import assert from "node:assert/strict";
import { shapeAnalysis } from "../src/lib/groqCrisis.js";

test("maps Groq classification to severity levels", () => {
  const none = shapeAnalysis(
    { is_crisis: false, severity: "none", probability: 0.02, category: "none", confidence: 0.9 },
    "english",
    "test-model",
  );
  assert.equal(none.isCrisis, false);
  assert.equal(none.severity.level, "none");
  assert.equal(none.score, 0);

  const high = shapeAnalysis(
    { is_crisis: true, severity: "high", probability: 0.95, category: "suicidal_ideation", confidence: 0.8 },
    "filipino",
    "test-model",
  );
  assert.equal(high.isCrisis, true);
  assert.equal(high.severity.level, "high");
  assert.equal(high.score, 75);
  assert.equal(high.language, "filipino");
  assert.equal(high.matches[0].category, "suicidal_ideation");
});

test("flags a contradiction as at least low (safety gate)", () => {
  const a = shapeAnalysis(
    { is_crisis: true, severity: "none", probability: 0.9, category: "crisis" },
    "english",
    "test-model",
  );
  assert.equal(a.isCrisis, true);
  assert.equal(a.severity.level, "low");
});

test("invalid severity is treated as none", () => {
  const a = shapeAnalysis(
    { is_crisis: false, severity: "banana", probability: 0.1, category: "none" },
    "english",
    "test-model",
  );
  assert.equal(a.severity.level, "none");
  assert.equal(a.isCrisis, false);
});
