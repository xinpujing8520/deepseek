import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE = process.env.BAIDU_PUSH_SITE || "go-deepseek.com";
const TOKEN = (process.env.BAIDU_PUSH_TOKEN || "").trim();
const OUTPUT_DIR = path.join(__dirname, "..", "_site");

function getAllHtmlFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  for (const file of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllHtmlFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".html")) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

function toPublicUrl(relativePath) {
  let normalized = relativePath.replace(/\\/g, "/");
  if (normalized.endsWith("index.html")) {
    normalized = normalized.slice(0, -10);
  } else if (normalized.endsWith(".html")) {
    normalized = normalized.slice(0, -5);
  }
  return `https://${SITE}/${normalized}`;
}

function postUrls(urlList) {
  const body = urlList.join("\n");
  const apiPath = `/urls?site=${encodeURIComponent(SITE)}&token=${encodeURIComponent(TOKEN)}`;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "data.zz.baidu.com",
        path: apiPath,
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!TOKEN) {
    console.log("ℹ️ 未设置 BAIDU_PUSH_TOKEN，跳过百度普通收录推送。");
    console.log("   在百度站长平台 → 普通收录 → API 提交 获取 token。");
    process.exit(0);
  }

  const htmlFiles = getAllHtmlFiles(OUTPUT_DIR);
  let urlList = htmlFiles.map((filePath) => toPublicUrl(path.relative(OUTPUT_DIR, filePath)));

function isIndexableUrl(url) {
  const path = new URL(url).pathname;
  if (path === "/" || path === "/jiqiao/" || path === "/about/") return true;
  return /^\/jiqiao\/deepseek-[^/]+\/$/.test(path);
}

  urlList = [...new Set(urlList)].filter(isIndexableUrl);

  if (urlList.length === 0) {
    console.log("ℹ️ 未发现可推送 URL。");
    process.exit(0);
  }

  // 百度单次建议不超过 2000 条，分批推送
  const batchSize = 2000;
  for (let i = 0; i < urlList.length; i += batchSize) {
    const batch = urlList.slice(i, i + batchSize);
    console.log(`🚀 百度普通收录：推送 ${batch.length} 条 URL（${i + 1}-${i + batch.length}）...`);
    const { statusCode, body } = await postUrls(batch);
    console.log(`   状态 ${statusCode}，响应：${body}`);
    if (statusCode !== 200) {
      process.exit(1);
    }
  }

  console.log("✅ 百度 URL 推送完成。");
}

main().catch((err) => {
  console.error("❌ 百度推送失败:", err.message);
  process.exit(1);
});
