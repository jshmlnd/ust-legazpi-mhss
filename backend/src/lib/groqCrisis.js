import { analyzeCrisis, detectLanguage, translateToEnglish } from "./crisisDetector.js";

// Groq Cloud (https://console.groq.com) OpenAI-compatible chat completions.
// Replaces the Jev 1.3 decisions API — key lives in GROQ_API_KEY, model is
// overridable via GROQ_MODEL.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const TIMEOUT_MS = 8000;
// Cap the message so long diary entries stay cheap prompts instead of erroring.
const MAX_TEXT_CHARS = 24_000;

export const LEVELS = [
  { level: "none", label: "None", color: "green" },
  { level: "low", label: "Low", color: "yellow" },
  { level: "medium", label: "Medium", color: "amber" },
  { level: "high", label: "High", color: "red" },
  { level: "critical", label: "Critical", color: "red" },
];

const SEVERITY_INDEX = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };

const SYSTEM_PROMPT = `You are the crisis classifier for a university counseling app. Judge the sender's message and reply with a single JSON object:
{
  "is_crisis": boolean. Does the SENDER'S OWN message express suicidal ideation, intent or plans for self-harm, or an acute mental-health crisis needing intervention? NOT a crisis: negated statements (e.g. "I will not kill myself"), hypotheticals, educational/quoting mentions, hyperbole and idioms ("dying of laughter", "this exam is killing me"), and statements about someone else's risk — only the sender's own crisis counts.
  "probability": number 0-1. Confidence that this is a genuine first-person expression of crisis.
  "severity": "none" | "low" | "medium" | "high" | "critical"
    none: no crisis content at all
  low: mild or situational distress, sadness, feeling like a burden, mild cries for help
  medium: intense or persistent depression/severe distress, active suicidal thoughts without a plan or means, self-harm without imminent risk
    high: ideation with a plan or means, recent self-harm, strong stated intent
    critical: imminent intent, an ongoing attempt, or an explicit plan with time and means
  "category": "suicidal_ideation" | "self_harm" | "means" | "distress" | "crisis" | "none"
    suicidal_ideation: thoughts or wishes about dying or ending one's life
    self_harm: hurting oneself without suicidal intent
    means: references to methods, weapons, substances, or opportunity
    distress: emotional pain, hopelessness, worthlessness
    crisis: urgent calls for help, danger, or goodbye messages
  "confidence": number 0-1. Confidence in the severity rating.
}
A Tagalog/Filipino message arrives as two lines — "Original (Tagalog/Filipino): ..." and "Dictionary translation: ...". Judge the sender's own words using the original for context: the dictionary translation may be literal or awkward and can miss hyperbole. Negation (ayaw/hindi/huwag = not/don't) is preserved in translation.`;

// Calibration examples for the classes the live eval got wrong: hyperbole,
// Filipino context, third-party risk (none per product policy), passive
// distress, self-harm grading, means references, implicit goodbyes.
const out = (is_crisis, probability, severity, category, confidence = 0.9) => ({ is_crisis, probability, severity, category, confidence });

const FEW_SHOTS = [
  ["I'm dying of laughter at what my classmate said", out(false, 0.01, "none", "none", 0.98)],
  ["I'd rather die than take another math test", out(false, 0.02, "none", "none", 0.97)],
  ["Original (Tagalog/Filipino): Gusto ko nang mamatay sa sobrang kilig\nDictionary translation: I want to die sa sobrang kilig", out(false, 0.01, "none", "none", 0.97)],
  ["Original (Tagalog/Filipino): Ayaw kong mamatay. Gusto ko lang ng kausap.\nDictionary translation: I don't want to die. Gusto ko lang ng kausap.", out(false, 0.03, "none", "none", 0.95)],
  ["My classmate told me she wants to die and showed me her cuts.", out(false, 0.05, "none", "none", 0.9)],
  ["My friend texted me 'goodbye, thank you for everything' and now she's not answering. I'm scared.", out(false, 0.05, "none", "none", 0.9)],
  ["I'm so tired of pretending I'm okay.", out(true, 0.6, "low", "distress")],
  ["I feel very depressed and I can't cope anymore.", out(true, 0.7, "medium", "distress")],
  ["I keep imagining what it would be like to not exist anymore.", out(true, 0.7, "low", "suicidal_ideation")],
  ["I scratch my arms when I get anxious. It leaves marks.", out(true, 0.8, "medium", "self_harm")],
  ["I punched the wall until my knuckles bled when my parents fought.", out(true, 0.8, "medium", "self_harm")],
  ["I've been cutting again and the cuts are getting deeper.", out(true, 0.9, "high", "self_harm")],
  ["Original (Tagalog/Filipino): Nagpapaslas ako para mawala ang sakit sa dibdib ko.\nDictionary translation: I cut myself to make the chest pain go away.", out(true, 0.8, "medium", "self_harm")],
  ["I looked up how many sleeping pills it takes. Just curious though.", out(true, 0.75, "high", "means")],
  ["Original (Tagalog/Filipino): May blade ako sa wallet ko lagi, para sigurado.\nDictionary translation: May blade ako sa wallet ko lagi, para sigurado.", out(true, 0.85, "high", "means")],
  ["Thank you for everything. This is goodbye.", out(true, 0.8, "medium", "crisis")],
  ["I wrote a note to my mom last night. I think I'm really going to do it this time.", out(true, 0.9, "high", "suicidal_ideation")],
];

async function callGroq({ original, translated, isFilipino }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  // Filipino messages carry both the original and the dictionary translation
  // so the model can judge context the translation destroys (e.g. "gusto ko
  // nang mamatay sa sobrang kilig" is a joke, not ideation).
  const userContent = isFilipino
    ? `Original (Tagalog/Filipino): ${original.slice(0, MAX_TEXT_CHARS)}\nDictionary translation: ${translated.slice(0, MAX_TEXT_CHARS)}`
    : translated.slice(0, MAX_TEXT_CHARS);

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      temperature: 0,
      reasoning_effort: "low",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...FEW_SHOTS.flatMap(([text, expected]) => [
          { role: "user", content: text },
          { role: "assistant", content: JSON.stringify(expected) },
        ]),
        { role: "user", content: userContent },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Unexpected Groq response shape");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq returned non-JSON content");
  }
  if (typeof parsed.is_crisis !== "boolean" || !(parsed.severity in SEVERITY_INDEX)) {
    throw new Error("Unexpected Groq classification shape");
  }
  return parsed;
}

export function shapeAnalysis(a, language, model) {
  const sevIdx = SEVERITY_INDEX[a.severity] ?? 0;
  const probability = typeof a.probability === "number" ? a.probability : null;
  // ponytail: OR gate + floor at "low" — a safety feature must err toward
  // flagging: the counselor reviews every flag, so a false positive costs
  // one dismissal while a false negative costs a missed intervention.
  const isCrisis = a.is_crisis === true || (probability ?? 0) >= 0.5 || sevIdx > 0;
  const effIdx = isCrisis ? Math.max(sevIdx, 1) : 0;
  const category = a.category && a.category !== "none" ? a.category : "crisis";

  return {
    isCrisis,
    severity: LEVELS[effIdx],
    score: effIdx * 25,
    matches: isCrisis
      ? [{ type: "ai", phrase: category, weight: effIdx * 2.5, category }]
      : [],
    language,
    ai: {
      model,
      probability,
      confidence: typeof a.confidence === "number" ? a.confidence : null,
    },
  };
}

export async function analyzeCrisisAI(text) {
  if (!text || typeof text !== "string" || !text.trim()) return analyzeCrisis("");

  try {
    // Filipino pass: the model judges the original with the dictionary
    // translation alongside (same dictionary the keyword fallback uses).
    const language = detectLanguage(text);
    const isFilipino = language === "filipino";
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const a = await callGroq({
      original: text,
      translated: isFilipino ? translateToEnglish(text) : text,
      isFilipino,
    });
    return shapeAnalysis(a, language, model);
  } catch (err) {
    console.warn("[groqCrisis] falling back to keyword detector:", err.message);
    return analyzeCrisis(text);
  }
}
