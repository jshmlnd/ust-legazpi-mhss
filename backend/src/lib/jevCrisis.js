import { analyzeCrisis, detectLanguage, translateToEnglish } from "./crisisDetector.js";

const JEV_MODEL = "typesafe/jev";
const TIMEOUT_MS = 8000;

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

async function callJev(text) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!accountId || !apiKey) throw new Error("CLOUDFLARE_ACCOUNT_ID / AI_GATEWAY_API_KEY not set");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: JEV_MODEL, input: { state: text, questions: QUESTIONS } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`Jev HTTP ${res.status}`);

  const data = await res.json();

  const answers = data?.result?.answers ?? data?.answers;
  if (!answers?.is_crisis || !answers?.severity) throw new Error("Unexpected Jev response shape");
  return answers;
}

export async function analyzeCrisisAI(text) {
  if (!text || typeof text !== "string" || !text.trim()) return analyzeCrisis("");

  try {
    // Filipino pass: Jev is strongest in English — detect and translate before judging
    // (same dictionary the keyword fallback uses, so both paths see the same text).
    const language = detectLanguage(text);
    const a = await callJev(language === "filipino" ? translateToEnglish(text) : text);
    const sevIdx = Math.max(0, Math.min(4, Math.round(a.severity.score ?? 0)));
    // ponytail: OR gate + floor at "low" — a safety feature must err toward flagging,
    // the counselor reviews every flag. The old AND gate missed high-noul/rounded-severity cases.
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
        model: "jev-1.13",
        probability: a.is_crisis.noul ?? null,
        confidence: a.severity.confidence ?? null,
      },
    };
  } catch (err) {
    console.warn("[jevCrisis] falling back to keyword detector:", err.message);
    return analyzeCrisis(text);
  }
}
