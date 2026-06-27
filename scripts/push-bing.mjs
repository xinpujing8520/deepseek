import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.BING_API_KEY;
const pushAll = process.argv.includes("--all");

if (!siteUrl) {
  throw new Error("Missing SITE_URL");
}

if (!apiKey) {
  console.log("BING_API_KEY is not set, skip submit.");
  process.exit(0);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function urlsFromSitemap() {
  const xml = await readFile("_site/sitemap.xml", "utf8");
  return unique([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]));
}

function urlsFromChangedFiles() {
  let changed = "";
  try {
    changed = execFileSync("git", ["diff", "--name-only", "HEAD~1..HEAD"], { encoding: "utf8" });
  } catch {
    changed = execFileSync("git", ["diff", "--name-only", "--cached"], { encoding: "utf8" });
  }

  return unique(
    changed
      .split(/\r?\n/)
      .filter((file) => file.startsWith("content/") && file.endsWith(".md"))
      .map((file) => {
        const source = execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" });
        const permalink = source.match(/^permalink:\s*(.+)$/m)?.[1]?.trim();
        return permalink ? `${siteUrl}${permalink}` : "";
      })
  );
}

async function submit(urls) {
  if (!urls.length) {
    console.log("No updated article URLs to submit.");
    return;
  }

  const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${encodeURIComponent(apiKey)}`;
  for (let index = 0; index < urls.length; index += 500) {
    const urlList = urls.slice(index, index + 500);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ siteUrl, urlList })
    });

    if (!response.ok) {
      throw new Error(`Bing submit failed: ${response.status} ${await response.text()}`);
    }
    console.log(`submitted ${urlList.length} url(s)`);
  }
}

const urls = pushAll ? await urlsFromSitemap() : urlsFromChangedFiles();
await submit(urls);
