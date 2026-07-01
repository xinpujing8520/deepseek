export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  if (host === "deepseek-app.com" || host === "www.deepseek-app.com") {
    url.protocol = "https:";
    url.hostname = "go-deepseek.com";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
