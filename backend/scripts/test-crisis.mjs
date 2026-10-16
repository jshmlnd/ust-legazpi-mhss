// Severity-grading regression check for the keyword fallback detector.
// Run: node scripts/test-crisis.mjs  (no DB, no JEV — pure function)
import assert from "node:assert/strict";
import { analyzeCrisis } from "../src/lib/crisisDetector.js";

const cases = [
  // direct first-person ideation must never grade below "high"
  ["I want to kill myself", "high"],
  ["i want to commit suicide", "high"],
  ["I hurt myself", "high"],
  // means at near-max weight = critical
  ["I overdosed", "critical"],
  ["I jumped off a bridge", "critical"],
  // urgency/distress
  ["I am not safe right now", "medium"],
  ["paalam na", "medium"],
  ["tired of living", "low"],
  ["help me", "low"],
  ["everything is hopeless and nobody cares", "low"],
  // negations / low signal must not flag
  ["I will not kill myself", "none"],
  ["hindi ako magpapakamatay", "none"],
  ["worthless", "none"],
  ["", "none"],
];

for (const [text, expected] of cases) {
  const { severity, isCrisis } = analyzeCrisis(text);
  assert.equal(
    severity.level,
    expected,
    `"${text}" graded "${severity.level}" (expected "${expected}", isCrisis=${isCrisis})`,
  );
}

console.log(`crisis severity: ${cases.length} cases pass`);
