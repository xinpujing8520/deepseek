import { GoogleGenAI } from "@google/genai";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const countArg = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] || 1);
const maxPosts = Math.min(9, Math.max(1, Number.isFinite(countArg) ? countArg : 1));
const apiKey = process.env.GEMINI_API_KEY;

const FORBIDDEN_PHRASES = [
  "综上所述",
  "毋庸置疑",
  "在当今数字化时代",
  "业界领先",
  "全方位",
  "深度融合",
  "极致",
  "seo",
  "关键词",
  "优化",
  "排名",
  "收录",
  "曝光",
  "站群",
  "友链",
];

const PILLAR_PATHS = [
  "/jiqiao/deepseek-api-first-request/",
  "/jiqiao/deepseek-prompt-writing/",
  "/jiqiao/deepseek-windows-install/",
  "/jiqiao/deepseek-macos-setup/",
  "/jiqiao/deepseek-code-review/",
  "/jiqiao/deepseek-excel-workflow/",
];

const ARTICLE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
    category: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    body: { type: "string" },
  },
  required: ["title", "description", "slug", "tags", "body"],
};

function stripCodeFence(text) {
  return String(text || "")
    .trim()
    .replace(/^```(?:json|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonResponse(text) {
  const clean = stripCodeFence(text);
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("无法解析 JSON");
    return JSON.parse(match[0]);
  }
}

function removeForbiddenPhrases(value) {
  let output = String(value || "");
  for (const phrase of FORBIDDEN_PHRASES) {
    output = output.split(phrase).join("");
  }
  output = output.replace(/^随着[^。\n]{0,40}(?:快速)?发展[，,。]\s*/i, "");
  output = output.replace(/^在当今[^。\n]{0,60}[，,。]\s*/i, "");
  return output.trim();
}

function slugify(value, fallback) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/deepseek/g, "deepseek")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || fallback;
}

function yamlEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

function todayStr() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${year}-${month}-${day}`;
}

async function loadImagePool() {
  try {
    const raw = await readFile("images.txt", "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("/static/images/"));
  } catch {
    return [];
  }
}

function pickImages(pool) {
  if (pool.length >= 2) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }
  if (pool.length === 1) return [pool[0], pool[0]];
  return [];
}

async function loadKeywords() {
  try {
    const raw = await readFile("keywords.json", "utf8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function saveKeywords(keywords) {
  await writeFile("keywords.json", `${JSON.stringify(keywords, null, 2)}\n`, "utf8");
}

async function generateWithRetry(ai, contents, config) {
  let retryCount = 0;
  const maxRetries = 3;
  while (retryCount < maxRetries) {
    try {
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents, config });
      if (response?.text) return response.text;
      throw new Error("Gemini 返回内容为空");
    } catch (error) {
      retryCount += 1;
      const errMsg = String(error.message || "").toLowerCase();
      if ((errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("unavailable")) && retryCount < maxRetries) {
        await new Promise((res) => setTimeout(res, 5000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Gemini 重试后仍失败");
}

async function generateJson(ai, prompt) {
  const text = await generateWithRetry(ai, prompt, {
    responseMimeType: "application/json",
    responseJsonSchema: ARTICLE_JSON_SCHEMA,
  });
  return parseJsonResponse(text);
}

function normalizeArticle(article, topic) {
  const safe = article && typeof article === "object" ? article : {};
  const title = removeForbiddenPhrases(safe.title || topic);
  const description = removeForbiddenPhrases(
    safe.description || `围绕${topic}整理一篇偏实操的 DeepSeek 使用笔记。`
  );
  const slug = slugify(safe.slug, slugify(topic, "deepseek-note"));
  const tags = [...new Set(["deepseek", ...(Array.isArray(safe.tags) ? safe.tags : [])])]
    .map((tag) => String(tag || "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  const body = removeForbiddenPhrases(safe.body || "");
  const category = removeForbiddenPhrases(safe.category || "使用技巧");
  return { title, description, slug, tags, body, category };
}

function buildMarkdown(article, date, cover) {
  return `---
layout: layouts/article.njk
title: "${yamlEscape(article.title)}"
description: "${yamlEscape(article.description)}"
date: ${date}
generated: true
category: "${yamlEscape(article.category)}"
tags:
${article.tags.map((tag) => `  - ${tag}`).join("\n")}
cover: "${cover}"
permalink: /jiqiao/${article.slug}/index.html
---

${article.body}
`;
}

async function createArticle(ai, topic, images) {
  const date = todayStr();
  const randomId = Math.floor(100 + Math.random() * 900);

  let imageInstruction = "";
  if (images.length === 2) {
    imageInstruction = `
4. 【插图要求】在正文不同二级标题之间嵌入以下本地图片（Markdown 格式，alt 用简体中文描述）：
   图片 1：${images[0]}
   图片 2：${images[1]}
   示例：![DeepSeek 实操示意](${images[0]})
`;
  }

  const pillarList = PILLAR_PATHS.map((p) => `- ${p}`).join("\n");

  const prompt = `
你是某技术博客的兼职作者，给普通用户写 DeepSeek 实操帖，不是写白皮书。请针对主题「${topic}」撰写一篇使用【简体中文】（zh-CN）的原创文章。

硬性要求：
1. 标题像博客标题，不要「完整指南」「技术白皮书」这类官腔。
2. 正文 800-1500 字，必须包含：①一个具体版本号或日期 ②至少 3 步操作 ③至少一段第一人称（如「我测试时发现」）。
3. 禁止用词：综上所述、毋庸置疑、在当今数字化时代、业界领先、全方位、深度融合、极致、seo、关键词、优化、排名、收录、曝光、站群、友链。
4. 随机选一种结构：教程型 / 评测型 / 踩坑记录型 / 清单型 / 快讯型；只有问答型才允许写 FAQ。
5. 【正文内链】站内内链 2～5 条，优先链到以下 pillar（按主题选 2～3 篇，必须相关）：
${pillarList}
   格式：[描述性锚文本](/jiqiao/xxx/)，禁止每个「DeepSeek」都加链。
6. 官方外链 0～2 条（platform.deepseek.com / chat.deepseek.com / ollama.com），同一域名最多 1 次。
7. 不要输出 H1；正文从 ## 二级标题开始。
${imageInstruction}

严格只输出 JSON：
{
  "title": "",
  "description": "120字以内摘要",
  "slug": "english-or-pinyin-slug",
  "category": "",
  "tags": ["deepseek", "..."],
  "body": "Markdown 正文"
}
`;

  const draft = normalizeArticle(await generateJson(ai, prompt), topic);
  const polishPrompt = `
把下面文章改写成贴吧/知乎网友风格：缩短 20% 官话，加 1-2 处口语，保留技术信息与站内 pillar 内链，输出同样 JSON 字段。
继续避开：综上所述、毋庸置疑、在当今数字化时代、业界领先、全方位、深度融合、极致、seo、关键词、优化、排名、收录、曝光。

原 JSON：
${JSON.stringify(draft)}
`;
  const article = normalizeArticle(await generateJson(ai, polishPrompt), topic);
  article.slug = `${date}-${article.slug}-${randomId}`.replace(/-+/g, "-");

  const cover = images[0] || "/static/og-default.png";
  const file = path.join("content", `${article.slug}.md`);
  await mkdir("content", { recursive: true });
  await writeFile(file, buildMarkdown(article, date, cover), "utf8");
  return file;
}

async function main() {
  if (!apiKey) {
    console.warn("未检测到 GEMINI_API_KEY，跳过生成。");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const imagePool = await loadImagePool();
  let keywords = await loadKeywords();
  const postsToCreate = Math.min(maxPosts, keywords.length || maxPosts);

  if (!keywords.length) {
    console.warn("keywords.json 为空，跳过生成。");
    return;
  }

  const created = [];
  for (let i = 0; i < postsToCreate; i += 1) {
    const topic = keywords.shift();
    const images = pickImages(imagePool);
    try {
      created.push(await createArticle(ai, topic, images));
      console.log(`✅ 已生成: ${topic}`);
    } catch (error) {
      console.error(`❌ 生成失败: ${topic}`, error.message);
      keywords.unshift(topic);
    }
  }

  await saveKeywords(keywords);
  console.log(`\n完成 ${created.length} 篇，词库剩余 ${keywords.length} 条`);
  for (const file of created) console.log(file);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
