import mongoose from "mongoose";
import dotenv from "dotenv";
import { generateDynamicCode } from "../src/lib/generateId.js";

dotenv.config();

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false, _id: false }));

  const existing = new Set(
    (await User.find({ dynamicId: { $exists: true } }, { dynamicId: 1 }).lean()).map((u) => u.dynamicId)
  );

  const users = await User.find({ $or: [{ dynamicId: { $exists: false } }, { dynamicId: null }] }).lean();
  let backfilled = 0;

  for (const user of users) {
    let code;
    do {
      code = generateDynamicCode();
    } while (existing.has(code));
    existing.add(code);

    await User.updateOne({ _id: user._id }, { $set: { dynamicId: code } });
    backfilled++;
    console.log(`    ${user._id} -> ${code}`);
  }

  console.log(`\nBackfilled ${backfilled} users with a dynamicId`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
