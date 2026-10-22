import test from "node:test";
import assert from "node:assert/strict";
import { buildFallbackSummary, formatSource, stripSummaryMarkdown } from "../src/lib/sessionSummary.js";

test("removes markdown syntax from documentation text", () => {
  assert.equal(
    stripSummaryMarkdown("**Presenting concern:**\n- Student feels sad."),
    "Presenting concern:\n- Student feels sad.",
  );
});

test("fallback summary preserves the recorded concern without inventing a session", () => {
  const summary = buildFallbackSummary({
    appointment: { type: "Face-To-Face", concern: "Difficulty balancing school and family responsibilities" },
    messages: [],
  });

  assert.match(summary, /AI summary unavailable/);
  assert.match(summary, /Difficulty balancing school and family responsibilities/);
  assert.match(summary, /No session transcript was available/);
});

test("source carries notes and risk, and truncating long transcripts keeps both ends", () => {
  const source = formatSource({
    appointment: {
      type: "Chat",
      concern: "Exam stress",
      concernRisk: "Low",
      notes: "Student receptive to breathing exercises.",
    },
    messages: [
      { senderModel: "User", text: "START-OF-SESSION" },
      { senderModel: "User", text: "x".repeat(30000) },
      { senderModel: "Counselor", text: "END-OF-SESSION" },
    ],
  });

  assert.match(source, /Initial concern risk: Low/);
  assert.match(source, /Student receptive to breathing exercises/);
  assert.match(source, /middle of transcript omitted/);
  assert.match(source, /START-OF-SESSION/);
  assert.match(source, /END-OF-SESSION/);
});
