import { GoogleGenAI } from "@google/genai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const countArg = Number(process.argv.find((arg) => arg.startsWith("--count="))?.split("=")[1] || 1);
const count = Math.min(9, Math.max(1, Number.isFinite(countArg) ? countArg : 1));
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey });
const model = "gemini-2.5-flash";
const topics = [
  "DeepSeek 本地资料整理",
  "DeepSeek 写日报",
  "DeepSeek 会议纪要",
  "DeepSeek 改邮件",
  "DeepSeek 学习计划",
  "DeepSeek 客服回复",
  "DeepSeek 读论文",
  "DeepSeek 代码解释",
  "DeepSeek 旅行安排"
];

const structures = [
  "教程型：步骤清楚，但结尾用“我会怎么用”或“注意点”收住，不要写 FAQ",
  "评测型：按 3 个维度打分，允许用短表格感描述，不要写 FAQ",
  "踩坑记录型：用“问题现象、我怎么查、最后怎么处理”的顺序，不要写 FAQ",
  "清单型：用准备清单、操作清单、复查清单组织，不要写 FAQ",
  "快讯型：300-600 字，像更新记录或使用观察，不要写 FAQ",
  "问答型：最多 5 个短问答，只有抽到这个结构时才允许出现“常见问题”"
];

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/deepseek/g, "deepseek")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function today(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function askJson(prompt) {
  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(result.text);
}

async function createArticle(topic, index) {
  const date = today(-index);
  const structure = structures[Math.floor(Math.random() * structures.length)];
  const firstPrompt = `
你是某技术博客的兼职作者，给普通用户写 DeepSeek 实操帖，不是写白皮书。
请围绕主题「${topic}」生成 1 篇原创文章，输出 JSON：
{
  "title": "",
  "description": "",
  "category": "",
  "tags": ["deepseek", "...", "..."],
  "coverQuery": "",
  "body": ""
}
硬性要求：
- 标题像博客标题，不要“完整指南”“技术白皮书”这类官腔
- 正文 800-1500 字
- 正文必须包含一个具体版本号或日期
- 如果是教程、踩坑记录或清单型，至少写 3 步操作；如果是评测或快讯型，可写观察点、测试项或改动点
- 至少一段用第一人称，比如“我测试时发现”
- 本篇结构采用：${structure}
- 不要每篇都写问答；除非本篇结构明确是问答型，否则不要出现“常见问题”“FAQ”“Q&A”这类固定栏目
- 小标题要自然变化，可使用“我先看了这几项”“实际跑下来”“容易忽略的点”“适合谁用”“我的处理方式”等
- 文章里不要出现这些词：综上所述、毋庸置疑、在当今数字化时代、业界领先、全方位、深度融合、极致、seo、关键词、优化、排名、收录、曝光
- 不要放外部链接
- body 使用 Markdown，允许 1 到 2 张图片，图片格式必须是 ![自然描述](https://tse-mm.bing.com/th?q=DeepSeek+相关英文短语)
日期使用 ${date}。
`;

  const draft = await askJson(firstPrompt);
  const polishPrompt = `
把下面文章改写成贴吧/知乎网友风格：缩短 20% 官话，加 1-2 处口语，保留技术信息，输出同样 JSON。
删掉“在当今”“随着...的快速发展”这类开头，随机替换部分连接词。
检查栏目是否太模板化：如果不是问答型，请删掉“常见问题/FAQ/Q&A”固定栏目，换成更自然的小标题。
继续避开这些词：综上所述、毋庸置疑、在当今数字化时代、业界领先、全方位、深度融合、极致、seo、关键词、优化、排名、收录、曝光。
原 JSON：
${JSON.stringify(draft)}
`;
  const article = await askJson(polishPrompt);

  const cleanTags = Array.from(new Set(["deepseek", ...(article.tags || [])]))
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
  const slug = slugify(article.title || topic);
  const coverQuery = article.coverQuery || `${topic} DeepSeek`;
  const cover = `https://tse-mm.bing.com/th?q=${encodeURIComponent(coverQuery).replace(/%20/g, "+")}`;
  const file = path.join("content", `${date}-${slug}.md`);
  const body = `---
layout: layouts/article.njk
title: "${String(article.title).replaceAll('"', '\\"')}"
description: "${String(article.description).replaceAll('"', '\\"')}"
date: ${date}
category: "${String(article.category || "使用技巧").replaceAll('"', '\\"')}"
tags:
${cleanTags.map((tag) => `  - ${tag}`).join("\n")}
cover: "${cover}"
permalink: /jiqiao/${slug}/index.html
---

${article.body}
`;

  await mkdir("content", { recursive: true });
  await writeFile(file, body, "utf8");
  return file;
}

const created = [];
for (let index = 0; index < count; index += 1) {
  created.push(await createArticle(topics[index % topics.length], index));
}

console.log(`created ${created.length} article(s)`);
for (const file of created) {
  console.log(file);
}
