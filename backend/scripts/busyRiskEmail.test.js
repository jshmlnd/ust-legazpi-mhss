import test from "node:test";
import assert from "node:assert/strict";
import { busyRiskAlertEmailTemplate } from "../src/lib/mailer.js";

test("busy risk email identifies the counselor and links to requests", () => {
  const html = busyRiskAlertEmailTemplate({
    concernRisk: "Urgent",
    counselorName: "Dr. Santos",
    date: "2026-10-02",
    time: "09:30 AM",
    reviewUrl: "https://example.test/manage/session-requests",
  });

  assert.match(html, /Dr\. Santos/);
  assert.match(html, /Urgent/);
  assert.match(html, /href="https:\/\/example\.test\/manage\/session-requests"/);
});
