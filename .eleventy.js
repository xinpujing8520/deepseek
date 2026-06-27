const systemTags = new Set(["all", "nav", "post", "posts", "article", "articles"]);

function toTagSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function (eleventyConfig) {
  eleventyConfig.ignores.add("__MACOSX/**");

  eleventyConfig.addPassthroughCopy("deepseek.css");
  eleventyConfig.addPassthroughCopy("favicon.ico");

  eleventyConfig.addFilter("readableDate", (date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  });

  eleventyConfig.addFilter("htmlDateString", (date) => {
    return new Date(date).toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("readableTags", (tags = []) => {
    return tags.filter((tag) => !systemTags.has(tag));
  });

  eleventyConfig.addFilter("tagSlug", toTagSlug);

  eleventyConfig.addCollection("articles", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("content/**/*.md")
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
}
