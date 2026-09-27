// One-off E2E check of POST /api/auth/2fa/verify (TOTP branch) against the
// running dev server. Run: node test-totp-login.js
import fs from "node:fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import * as otplib from "otplib";

const env = fs.readFileSync(".env", "utf8");
const read = (k) => {
  const m = env.match(new RegExp(`^${k}\\s*=\\s*(.*)$`, "m"));
  if (!m) return null;
  const v = m[1].trim();
  return v.replace(/^"(.*)"$/, "$1");
};

process.env.TOTP_ENCRYPTION_KEY = read("TOTP_ENCRYPTION_KEY");
const jwtSecret = read("JWT_SECRET");
const mongoUri = read("MONGODB_URI");

const USER_ID = Number(process.argv[2] || 70928);
const BASE = "http://localhost:5001/api";

await mongoose.connect(mongoUri);
const User = (await import("./src/models/user.model.js")).default;
const { decryptSecret } = await import("./src/lib/totp.js");

const acct = await User.findById(USER_ID);
if (!acct?.totpEnabled) {
  console.error("account not TOTP-enabled — enroll first");
  process.exit(1);
}
const secret = decryptSecret(acct.totpSecret);
const twoFactorToken = jwt.sign({ userId: USER_ID, twoFactor: true }, jwtSecret, { expiresIn: "10m" });

const post = (body) =>
  fetch(`${BASE}/auth/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// correct code → 200 + user payload + cookie
const code = await otplib.generate({ secret });
const ok = await post({ twoFactorToken, pin: code });
const okBody = await ok.json().catch(() => ({}));
console.log("correct code:", ok.status, JSON.stringify({
  fullName: okBody.fullName,
  totpEnabled: okBody.totpEnabled,
  cookie: !!ok.headers.get("set-cookie"),
}));
if (ok.status !== 200 || !ok.headers.get("set-cookie")) {
  console.error("FAIL: correct code rejected");
  process.exit(1);
}

// wrong code → 401
const bad = await post({ twoFactorToken, pin: "000000" });
const badBody = await bad.json().catch(() => ({}));
console.log("wrong code:", bad.status, badBody.message);
if (bad.status !== 401) {
  console.error("FAIL: wrong code accepted");
  process.exit(1);
}

// stale token (not a twoFactor token) → 401
const stale = jwt.sign({ userId: USER_ID }, jwtSecret, { expiresIn: "10m" });
const sres = await post({ twoFactorToken: stale, pin: code });
console.log("non-2FA token:", sres.status);
if (sres.status !== 401) {
  console.error("FAIL: non-2FA token accepted");
  process.exit(1);
}

console.log("ALL PASS");
await mongoose.disconnect();
process.exit(0);
