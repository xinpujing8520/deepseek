#!/usr/bin/env node
/**
 * 将 content/*.md 中的 Bing 缩略图 URL 替换为本地 /static/images/ 路径
 * 用法: node tools/fix-bing-images.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const IMAGES_TXT = path.join(ROOT, "images.txt");
const POSTS_DIR = path.join(ROOT, "content");

function loadImagePool() {
  if (!fs.existsSync(IMAGES_TXT)) return [];
  return fs
    .readFileSync(IMAGES_TXT, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("/static/images/"));
}

function hashPick(seed, pool) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

function replaceBingInText(text, pool, cache) {
  return text.replace(/https:\/\/tse-mm\.bing\.com\/th\?q=[^\s)\]"']+/gi, (url) => {
    const queryMatch = url.match(/[?&]q=([^&]+)/i);
    const seed = queryMatch ? decodeURIComponent(queryMatch[1].replace(/\+/g, " ")) : url;
    if (cache.has(seed)) return cache.get(seed);
    const local = hashPick(seed, pool);
    cache.set(seed, local);
    return local;
  });
}

function main() {
  const pool = loadImagePool();
  if (!pool.length) {
    console.error("images.txt 中没有 /static/images/ 路径");
    process.exit(1);
  }

  const cache = new Map();
  const posts = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  let changed = 0;

  for (const file of posts) {
    const filePath = path.join(POSTS_DIR, file);
    const original = fs.readFileSync(filePath, "utf-8");
    const updated = replaceBingInText(original, pool, cache);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, "utf-8");
      changed++;
    }
  }

  const remaining = posts.reduce((count, file) => {
    const text = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    return count + (text.match(/tse-mm\.bing\.com/g) || []).length;
  }, 0);

  console.log(`Updated ${changed} posts; remaining bing refs: ${remaining}`);
}

main();
