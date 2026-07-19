const APEX_HOST = "go-deepseek.com";

// Hostnames that should permanently land on the apex.
// Use 301 (not 302): browsers/search engines cache the canonical host,
// so users stop repeatedly hitting a potentially flagged www hostname.
const REDIRECT_TO_APEX = new Set([
  "www.go-deepseek.com",
  "deepseek-app.com",
  "www.deepseek-app.com"
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  if (REDIRECT_TO_APEX.has(host)) {
    url.protocol = "https:";
    url.hostname = APEX_HOST;

    return new Response(null, {
      status: 301,
      headers: {
        Location: url.toString(),
        // Cache the host redirect so Edge/Chrome stop re-requesting www.
        "Cache-Control": "public, max-age=86400",
        Vary: "Host"
      }
    });
  }

  return context.next();
}
