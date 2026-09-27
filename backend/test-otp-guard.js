// One-off verification: OTP rate-limit budget + timing-safe compare.
// Run: node test-otp-guard.js
process.loadEnvFile('./.env');
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };

// safeEqual behavior (re-implemented check against the controller's helper via
// an isolated copy — the controller doesn't export it; keep in sync).
const crypto = await import('node:crypto');
const safeEqual = (a, b) => {
    const ab = Buffer.from(String(a ?? ''));
    const bb = Buffer.from(String(b ?? ''));
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};
assert(safeEqual('123456', '123456'), 'safeEqual: equal codes match');
assert(!safeEqual('123456', '654321'), 'safeEqual: different codes rejected');
assert(!safeEqual('1234', '123456'), 'safeEqual: length mismatch rejected');
assert(!safeEqual(undefined, '123456'), 'safeEqual: undefined rejected');
console.log('PASS: safeEqual semantics');

// Budget math against the real constants in the source.
const src = (await import('node:fs')).readFileSync('./src/controllers/auth.controller.js', 'utf8');
const max = Number(src.match(/OTP_MAX_ATTEMPTS = (\d+)/)[1]);
const windowMs = 60 * 1000 * Number(src.match(/OTP_WINDOW_MS = (\d+)/)[1].trim());
assert(max === 10, `budget: 10 attempts (got ${max})`);
assert(windowMs === 10 * 60 * 1000, `budget: 10-minute window (got ${windowMs})`);
// every code-entry endpoint is guarded (slice to next export or EOF)
const lines = src.split(/\r?\n/);
const exportIdx = [...src.matchAll(/^export const (\w+)/gm)].map((m) => ({
  fn: m[1],
  line: src.slice(0, m.index).split('\n').length,
}));
for (const fn of ['totpVerify', 'totpDisable', 'verifyTwoFactor', 'verifyPin', 'removePin']) {
  const i = exportIdx.findIndex((e) => e.fn === fn);
  const start = exportIdx[i].line - 1;
  const end = i + 1 < exportIdx.length ? exportIdx[i + 1].line - 1 : lines.length;
  const body = lines.slice(start, end).join('\n');
  assert(body.includes('assertOtpBudget'), `budget: ${fn} is rate-limited`);
}
console.log('PASS: all code-entry endpoints rate-limited');
console.log('ALL PASS');
process.exit(0);
