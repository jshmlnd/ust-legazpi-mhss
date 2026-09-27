// Run: node test-totp.js — checks the TOTP lib (encrypt/decrypt, verify, URI/QR)
// and the model fields, without needing Mongo or the express app.
process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex

const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };

const {
  encryptSecret,
  decryptSecret,
  createTotpSecret,
  buildOtpAuthUri,
  buildQrDataUrl,
  verifyTotpToken,
} = await import('./src/lib/totp.js');
import * as otplib from 'otplib';

// ── encryption round-trip ──
const secret = createTotpSecret();
const enc = encryptSecret(secret);
assert(enc !== secret, 'encrypt: ciphertext differs from plaintext');
assert(enc.split('.').length === 3, 'encrypt: iv.tag.ciphertext shape');
assert(decryptSecret(enc) === secret, 'decrypt: round-trip preserves secret');

// tampered ciphertext must fail (GCM auth tag)
const parts = enc.split('.');
const tampered = [parts[0], parts[1], Buffer.from('deadbeef').toString('base64url')].join('.');
let threw = false;
try { decryptSecret(tampered); } catch { threw = true; }
assert(threw, 'decrypt: tampered ciphertext rejected');

// missing key must throw
delete process.env.TOTP_ENCRYPTION_KEY;
threw = false;
try { encryptSecret('x'); } catch { threw = true; }
assert(threw, 'encrypt: missing TOTP_ENCRYPTION_KEY throws');
process.env.TOTP_ENCRYPTION_KEY = 'a'.repeat(64);

// ── code generation / verification ──
const { generate } = otplib;
const code = await generate({ secret });
const ok = await verifyTotpToken(secret, code);
assert(ok.valid === true, 'verify: current code accepted');
const bad = await verifyTotpToken(secret, '000000');
assert(bad.valid === false, 'verify: wrong code rejected');
const malformed = await verifyTotpToken(secret, '12ab!!');
assert(malformed.valid === false, 'verify: malformed code rejected without throwing');
const empty = await verifyTotpToken(secret, '');
assert(empty.valid === false, 'verify: empty code rejected');

// ── URI + QR ──
const uri = buildOtpAuthUri({ secret, accountName: '4230306' });
assert(uri.startsWith('otpauth://totp/'), 'uri: otpauth scheme');
assert(uri.includes('issuer=UST-Legazpi'), 'uri: issuer present');
assert(uri.includes(secret), 'uri: secret embedded');
const qr = await buildQrDataUrl(uri);
assert(qr.startsWith('data:image/png;base64,'), 'qr: png data url');

// ── models expose the new fields ──
const { default: mongoose } = await import('mongoose');
const UserSchema = (await import('./src/models/user.model.js')).default ? null : null;
const u = (await import('./src/models/user.model.js'));
const Counselor = (await import('./src/models/counselor.model.js'));
// Just importing them registers schemas; verify paths exist via schema introspection.
const userPaths = u.default.schema ? u.default.schema.paths : null;
if (userPaths) {
  assert(!!userPaths.totpSecret, 'user model: totpSecret path');
  assert(!!userPaths.totpEnabled, 'user model: totpEnabled path');
}
const cPaths = Counselor.default.schema.paths;
assert(!!cPaths.totpSecret, 'counselor model: totpSecret path');
assert(!!cPaths.totpEnabled, 'counselor model: totpEnabled path');

console.log('ALL PASS');
process.exit(0);
