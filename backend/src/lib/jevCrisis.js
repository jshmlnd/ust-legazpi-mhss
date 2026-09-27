import { analyzeCrisis, detectLanguage, translateToEnglish } from "./crisisDetector.js";

// Jev 1.3 hosted Decisions API (https://www.jevai.org/docs) — native
// /api/v1/decisions endpoint: our own state plus choice/noul/score questions.
// Replaces the Cloudflare Workers AI passthrough; the personal key comes from
// jevai.org/agent/keys and lives in JEV_API_KEY.
const JEV_API_URL = "https://www.jevai.org/api/v1/decisions";
const TIMEOUT_MS = 8000;
// The API rejects bodies over 32 KiB; cap the state text well under that so
// long diary entries get judged instead of erroring into the keyword fallback.
const MAX_STATE_CHARS = 24_000;

const LEVELS = [
  { level: "none", label: "None", color: "green" },
  { level: "low", label: "Low", color: "yellow" },
  { level: "medium", label: "Medium", color: "amber" },
  { level: "high", label: "High", color: "red" },
  { level: "critical", label: "Critical", color: "red" },
];

const QUESTIONS = {
  is_crisis: {
    type: "noul",
    instructions:
      "Does this message express suicidal ideation, intent or plans for self-harm, or an acute mental-health crisis needing intervention? Negated statements (e.g. 'I will not kill myself'), hypotheticals, and educational/quoting mentions are NOT a crisis.",
    criteria: {
      true: "A genuine first-person expression of crisis",
      false: "No crisis expressed",
    },
  },
  severity: {
    type: "score",
    instructions: "How severe is the mental-health crisis expressed in this message?",
    criteria: [
      "none: no crisis content at all",
      "low: passive distress, hopelessness, feeling like a burden, mild cries for help",
      "medium: active suicidal thoughts without a plan or means, self-harm without imminent risk",
      "high: ideation with a plan or means, recent self-harm, strong stated intent",
      "critical: imminent intent, an ongoing attempt, or an explicit plan with time and means",
    ],
  },
  category: {
    type: "choice",
    instructions: "Which crisis category best fits this message?",
    criteria: {
      suicidal_ideation: "Thoughts or wishes about dying or ending one's life",
      self_harm: "Hurting oneself without suicidal intent",
      means: "References to methods, weapons, substances, or opportunity",
      distress: "Emotional pain, hopelessness, worthlessness",
      crisis: "Urgent calls for help, danger, or goodbye messages",
      none: "No crisis content",
    },
  },
};

async function callJev(text, { translatedFromFilipino = false } = {}) {
  const apiKey = process.env.JEV_API_KEY;
  if (!apiKey) throw new Error("JEV_API_KEY not set");

  // Tagalog/Filipino messages are pre-translated by our dictionary so Jev can
  // judge them; tell it the text is machine-translated so "awkward phrasing"
  // is not read as low-stakes and Tagalog idioms already carried across.
  const state = { message: text.slice(0, MAX_STATE_CHARS) };
  if (translatedFromFilipino) {
    state.language = "filipino";
    state.note =
      "This message was originally in Tagalog/Filipino and was machine-translated to English with a crisis-phrase dictionary. Judge the translated text as the student's own words; phrasing may be literal or awkward. Negation (ayaw/hindi/huwag = not/dont) has been preserved in translation.";
  }

  const res = await fetch(
    JEV_API_URL,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state, questions: QUESTIONS }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`Jev HTTP ${res.status}`);

  const data = await res.json();
  if (data?.code !== 0) throw new Error(`Jev error ${data?.code ?? "unknown"}: ${data?.message ?? "no message"}`);

  const answers = data?.data?.answers;
  if (!answers?.is_crisis || !answers?.severity) throw new Error("Unexpected Jev response shape");
  return answers;
}

export async function analyzeCrisisAI(text) {
  if (!text || typeof text !== "string" || !text.trim()) return analyzeCrisis("");

  try {
    // Filipino pass: Jev is strongest in English — detect and translate before judging
    // (same dictionary the keyword fallback uses, so both paths see the same text).
    const language = detectLanguage(text);
    const isFilipino = language === "filipino";
    const a = await callJev(isFilipino ? translateToEnglish(text) : text, { translatedFromFilipino: isFilipino });
    const sevIdx = Math.max(0, Math.min(4, Math.round(a.severity.score ?? 0)));
    // ponytail: OR gate + floor at "low" — a safety feature must err toward
    // flagging: the counselor reviews every flag, so a false positive costs
    // one dismissal while a false negative costs a missed intervention. The
    // old AND gate silently dropped cases where one signal was strong but the
    // other rounded low (e.g. noul 0.9 + severity 0.2).
    const isCrisis = (a.is_crisis.noul ?? 0) >= 0.5 || sevIdx > 0;
    const effIdx = isCrisis ? Math.max(sevIdx, 1) : 0;
    const category = a.category?.choice && a.category.choice !== "none" ? a.category.choice : "crisis";

    return {
      isCrisis,
      severity: LEVELS[effIdx],
      score: effIdx * 25,
      matches: isCrisis
        ? [{ type: "jev", phrase: category, weight: effIdx * 2.5, category }]
        : [],
      language,
      ai: {
        model: "jev-1.3",
        probability: a.is_crisis.noul ?? null,
        confidence: a.severity.confidence ?? null,
      },
    };
  } catch (err) {
    console.warn("[jevCrisis] falling back to keyword detector:", err.message);
    return analyzeCrisis(text);
  }
}
