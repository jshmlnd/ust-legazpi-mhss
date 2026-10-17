// Crisis classification eval harness.
// Runs the labeled set in crisis-eval-cases.json through the real pipeline
// (Groq -> keyword fallback) and reports detection + severity metrics.
// Sequential with a delay between calls: gpt-oss-120b free tier allows
// ~8000 tokens/min and the few-shot prompt is ~1.2k tokens, so anything under
// ~9s spacing gets throttled (429 -> keyword fallback). Tune with EVAL_DELAY_MS.
// Usage: npm run eval:crisis [-- --skip=23 --limit=23 --verbose]
import "dotenv/config";
import { readFileSync } from "node:fs";
import { analyzeCrisisAI, LEVELS } from "../src/lib/groqCrisis.js";

const { cases: allCases } = JSON.parse(readFileSync(new URL("./crisis-eval-cases.json", import.meta.url), "utf8"));
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? Infinity);
const SKIP = Number(process.argv.find((a) => a.startsWith("--skip="))?.split("=")[1] ?? 0);
const cases = allCases.slice(SKIP, SKIP + LIMIT);
const DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 9000);
const VERBOSE = process.argv.includes("--verbose");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const [i, c] of cases.entries()) {
  if (i) await sleep(DELAY_MS);
  const r = await analyzeCrisisAI(c.text);
  results.push({ ...c, got: r.severity.level, flagged: r.isCrisis, model: r.ai?.model ?? null });
}

const idx = (level) => LEVELS.findIndex((l) => l.level === level);
const isCrisis = (r) => r.expected !== "none";
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : "n/a");

const tp = results.filter((r) => isCrisis(r) && r.flagged).length;
const fn = results.filter((r) => isCrisis(r) && !r.flagged).length;
const fp = results.filter((r) => !isCrisis(r) && r.flagged).length;
const tn = results.filter((r) => !isCrisis(r) && !r.flagged).length;

const graded = results.filter((r) => isCrisis(r) && r.flagged);
const exact = graded.filter((r) => r.got === r.expected).length;
const within1 = graded.filter((r) => Math.abs(idx(r.got) - idx(r.expected)) <= 1).length;

const fallback = results.filter((r) => !r.model).length;
const model = results.find((r) => r.model)?.model ?? "(none served — keyword fallback only)";

const mismatches = results.filter((r) => isCrisis(r) !== r.flagged || r.got !== r.expected);

console.log(`\nCrisis eval — ${cases.length} cases | model: ${model} | delay: ${DELAY_MS}ms`);

if (VERBOSE) {
  console.log("\nALL RESULTS");
  for (const r of results) {
    console.log(`  ${r.flagged ? "flag" : "pass"} ${r.expected.padEnd(8)} -> ${r.got.padEnd(8)} "${r.text}"`);
  }
}

if (mismatches.length) {
  console.log(`\nMISMATCHES (${mismatches.length})`);
  for (const r of mismatches) {
    const tag = isCrisis(r) && !r.flagged
      ? "[FALSE NEGATIVE]"
      : !isCrisis(r) && r.flagged
        ? "[FALSE POSITIVE]"
        : "[SEVERITY]      ";
    console.log(`  ${tag} expected ${r.expected}, got ${r.flagged ? r.got : "none (not flagged)"} — "${r.text}"`);
  }
} else {
  console.log("\nMISMATCHES: none");
}

console.log(`
CRISIS DETECTION (flag or not)
  TP ${tp} | FP ${fp} | FN ${fn} | TN ${tn}
  sensitivity ${pct(tp, tp + fn)} | specificity ${pct(tn, tn + fp)} | accuracy ${pct(tp + tn, results.length)}

SEVERITY GRADING (flagged crisis cases only)
  exact match ${exact}/${graded.length} (${pct(exact, graded.length)}) | within 1 level ${within1}/${graded.length} (${pct(within1, graded.length)})

SERVED BY: ai ${results.length - fallback} | keyword-fallback ${fallback}`);

if (fallback / results.length > 0.2) {
  console.warn("warning: >20% of cases fell back to keywords — check GROQ_API_KEY or rate limits (raise EVAL_DELAY_MS)");
}
if (fn > 0) {
  console.warn(`warning: ${fn} false negative(s) — the safety-critical metric`);
  process.exitCode = 1;
}
