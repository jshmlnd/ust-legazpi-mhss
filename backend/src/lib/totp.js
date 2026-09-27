// ── TOTP (Google Authenticator) helpers ──
// otplib v13 functional API. Secrets are encrypted at rest with AES-256-GCM
// using TOTP_ENCRYPTION_KEY (32-byte hex or passphrase) so a database leak
// alone cannot produce usable authenticator secrets.
import crypto from "node:crypto";
import { generateSecret, generate, verify, generateURI } from "otplib";
import QRCode from "qrcode";

const ALGO = "aes-256-gcm";

function getKey() {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) throw new Error("TOTP_ENCRYPTION_KEY not set");
  // 32-byte hex key preferred; otherwise derive one from the passphrase.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw).digest();
}

// Output: iv.tag.ciphertext (all base64url)
export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(payload) {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function createTotpSecret() {
  return generateSecret();
}

export function buildOtpAuthUri({ secret, accountName, issuer = "UST-Legazpi MHS" }) {
  return generateURI({
    issuer,
    label: accountName,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
}

export async function buildQrDataUrl(uri) {
  return QRCode.toDataURL(uri, { width: 220, margin: 1 });
}

// ±1 time step (30s each side) for clock drift between server and phone.
export async function verifyTotpToken(secret, token) {
  if (!token || !/^\d{6}$/.test(token)) return { valid: false };
  try {
    const result = await verify({ secret, token, epochTolerance: 30 });
    return { valid: !!result.valid };
  } catch {
    return { valid: false };
  }
}
