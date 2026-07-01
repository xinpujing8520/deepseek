import fs from "fs";
import siteData from "./_data/site.json" with { type: "json" };

const systemTags = new Set(["all", "nav", "post", "posts", "article", "articles", "indexableposts", "homepageposts"]);

function assetVersion() {
  return siteData.assetVersion || "1";
}

function cacheBustStaticUrl(url) {
  const path = String(url || "").trim();
  if (!path.startsWith("/static/")) return path;
  if (/[?&]v=/.test(path)) return path;
  return `${path}?v=${assetVersion()}`;
}

function isPostIndexable(data, inputPath) {
  if (data.noindex === true) return false;
  if (data.featured === true) return true;
  if (data.generated === true) return false;

  const filePath = inputPath || "";
  if (/\/content\/\d{4}-\d{2}-\d{2}-/.test(filePath)) return false;

  const desc = data.description || "";
  const title = data.title || "";
  const tags = Array.isArray(data.tags) ? data.tags : [];

  if (desc.includes("专业解析与实操指南模板")) return false;
  if (/官方权威|站群|SEO优化|友链|跨境流量|全攻略|产业智能|重塑边界/.test(title)) return false;
  if (/SEO优化|自动检测|狂降\d+%/.test(title)) return false;
  if (/小伙伴们注意|手把手教你/.test(desc)) return false;
  if (tags.includes("seo") || tags.includes("SEO优化")) return false;

  if (/\/content\/deepseek-[^/]+\.md$/i.test(filePath)) return true;

  return false;
}

function toTagSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function (eleventyConfig) {
  eleventyConfig.ignores.add("__MACOSX/**");
  eleventyConfig.ignores.add("CONTENT-LINK-RULES.md");
  eleventyConfig.ignores.add("index - 副本.html");

  eleventyConfig.addPassthroughCopy("deepseek.css");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("_redirects");
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy("images.txt");
  eleventyConfig.addPassthroughCopy({ "_headers": "_headers" });
  if (fs.existsSync("BingSiteAuth.xml")) {
    eleventyConfig.addPassthroughCopy("BingSiteAuth.xml");
  }
  for (const name of fs.readdirSync(".")) {
    if (/^[0-9a-f-]{20,}\.txt$/i.test(name)) {
      eleventyConfig.addPassthroughCopy(name);
    }
  }

  eleventyConfig.addFilter("assetUrl", cacheBustStaticUrl);

  eleventyConfig.addTransform("cache-bust-static-assets", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const version = assetVersion();
    return content.replace(/\/static\/[^"'\s<>]+\.(?:svg|jpg|png|webp)(?![^"']*[?&]v=)/g, (path) => `${path}?v=${version}`);
  });

  eleventyConfig.addGlobalData("eleventyComputed", {
    noindex: (data) => {
      if (data.noindex === true) return true;
      const inputPath = data.page?.inputPath || "";
      if (inputPath.includes("/tags/") || inputPath.endsWith("tags.njk")) return true;
      if (!inputPath.includes("content")) return false;
      return !isPostIndexable(data, inputPath);
    },
  });

  eleventyConfig.addFilter("readableDate", (date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  });

  eleventyConfig.addFilter("htmlDateString", (date) => {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("htmlDate", (date) => {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("readableTags", (tags = []) => {
    return tags.filter((tag) => !systemTags.has(tag));
  });

  eleventyConfig.addFilter("tagSlug", toTagSlug);

  eleventyConfig.addFilter("limit", (arr, limit) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, limit);
  });

  eleventyConfig.addCollection("articles", (collectionApi) => {
    return collectionApi.getFilteredByGlob("content/**/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("indexablePosts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("content/**/*.md")
      .filter((item) => isPostIndexable(item.data, item.inputPath))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("homepagePosts", (collectionApi) => {
    const posts = collectionApi
      .getFilteredByGlob("content/**/*.md")
      .filter((item) => isPostIndexable(item.data, item.inputPath));
    const pillars = posts
      .filter((item) => /\/content\/deepseek-[^/]+\.md$/i.test(item.inputPath))
      .sort((a, b) => a.inputPath.localeCompare(b.inputPath, "zh-CN"));
    const featured = posts
      .filter((item) => /\/content\/\d{4}-\d{2}-\d{2}-/.test(item.inputPath))
      .sort((a, b) => b.date - a.date);
    return [...pillars, ...featured].slice(0, 8);
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
}
