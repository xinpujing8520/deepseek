import fs from "fs";
import path from "path";

const token = fs
  .readFileSync(path.join(process.env.USERPROFILE, ".wrangler", "config", "default.toml"), "utf8")
  .match(/oauth_token = "([^"]+)"/)[1];

const zoneId = "4a1038b03c6399aa84c5522a527c9da1";
const target = "deepseek-5iq.pages.dev";
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};

async function listRecords() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { headers });
  return res.json();
}

async function createRecord(name) {
  const body = {
    type: "CNAME",
    name,
    content: target,
    proxied: true,
    ttl: 1
  };
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  return res.json();
}

const listed = await listRecords();
console.log("list success:", listed.success, listed.errors?.[0]?.message || "");
if (listed.success) {
  console.log(
    "existing:",
    listed.result.map((r) => `${r.type} ${r.name} -> ${r.content}`).join("\n") || "(none)"
  );
}

for (const name of ["@", "www"]) {
  const created = await createRecord(name);
  console.log(`create ${name}:`, created.success ? "ok" : created.errors?.[0]?.message);
  if (created.result) console.log(`  -> ${created.result.content}`);
}
