#!/usr/bin/env node
import { execSync } from "child_process";

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
  const shortPath = filePath.length > 50 ? "..." + filePath.slice(-47) : filePath;
  if (status === "A") added.push(shortPath);
  else if (status === "M") modified.push(shortPath);
  else if (status === "D") deleted.push(shortPath);
  else modified.push(shortPath);
}

const scopes = new Set();
for (const line of lines) {
  const [, ...pathParts] = line.split("\t");
  const filePath = pathParts.join("\t");
  const parts = filePath.split("/");
  if (parts.length > 1) scopes.add(parts[0]);
}

// Get per-file diffs
const changes = [];
const fileDiffs = execSync("git diff --cached", { encoding: "utf-8", maxBuffer: 1024 * 1024 })
  .split(/^diff --git /m).slice(1);

for (const block of fileDiffs) {
  const headerMatch = block.match(/^a\/(.+?)\s+b\/(.+)/);
  if (!headerMatch) continue;
  const filePath = headerMatch[2];
  const fileName = filePath.split("/").pop();

  // Extract only actual code lines (lines starting with + or - that are not diff metadata)
  // Also skip lines that contain detection regex patterns (avoid self-referencing)
  const codeLines = block.split("\n").filter((l) => {
    if (l.startsWith("+++") || l.startsWith("---")) return false;
    if (!l.startsWith("+") && !l.startsWith("-")) return false;
    const content = l.slice(1);
    // Skip lines that are part of the detection logic itself
    if (/features\.push\(/.test(content)) return false;
    if (/if\s*\(\/.*\/\.test\(/.test(content)) return false;
    return true;
  });
  const addedLines = codeLines.filter((l) => l.startsWith("+")).length;
  const removedLines = codeLines.filter((l) => l.startsWith("-")).length;

  // Analyze only actual code content (strip the +/- prefix)
  const codeContent = codeLines.map((l) => l.slice(1)).join("\n");

  const features = [];
  if (/^\s*import\s/.test(codeContent) || /from\s+["']/.test(codeContent)) features.push("imports");
  if (/export\s+(default\s+)?/.test(codeContent)) features.push("exports");
  if (/console\.(log|error|warn)\(/.test(codeContent)) features.push("logging");
  if (/\buseState\b|\buseEffect\b|\buseCallback\b|\buseRef\b/.test(codeContent)) features.push("React hooks");
  if (/\buseCallStore\b|\buseChatStore\b|\buseAuthStore\b/.test(codeContent)) features.push("store");
  if (/axios|fetch\(|\/api\//.test(codeContent)) features.push("API");
  if (/socket\.(emit|on)\(/.test(codeContent)) features.push("socket");
  if (/toast\.(success|error|loading)\(/.test(codeContent)) features.push("toast");
  if (/navigate|useNavigate/.test(codeContent)) features.push("routing");
  if (/className/.test(codeContent)) features.push("styles");
  if (/try\s*\{/.test(codeContent)) features.push("error handling");
  if (/\basync\s|\bawait\s/.test(codeContent)) features.push("async");
  if (/\bset[A-Z]\(|\.setState\(|updateMany|findById/.test(codeContent)) features.push("state/data");
  if (/onClick|onChange|onSubmit/.test(codeContent)) features.push("events");
  if (/\/api\/message|\/api\/auth|\/api\/agora/.test(codeContent)) features.push("endpoints");

  const change = [];
  if (addedLines) change.push(`+${addedLines}`);
  if (removedLines) change.push(`-${removedLines}`);

  changes.push({
    file: fileName,
    shortPath: filePath.length > 40 ? "..." + filePath.slice(-37) : filePath,
    added: addedLines,
    removed: removedLines,
    features: [...new Set(features)].slice(0, 4),
    change: change.join("/"),
  });
}

function inferType() {
  const allPaths = lines.map((l) => { const [, ...p] = l.split("\t"); return p.join("\t"); }).join(" ").toLowerCase();
  if (/test|spec|__test__/.test(allPaths)) return "test";
  if (/readme|docs?|\.md$/i.test(allPaths) && added.length > 0 && modified.length === 0) return "docs";
  if (/style|css|tailwind|theme|color|font/i.test(allPaths)) return "style";
  if (/config|\.env|package|tsconfig|vite|eslint/i.test(allPaths)) return "chore";
  return null;
}

const type = inferType() || (added.length > 0 && modified.length === 0 && deleted.length === 0 ? "feat"
  : deleted.length > 0 && added.length === 0 ? "remove"
  : "update");

const scope = scopes.size === 1 ? [...scopes][0] : scopes.size > 1 ? "multiple" : "";
const scopePart = scope ? `(${scope})` : "";

const stats = [];
if (added.length) stats.push(`+${added.length} new`);
if (modified.length) stats.push(`~${modified.length} modified`);
if (deleted.length) stats.push(`-${deleted.length} removed`);

const allFeatures = [...new Set(changes.flatMap((c) => c.features))].slice(0, 5);
const featureStr = allFeatures.length > 0 ? ` [${allFeatures.join(", ")}]` : "";

let subject = `${type}${scopePart}: ${stats.join(", ")}${featureStr}`;
if (subject.length > 72) subject = subject.slice(0, 69) + "...";

const bodyLines = ["", "Files changed:"];
for (const c of changes.slice(0, 8)) {
  const featStr = c.features.length > 0 ? ` (${c.features.join(", ")})` : "";
  bodyLines.push(`  ${c.shortPath}${featStr}: ${c.change}`);
}
if (changes.length > 8) bodyLines.push(`  ...and ${changes.length - 8} more files`);

const body = bodyLines.join("\n");

if (process.argv.includes("--commit")) {
  execSync("git add -A", { encoding: "utf-8" });
  const newDiff = execSync("git diff --cached --stat", { encoding: "utf-8" }).trim();
  if (!newDiff) {
    console.error("No staged changes to commit.");
    process.exit(1);
  }
  const msg = subject + body;
  execSync(`git commit -m ${JSON.stringify(msg)}`, { encoding: "utf-8" });
  console.log(`Committed:\n${subject}\n${body}`);
} else {
  console.log(subject + body);
}
