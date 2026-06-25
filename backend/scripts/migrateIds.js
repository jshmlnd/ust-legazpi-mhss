import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const generateId = () => Math.floor(10000 + Math.random() * 90000);

const getUniqueId = async (usedIds) => {
  let id;
  do {
    id = generateId();
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
};

const migrateDocs = async (Model, label, usedIds) => {
  const docs = await Model.find({}).lean();
  let migrated = 0;

  for (const doc of docs) {
    const oldId = doc._id;
    if (typeof oldId === "number") {
      usedIds.add(oldId);
      continue;
    }
    const newId = await getUniqueId(usedIds);

    // Drop the old doc first to free unique-index values, then insert with the new numeric _id
    await Model.deleteOne({ _id: oldId });
    await Model.create({ ...doc, _id: newId });
    migrated++;
    console.log(`    ${String(oldId).slice(-8)} -> ${newId}`);
  }
  console.log(`  Migrated ${migrated} ${label} documents`);
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  const usedIds = new Set();

  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false, _id: false }));
  const Counselor = mongoose.model("Counselor", new mongoose.Schema({}, { strict: false, _id: false }));
  const Message = mongoose.model("Message", new mongoose.Schema({}, { strict: false }));

  await migrateDocs(User, "User", usedIds);
  await migrateDocs(Counselor, "Counselor", usedIds);

  const messages = await Message.find({}).lean();
  let updatedMsg = 0;
  for (const msg of messages) {
    const update = {};
    if (msg.senderId && typeof msg.senderId !== "number") {
      update.senderId = parseInt(String(msg.senderId).slice(-5), 10) || generateId();
    }
    if (msg.receiverId && typeof msg.receiverId !== "number") {
      update.receiverId = parseInt(String(msg.receiverId).slice(-5), 10) || generateId();
    }
    if (Object.keys(update).length > 0) {
      await Message.updateOne({ _id: msg._id }, { $set: update });
      updatedMsg++;
    }
  }
  console.log(`  Updated ${updatedMsg} message references`);

  console.log("\nMigration complete");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
