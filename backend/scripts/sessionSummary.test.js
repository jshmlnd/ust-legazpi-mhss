import test from "node:test";
import assert from "node:assert/strict";
import { buildFallbackSummary, stripSummaryMarkdown } from "../src/lib/sessionSummary.js";

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
