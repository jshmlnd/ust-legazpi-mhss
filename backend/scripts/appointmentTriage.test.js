import test from "node:test";
import assert from "node:assert/strict";
import { mapConcernRisk, overlapsAppointment } from "../src/lib/appointmentTriage.js";

test("maps Jev severity to session risk", () => {
  assert.equal(mapConcernRisk("none"), "Minimal");
  assert.equal(mapConcernRisk("medium"), "High");
  assert.equal(mapConcernRisk("critical"), "Urgent");
});

test("detects requests during a face-to-face session", () => {
  const session = { date: "2026-10-01", time: "09:00 AM", duration: "45 min" };
  assert.equal(overlapsAppointment(session, "2026-10-01", "09:30 AM"), true);
  assert.equal(overlapsAppointment(session, "2026-10-01", "09:45 AM"), false);
  assert.equal(overlapsAppointment(session, "2026-10-02", "09:30 AM"), false);
});
