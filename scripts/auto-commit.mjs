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

// Infer scope from directory structure
const scopes = new Set();
for (const filePath of [...added, ...modified, ...deleted]) {
  const parts = filePath.split("/");
  if (parts.length >= 2) {
    // Use top-level dir (frontend, backend) or file area
    if (["frontend", "backend"].includes(parts[0])) {
      if (parts.length >= 3) scopes.add(parts.slice(0, 2).join("/"));
      else scopes.add(parts[0]);
    } else {
      scopes.add(parts[0]);
    }
  }
}

// Conventional Commit type inference
function inferType() {
  const allPaths = [...added, ...modified, ...deleted].join(" ").toLowerCase();

  // Prioritized rules
  if (/test|spec|__test__|\.test\.|\.spec\./i.test(allPaths)) return "test";
  if (/readme|docs?|\.md$/i.test(allPaths) && added.length > 0 && modified.length === 0) return "docs";
  if (/config|\.env|package|tsconfig|vite|eslint|\.prettier/i.test(allPaths)) return "chore";
  if (/style|css|tailwind|theme|color|font|\.scss|\.less/i.test(allPaths)) return "style";
  if (/ci|\.github|dockerfile|docker-compose|\.yml|\.yaml/i.test(allPaths)) return "ci";

  // Default: feat for new files, fix for modifications, refactor for mixed
  if (added.length > 0 && modified.length === 0 && deleted.length === 0) return "feat";
  if (deleted.length > 0 && added.length === 0) return "refactor";
  if (modified.length > added.length) return "fix";
  return "feat";
}

const type = inferType();
const scope = scopes.size === 1 ? [...scopes][0] : scopes.size > 1 ? "multi" : "";

// Build concise file summary
const totalFiles = added.length + modified.length + deleted.length;
const summaryParts = [];
if (added.length) summaryParts.push(`${added.length} file${added.length > 1 ? "s" : ""} added`);
if (modified.length) summaryParts.push(`${modified.length} file${modified.length > 1 ? "s" : ""} modified`);
if (deleted.length) summaryParts.push(`${deleted.length} file${deleted.length > 1 ? "s" : ""} deleted`);
const summary = summaryParts.join(", ");

// Build body with file details
const bodyLines = [];

const formatFile = (filePath, label) => {
  const parts = filePath.split("/");
  const shortPath = parts.length > 3 ? ".../" + parts.slice(-2).join("/") : parts.join("/");
  return `  ${label} ${shortPath}`;
};

if (added.length) {
  bodyLines.push("");
  bodyLines.push("Added:");
  added.forEach((f) => bodyLines.push(formatFile(f, "+")));
}
if (modified.length) {
  bodyLines.push("");
  bodyLines.push("Modified:");
  modified.forEach((f) => bodyLines.push(formatFile(f, "~")));
}
if (deleted.length) {
  bodyLines.push("");
  bodyLines.push("Deleted:");
  deleted.forEach((f) => bodyLines.push(formatFile(f, "-")));
}

// Construct message
const scopePart = scope ? `(${scope})` : "";
let subject = `${type}${scopePart}: ${summary}`;
if (subject.length > 72) subject = subject.slice(0, 69) + "...";

const body = bodyLines.length > 0 ? bodyLines.join("\n") : "";
const message = body ? `${subject}\n${body}` : subject;

// Output
if (process.argv.includes("--commit")) {
  execSync("git add -A", { encoding: "utf-8" });
  const recheck = execSync("git diff --cached --stat", { encoding: "utf-8" }).trim();
  if (!recheck) {
    console.error("No staged changes to commit.");
    process.exit(1);
  }
  execSync(`git commit -m ${JSON.stringify(message)}`, { encoding: "utf-8" });
  console.log(`Committed:\n${message}`);
} else {
  console.log(message);
}
