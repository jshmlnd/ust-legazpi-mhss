// Run: node test-jevCrisis.js — checks Jev response mapping + keyword fallback.
process.env.CLOUDFLARE_ACCOUNT_ID = 'test';
process.env.AI_GATEWAY_API_KEY = 'test';

const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };
const stub = (answers) => { globalThis.fetch = async () => ({ ok: true, json: async () => ({ result: { answers } }) }); };

const { analyzeCrisisAI } = await import('./src/lib/jevCrisis.js');

// critical crisis mapping (score 3.9 rounds to idx 4 = critical)
stub({ is_crisis: { noul: 0.97 }, severity: { score: 3.9, confidence: 0.9 }, category: { choice: 'suicidal_ideation' } });
const r = await analyzeCrisisAI('I am going to end it all tonight');
assert(r.isCrisis === true, 'critical: isCrisis');
assert(r.severity.level === 'critical', 'critical: level');
assert(r.score === 100, 'critical: score');
assert(r.matches[0].category === 'suicidal_ideation', 'critical: category');
assert(r.ai?.model === 'jev-1.13', 'critical: ai meta');

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
  return { ok: true, json: async () => ({ result: { answers: {
    is_crisis: { noul: 0.95 }, severity: { score: 3.2, confidence: 0.9 }, category: { choice: 'suicidal_ideation' } } } }) };
};
const fil = await analyzeCrisisAI('ayaw ko na ng buhay');
assert(fil.language === 'filipino', 'filipino: language tag');
assert(sentBody.input.state.includes('i dont want to live anymore'), 'filipino: translated state sent to Jev');
assert(fil.isCrisis && fil.severity.level === 'high', 'filipino: severity mapping');

// fallback to keyword detector when the API fails
globalThis.fetch = async () => { throw new Error('network down'); };
const f = await analyzeCrisisAI('I want to die');
assert(f.isCrisis === true && f.ai === undefined, 'fallback: keyword detector');

// fallback regression: Tagalog death-wish caught via translated dict phrase
const fTag = await analyzeCrisisAI('ayoko na mabuhay');
assert(fTag.isCrisis === true && fTag.severity.level === 'low', 'fallback: ayoko na mabuhay');

// fallback control: negated statement must NOT flag
const fNeg = await analyzeCrisisAI('ayaw ko nang mamatay');
assert(fNeg.isCrisis === false, 'fallback: negation still excluded');

// empty input short-circuits
const e = await analyzeCrisisAI('');
assert(e.isCrisis === false, 'empty input');

console.log('ALL PASS');
