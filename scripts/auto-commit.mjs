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
  if (status === "A") added.push(filePath);
  else if (status === "M") modified.push(filePath);
  else if (status === "D") deleted.push(filePath);
  else modified.push(filePath);
}

// Get actual code changes to infer what was done
let fullDiff = "";
try {
  fullDiff = execSync("git diff --cached", { encoding: "utf-8", maxBuffer: 1024 * 1024 });
} catch { /* ignore */ }

// Extract added/removed code lines (skip diff metadata)
const codeLines = fullDiff.split("\n").filter((l) => {
  if (l.startsWith("+++") || l.startsWith("---")) return false;
  if (!l.startsWith("+") && !l.startsWith("-")) return false;
  const content = l.slice(1);
  if (/features\.push\(/.test(content)) return false;
  if (/if\s*\(\/.*\/\.test\(/.test(content)) return false;
  return true;
});
const codeContent = codeLines.map((l) => l.slice(1)).join("\n");
const addedCode = codeLines.filter((l) => l.startsWith("+")).map((l) => l.slice(1)).join("\n");
const removedCode = codeLines.filter((l) => l.startsWith("-")).map((l) => l.slice(1)).join("\n");

// Conventional Commit type
function inferType() {
  const allPaths = [...added, ...modified, ...deleted].join(" ").toLowerCase();
  if (/test|spec|__test__|\.test\.|\.spec\./i.test(allPaths)) return "test";
  if (/readme|docs?|\.md$/i.test(allPaths) && added.length > 0 && modified.length === 0) return "docs";
  if (/config|\.env|package|tsconfig|vite|eslint|\.prettier/i.test(allPaths)) return "chore";
  if (/style|css|tailwind|theme|color|font|\.scss|\.less/i.test(allPaths)) return "style";
  if (/ci|\.github|dockerfile|docker-compose/i.test(allPaths)) return "ci";

  // Infer from code changes
  const allCode = codeContent.toLowerCase();
  if (/\bfix\b|\bbug\b|\berror\b|\bpatch\b|\bissue\b|\bresolve\b/.test(allCode)) return "fix";
  if (/\bremove\b|\bdelete\b|\bdrop\b|\bstrip\b/.test(allCode) && removedCode.length > addedCode.length) return "refactor";

  if (added.length > 0 && modified.length === 0 && deleted.length === 0) return "feat";
  if (deleted.length > 0 && added.length === 0) return "refactor";
  return "update";
}

const type = inferType();

// Generate a concise description from the changes
function describe() {
  const allPaths = [...added, ...modified, ...deleted];

  // Single file changes — describe specifically
  if (allPaths.length === 1) {
    const filePath = allPaths[0];
    const fileName = filePath.split("/").pop().replace(/\.[^.]+$/, "");

    if (added.length === 1) {
      // What was added?
      if (/controller|route|model|middleware/i.test(fileName)) return `add ${fileName}`;
      if (/component|page|modal|form/i.test(fileName)) return `add ${fileName}`;
      if (/store|lib|util|helper/i.test(fileName)) return `add ${fileName}`;
      return `add ${fileName}`;
    }
    if (deleted.length === 1) return `remove ${fileName}`;

    // Modified — describe what changed in code
    const hints = [];
    if (/import\s/.test(addedCode) && !/import\s/.test(removedCode)) hints.push("add imports");
    if (/import\s/.test(removedCode) && !/import\s/.test(addedCode)) hints.push("remove imports");
    if (/export\s/.test(addedCode)) hints.push("add export");
    if (/console\.(log|error|warn)/.test(addedCode) && !/console\.(log|error|warn)/.test(removedCode)) hints.push("add logging");
    if (/console\.(log|error|warn)/.test(removedCode) && !/console\.(log|error|warn)/.test(addedCode)) hints.push("remove logging");
    if (/toast\.(success|error|loading)/.test(addedCode)) hints.push("add toast");
    if (/try\s*\{/.test(addedCode) && !/try\s*\{/.test(removedCode)) hints.push("add error handling");
    if (/async\s|await\s/.test(addedCode) && !/async\s|await\s/.test(removedCode)) hints.push("add async");
    if (/socket\.(emit|on)/.test(addedCode) && !/socket\.(emit|on)/.test(removedCode)) hints.push("add socket events");
    if (/className/.test(addedCode) && !/className/.test(removedCode)) hints.push("add styles");
    if (/\bnull\b/.test(addedCode) && /\bnull\b/.test(removedCode)) hints.push("null handling");
    if (/\bnew\b/.test(addedCode) && !/\bnew\b/.test(removedCode)) hints.push("add instantiation");

    if (hints.length > 0) return `${hints.slice(0, 2).join(" and ")} in ${fileName}`;
    return `update ${fileName}`;
  }

  // Multi-file changes — describe by scope
  const dirs = new Set(allPaths.map((p) => p.split("/")[0]));
  const scopes = [...dirs].filter((d) => ["frontend", "backend"].includes(d));

  if (scopes.length === 1) {
    const area = scopes[0];
    const subDirs = new Set(
      allPaths.filter((p) => p.startsWith(area + "/")).map((p) => p.split("/")[1])
    );
    if (subDirs.size === 1) return `update ${area}/${[...subDirs][0]}`;
    return `update ${area}`;
  }

  if (dirs.size === 1) return `update ${[...dirs][0]}`;
  return `update ${allPaths.length} files`;
}

const subject = `${type}: ${describe()}`;

if (process.argv.includes("--commit")) {
  execSync("git add -A", { encoding: "utf-8" });
  const recheck = execSync("git diff --cached --stat", { encoding: "utf-8" }).trim();
  if (!recheck) {
    console.error("No staged changes to commit.");
    process.exit(1);
  }
  execSync(`git commit -m ${JSON.stringify(subject)}`, { encoding: "utf-8" });
  console.log(`Committed: ${subject}`);
} else {
  console.log(subject);
}
