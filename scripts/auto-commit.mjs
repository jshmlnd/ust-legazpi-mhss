#!/usr/bin/env node
import { execSync } from "child_process";

const staged = execSync("git diff --cached --stat", { encoding: "utf-8" }).trim();
const diff = execSync("git diff --cached --name-status", { encoding: "utf-8" }).trim();

if (!diff) {
  console.error("No staged changes to commit.");
  process.exit(1);
}

const lines = diff.split("\n").filter(Boolean);
const added = [], modified = [], deleted = [];

for (const line of lines) {
  const [status, ...pathParts] = line.split("\t");
  const filePath = pathParts.join("\t");
  const fileName = filePath.split("/").pop();
  const shortPath = filePath.length > 50 ? "..." + filePath.slice(-47) : filePath;

  if (status === "A") added.push(shortPath);
  else if (status === "M") modified.push(shortPath);
  else if (status === "D") deleted.push(shortPath);
  else modified.push(shortPath);
}

const scopes = new Set();
const extensions = new Set();
for (const line of lines) {
  const [, ...pathParts] = line.split("\t");
  const filePath = pathParts.join("\t");
  const parts = filePath.split("/");
  if (parts.length > 1) scopes.add(parts[0]);
  const ext = filePath.split(".").pop();
  if (ext && ext.length < 6) extensions.add(ext);
}

function inferType() {
  const allPaths = lines.map((l) => { const [, ...p] = l.split("\t"); return p.join("\t"); }).join(" ").toLowerCase();
  if (/test|spec|__test__/.test(allPaths)) return "test";
  if (/readme|docs?|\.md$/i.test(allPaths) && added.length > 0 && modified.length === 0) return "docs";
  if (/fix|bug|error|patch/i.test(allPaths)) return "fix";
  if (/style|css|tailwind|theme|color|font/i.test(allPaths)) return "style";
  if (/config|\.env|package|tsconfig|vite|eslint/i.test(allPaths)) return "chore";
  return null;
}

const type = inferType() || (added.length > 0 && modified.length === 0 && deleted.length === 0 ? "feat"
  : deleted.length > 0 && added.length === 0 ? "remove"
  : modified.length > added.length ? "update"
  : "update");

const scope = scopes.size === 1 ? [...scopes][0] : scopes.size > 1 ? "multiple" : "";
const scopePart = scope ? `(${scope})` : "";

const total = added.length + modified.length + deleted.length;
const parts = [];
if (added.length) parts.push(`+${added.length} new`);
if (modified.length) parts.push(`~${modified.length} modified`);
if (deleted.length) parts.push(`-${deleted.length} removed`);
const summary = parts.join(", ");

const keyFiles = [...added, ...modified].slice(0, 3).map((f) => f.split("/").pop().replace(/\.[^.]+$/, ""));
const detail = keyFiles.length > 0 ? keyFiles.join(", ") : "";

let subject = `${type}${scopePart}: ${summary}`;
if (detail) subject += ` — ${detail}`;
if (subject.length > 72) subject = subject.slice(0, 69) + "...";

// If called with --commit flag, stage all and commit
if (process.argv.includes("--commit")) {
  execSync("git add -A", { encoding: "utf-8" });
  // Check if there's anything staged after re-staging
  const newDiff = execSync("git diff --cached --stat", { encoding: "utf-8" }).trim();
  if (!newDiff) {
    console.error("No staged changes to commit.");
    process.exit(1);
  }
  execSync(`git commit -m "${subject.replace(/"/g, '\\"')}"`, { encoding: "utf-8" });
  console.log(`Committed: ${subject}`);
} else {
  console.log(subject);
}
