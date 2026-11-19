import test from "node:test";
import assert from "node:assert/strict";
import JournalEntry from "../src/models/journalEntry.model.js";
import { updateEntry } from "../src/controllers/journal.controller.js";

const call = async (body, user = { _id: 7 }) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await updateEntry({ params: { id: "e1" }, user, body }, res);
  return res;
};

test("journal edit: owner-scoped, only title/content/mood, validated", async (t) => {
  const seen = [];
  t.mock.method(JournalEntry, "findOneAndUpdate", async (filter, update) => { seen.push({ filter, update }); return { _id: "e1", ...update.$set }; });

  const ok = await call({ title: " New ", content: " Body ", mood: "low", studentId: 999, date: "01-01-2000" });
  assert.equal(ok.code, 200);
  assert.deepEqual(seen[0].filter, { _id: "e1", studentId: 7 });
  assert.deepEqual(seen[0].update.$set, { title: "New", content: "Body", mood: "low" });

  assert.equal((await call({ title: "", content: "x" })).code, 400);
  assert.equal((await call({ title: { $ne: 1 }, content: "x" })).code, 400);
  assert.equal((await call({ title: "a", content: "b", mood: "furious" })).code, 400);
  assert.equal((await call({ title: "a", content: "b", mood: "constructor" })).code, 400);
  assert.equal(seen.length, 1);
});
