import test from "node:test";
import assert from "node:assert/strict";
import { mapConcernRisk, overlapsAppointment } from "../src/lib/appointmentTriage.js";

test("maps AI severity to session risk", () => {
  assert.equal(mapConcernRisk("none"), "Minimal");
  assert.equal(mapConcernRisk("medium"), "High");
  assert.equal(mapConcernRisk("critical"), "Urgent");
});

test("escalates intense depression for counselor triage", () => {
  assert.equal(mapConcernRisk("low", "I feel very depressed"), "High");
  assert.equal(mapConcernRisk("Low", "I feel very depressed"), "High");
  assert.equal(mapConcernRisk("low", "I feel a bit sad today"), "Low");
});

test("never downgrades explicit suicidal intent to low", () => {
  assert.equal(mapConcernRisk("low", "I want to kill myself"), "Urgent");
  assert.equal(mapConcernRisk("Low", "I will not kill myself"), "Low");
});

test("detects requests during a face-to-face session", () => {
  const session = { date: "2026-10-01", time: "09:00 AM", duration: "45 min" };
  assert.equal(overlapsAppointment(session, "2026-10-01", "09:30 AM"), true);
  assert.equal(overlapsAppointment(session, "2026-10-01", "09:45 AM"), false);
  assert.equal(overlapsAppointment(session, "2026-10-02", "09:30 AM"), false);
});
