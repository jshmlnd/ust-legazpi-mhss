// Print the current TOTP code for a user's enrolled secret (for UI testing).
// Run: node totp-code.js <userId>
import fs from "node:fs";
import mongoose from "mongoose";
import * as otplib from "otplib";

const env = fs.readFileSync(".env", "utf8");
const read = (k) => {
  const m = env.match(new RegExp(`^${k}\\s*=\\s*(.*)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^"(.*)"$/, "$1");
};
process.env.TOTP_ENCRYPTION_KEY = read("TOTP_ENCRYPTION_KEY");

await mongoose.connect(read("MONGODB_URI"));
const User = (await import("./src/models/user.model.js")).default;
const { decryptSecret } = await import("./src/lib/totp.js");
const acct = await User.findById(Number(process.argv[2] || 70928));
if (!acct?.totpSecret) {
  console.error("no TOTP secret on account");
  process.exit(1);
}
console.log(await otplib.generate({ secret: decryptSecret(acct.totpSecret) }));
await mongoose.disconnect();
process.exit(0);
