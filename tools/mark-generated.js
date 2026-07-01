#!/usr/bin/env node
/**
 * 为 dated 自动文章批量添加 generated: true
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "content");

function processFile(filePath) {
  const fileName = path.basename(filePath);
  if (!/^\d{4}-\d{2}-\d{2}-/.test(fileName)) return "skip";
  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.startsWith("---")) return "skip";
  if (/^generated:\s*true/m.test(raw)) return "skip";
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return "skip";
  const fm = raw.slice(0, end + 4);
  const body = raw.slice(end + 4);
  const updated = fm.replace(/\n---$/, "\ngenerated: true\n---") + body;
  fs.writeFileSync(filePath, updated, "utf-8");
  return "updated";
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const results = files.map((f) => processFile(path.join(POSTS_DIR, f)));
console.log(`marked generated: ${results.filter((r) => r === "updated").length} files`);
