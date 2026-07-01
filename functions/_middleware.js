export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  // 等 go-deepseek.com DNS 生效后再开启（Cloudflare 需先添加 CNAME 记录）
  const redirectOldDomain = false;

  if (
    redirectOldDomain &&
    (host === "deepseek-app.com" || host === "www.deepseek-app.com")
  ) {
    url.protocol = "https:";
    url.hostname = "go-deepseek.com";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
