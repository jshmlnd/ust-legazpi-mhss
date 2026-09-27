// Run: node test-jevCrisis.js — checks Jev response mapping + keyword fallback + Tagalog support.
process.env.JEV_API_KEY = 'test';

const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };
const stub = (answers) => { globalThis.fetch = async () => ({ ok: true, json: async () => ({ code: 0, message: 'ok', data: { answers } }) }); };

const { analyzeCrisisAI } = await import('./src/lib/jevCrisis.js');

// critical crisis mapping (score 3.9 rounds to idx 4 = critical)
stub({ is_crisis: { noul: 0.97 }, severity: { score: 3.9, confidence: 0.9 }, category: { choice: 'suicidal_ideation' } });
const r = await analyzeCrisisAI('I am going to end it all tonight');
assert(r.isCrisis === true, 'critical: isCrisis');
assert(r.severity.level === 'critical', 'critical: level');
assert(r.score === 100, 'critical: score');
assert(r.matches[0].category === 'suicidal_ideation', 'critical: category');
assert(r.ai?.model === 'jev-1.3', 'critical: ai meta');

// non-crisis
stub({ is_crisis: { noul: 0.01 }, severity: { score: 0, confidence: 0.99 }, category: { choice: 'none' } });
const n = await analyzeCrisisAI('hello how are you');
assert(n.isCrisis === false && n.severity.level === 'none' && n.score === 0, 'non-crisis');

// OR gate: high noul alone flags even when severity rounds to 0, floored at "low"
stub({ is_crisis: { noul: 0.9 }, severity: { score: 0.2, confidence: 0.6 }, category: { choice: 'distress' } });
const split = await analyzeCrisisAI('ayoko na mabuhay');
assert(split.isCrisis === true && split.severity.level === 'low' && split.score === 25, 'OR gate: noul-only flag');

// low-probability noul does not flag even with nonzero severity
stub({ is_crisis: { noul: 0.2 }, severity: { score: 2, confidence: 0.5 }, category: { choice: 'distress' } });
const amb = await analyzeCrisisAI('everything is hard');
assert(amb.isCrisis === true && amb.severity.level === 'medium', 'OR gate: severity-only flag');

// Filipino pass: detected language is tagged and the text is translated before reaching Jev
let sentBody;
globalThis.fetch = async (url, opts) => {
  sentBody = JSON.parse(opts.body);
  return { ok: true, json: async () => ({ code: 0, message: 'ok', data: { answers: {
    is_crisis: { noul: 0.95 }, severity: { score: 3.2, confidence: 0.9 }, category: { choice: 'suicidal_ideation' } } } }) };
};
const fil = await analyzeCrisisAI('ayaw ko na ng buhay');
assert(fil.language === 'filipino', 'filipino: language tag');
assert(sentBody.state.message.includes('i dont want to live anymore'), 'filipino: translated state sent to Jev');
assert(fil.isCrisis && fil.severity.level === 'high', 'filipino: severity mapping');
assert(sentBody.state.language === 'filipino', 'filipino: state.language set');
assert(sentBody.state.note.includes('Tagalog/Filipino'), 'filipino: translation note sent to Jev');

// Filipino AI path: negated Tagalog statement stays non-crisis through translation
let negBody;
globalThis.fetch = async (url, opts) => {
  negBody = JSON.parse(opts.body);
  return { ok: true, json: async () => ({ code: 0, message: 'ok', data: { answers: {
    is_crisis: { noul: 0.01 }, severity: { score: 0, confidence: 0.9 }, category: { choice: 'none' } } } }) };
};
const filNeg = await analyzeCrisisAI('ayaw ko nang mamatay');
assert(filNeg.language === 'filipino', 'filipino-neg: language tag');
assert(negBody.state.message.includes("dont want to die"), 'filipino-neg: translated state sent');
assert(filNeg.isCrisis === false, 'filipino-neg: negation preserved');

// mixed Tagalog/English (Taglish) flags at crisis severity via the AI path
let taglishBody;
globalThis.fetch = async (url, opts) => {
  taglishBody = JSON.parse(opts.body);
  return { ok: true, json: async () => ({ code: 0, message: 'ok', data: { answers: {
    is_crisis: { noul: 0.9 }, severity: { score: 3.2, confidence: 0.9 }, category: { choice: 'suicidal_ideation' } } } }) };
};
const taglish = await analyzeCrisisAI('grabe ang buhay, gusto ko nang mamatay talaga');
assert(taglish.language === 'filipino', 'taglish: detected');
assert(taglishBody.state.message.includes('i want to die'), 'taglish: translated state sent to Jev');
assert(taglish.isCrisis === true && taglish.severity.level === 'high', 'taglish: severity');

// fallback to keyword detector when the API fails
globalThis.fetch = async () => { throw new Error('network down'); };
const f = await analyzeCrisisAI('I want to die');
assert(f.isCrisis === true && f.ai === undefined, 'fallback: keyword detector');

// fallback regression: Tagalog death-wish caught via translated dict phrase
const fTag = await analyzeCrisisAI('ayoko na mabuhay');
assert(fTag.isCrisis === true && fTag.severity.level === 'low', 'fallback: ayoko na mabuhay');

// fallback: common Tagalog crisis phrasings map to English keywords
const tagalogCases = [
  ['gusto ko nang mamatay', 'want to die'],
  ['gusto kong magpakamatay', 'kill myself'],
  ['gusto kong mag bigti', 'hang myself'],
  ['papatayin ko ang sarili ko', 'kill myself'],
  ['mabuti pa mamatay na lang ako, hindi ko na kaya', 'better off dead'],
  ['wala nang dahilan para mabuhay', 'no reason to live'],
  ['hindi ko na kaya ang lahat ngayon', 'cant take it'],
  ['sawang sawa na ako sa buhay', 'tired of living'],
  ['laslasin ko ang sarili ko', 'cut my wrists'],
  ['naglason ako kanina', 'poisoned myself'],
  ['tulungan ninyo ako', 'help me please'],
  ['paalam na sa lahat', 'final goodbye'],
];
for (const [text, phrase] of tagalogCases) {
  const r = await analyzeCrisisAI(text);
  assert(r.isCrisis === true, `fallback: "${text}" flags`);
  assert(r.matches.some(m => m.phrase === phrase), `fallback: "${text}" matched "${phrase}"`);
}

// fallback: dialect variants of "I don't want to live" all resolve to the same dict phrase
for (const text of ['ayoko na ng buhay', 'ayoko nang mabuhay', 'ayaw ko nang mabuhay', 'ayaw ko ng buhay']) {
  const r = await analyzeCrisisAI(text);
  assert(r.isCrisis === true, `fallback variant: "${text}" flags`);
}

// fallback: Taglish (code-switched) sentences must still detect as filipino
for (const text of ['grabe ang buhay, gusto ko nang mamatay talaga', 'sobrang pagod na ako sa buhay ko na', 'ang hirap na ng buhay ko, ayoko na mabuhay']) {
  const r = await analyzeCrisisAI(text);
  assert(r.language === 'filipino', `taglish fallback: "${text}" detected`);
  assert(r.isCrisis === true, `taglish fallback: "${text}" flags`);
}

// fallback control: negated statement must NOT flag
const fNeg = await analyzeCrisisAI('ayaw ko nang mamatay');
assert(fNeg.isCrisis === false, 'fallback: negation still excluded');

// empty input short-circuits
const e = await analyzeCrisisAI('');
assert(e.isCrisis === false, 'empty input');

console.log('ALL PASS');
