#!/usr/bin/env node
/**
 * 为 go-deepseek.com 文章批量补站内 pillar 内链
 * 用法: node tools/add-internal-links.js [--dry-run]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "content");
const DRY_RUN = process.argv.includes("--dry-run");

const PILLARS = [
  {
    path: "/jiqiao/deepseek-api-first-request/",
    label: "API 第一次请求",
    keywords: ["api", "429", "限流", "token", "密钥", "key", "rpm", "tpm", "配额", "用量", "platform", "接口", "请求"],
  },
  {
    path: "/jiqiao/deepseek-prompt-writing/",
    label: "提示词怎么写",
    keywords: ["提示词", "prompt", "幻觉", "few-shot", "指令", "约束", "rag", "口吻", "模板"],
  },
  {
    path: "/jiqiao/deepseek-windows-install/",
    label: "Windows 安装",
    keywords: ["windows", "win10", "win11", "安装", "下载", "exe", "桌面", "客户端"],
  },
  {
    path: "/jiqiao/deepseek-macos-setup/",
    label: "macOS 配置",
    keywords: ["macos", "mac", "ollama", "本地", "离线", "苹果", "brew", "终端"],
  },
  {
    path: "/jiqiao/deepseek-code-review/",
    label: "用 DeepSeek 读代码",
    keywords: ["代码", "code", "review", "调试", "debug", "函数", "报错", "日志", "git"],
  },
  {
    path: "/jiqiao/deepseek-excel-workflow/",
    label: "DeepSeek 处理 Excel",
    keywords: ["excel", "表格", "csv", "xlsx", "数据", "公式", "透视", "清洗"],
  },
];

const DEFAULT_PILLARS = [PILLARS[0], PILLARS[1], PILLARS[4]];

const SECTION_HEADER = "## 延伸阅读";

const PILLAR_SKIP = new Set([
  "deepseek-api-first-request.md",
  "deepseek-prompt-writing.md",
  "deepseek-windows-install.md",
  "deepseek-macos-setup.md",
  "deepseek-code-review.md",
  "deepseek-excel-workflow.md",
]);

function splitFrontMatter(raw) {
  if (!raw.startsWith("---")) return { fm: "", body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { fm: "", body: raw };
  return {
    fm: raw.slice(0, end + 4),
    body: raw.slice(end + 4).replace(/^\s+/, ""),
  };
}

function parseTitle(fm) {
  const m = fm.match(/^title:\s*"(.*)"/m);
  return m ? m[1] : "";
}

function parseDescription(fm) {
  const m = fm.match(/^description:\s*"(.*)"/m);
  return m ? m[1] : "";
}

function scorePillars(text) {
  const lower = text.toLowerCase();
  return PILLARS.map((p) => {
    let score = 0;
    for (const kw of p.keywords) {
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const hits = lower.match(re);
      if (hits) score += hits.length;
    }
    return { pillar: p, score };
  }).sort((a, b) => b.score - a.score);
}

function pickPillars(title, description, body, fileName) {
  const haystack = `${title}\n${description}\n${body.slice(0, 2000)}`;
  const ranked = scorePillars(haystack).filter((x) => x.score > 0);

  const chosen = [];
  for (const { pillar } of ranked) {
    if (chosen.length >= 3) break;
    const slug = pillar.path.replace(/^\/jiqiao\/|\//g, "");
    if (fileName.includes(slug)) continue;
    if (!chosen.some((c) => c.path === pillar.path)) chosen.push(pillar);
  }

  if (chosen.length < 2) {
    for (const p of DEFAULT_PILLARS) {
      if (chosen.length >= 3) break;
      if (!chosen.some((c) => c.path === p.path)) chosen.push(p);
    }
  }

  return chosen.slice(0, 3);
}

function buildSection(pillars) {
  const lines = pillars.map((p) => `- [${p.label}](${p.path})`);
  return `\n${SECTION_HEADER}\n\n若需进一步查阅，可先看本站以下教程：\n\n${lines.join("\n")}\n`;
}

function injectIntroLink(body, pillars) {
  if (/\]\(\/jiqiao\//.test(body.split("\n").slice(0, 8).join("\n"))) return body;
  const first = pillars[0];
  if (!first) return body;
  const intro = `下文涉及 DeepSeek 实操细节；若你尚未完成基础配置，可先阅读 [${first.label}](${first.path})。\n\n`;
  const lines = body.split("\n");
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      insertAt = i;
      break;
    }
    if (lines[i].trim() && !lines[i].startsWith("#")) {
      insertAt = i + 1;
      break;
    }
  }
  if (insertAt === 0 && lines[0]?.trim()) insertAt = 1;
  lines.splice(insertAt, 0, intro.trim(), "");
  return lines.join("\n");
}

function processFile(filePath) {
  const fileName = path.basename(filePath);
  if (PILLAR_SKIP.has(fileName)) {
    return { fileName, status: "skip-pillar" };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const { fm, body } = splitFrontMatter(raw);

  if (body.includes(SECTION_HEADER)) {
    return { fileName, status: "skip-has-section" };
  }

  const title = parseTitle(fm);
  const description = parseDescription(fm);
  const pillars = pickPillars(title, description, body, fileName);
  if (!pillars.length) return { fileName, status: "skip-no-pillars" };

  let newBody = body.replace(new RegExp(`\\n${SECTION_HEADER}[\\s\\S]*$`), "").trimEnd();
  const hasInline = /\]\(\/jiqiao\//.test(newBody);
  if (!hasInline) newBody = injectIntroLink(newBody, pillars);
  newBody += buildSection(pillars);

  const updated = `${fm}\n\n${newBody.replace(/^\n+/, "")}`;
  if (!DRY_RUN) fs.writeFileSync(filePath, updated.endsWith("\n") ? updated : `${updated}\n`, "utf-8");
  return { fileName, status: "updated", pillars: pillars.map((p) => p.path) };
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const results = files.map((f) => processFile(path.join(POSTS_DIR, f)));

const updated = results.filter((r) => r.status === "updated");
const skipped = results.filter((r) => r.status !== "updated");

console.log(DRY_RUN ? "DRY RUN\n" : "");
console.log(`处理完成: 更新 ${updated.length} 篇, 跳过 ${skipped.length} 篇`);
if (updated.length) {
  console.log("\n示例:");
  updated.slice(0, 5).forEach((r) => console.log(`  ${r.fileName} → ${r.pillars.join(", ")}`));
}
