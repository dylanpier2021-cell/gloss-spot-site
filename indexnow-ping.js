import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";

// ── Parse URLs from sitemap.xml ───────────────────────────────────────────────
function getUrlsFromSitemap() {
  const sitemapPath = join("output", "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    console.warn("  Warning: output/sitemap.xml not found. Run sitemap-generator.js first.");
    return [];
  }
  const xml = readFileSync(sitemapPath, "utf8");
  const matches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
  return matches.map((m) => m.replace(/<\/?loc>/g, ""));
}

// ── Ping IndexNow ─────────────────────────────────────────────────────────────
export async function pingIndexNow(urls) {
  const { domain, indexNowKey } = client;

  if (!indexNowKey) {
    console.log("\n▸ IndexNow: skipped (no INDEXNOW_KEY in .env)");
    const allUrls = urls || getUrlsFromSitemap();
    if (allUrls.length > 0) {
      console.log(`  ${allUrls.length} URLs would be submitted once key is set:`);
      allUrls.slice(0, 5).forEach((u) => console.log(`    ${u}`));
      if (allUrls.length > 5) console.log(`    ... and ${allUrls.length - 5} more`);
    }
    return { submitted: false, count: 0 };
  }

  const urlList = urls || getUrlsFromSitemap();
  if (urlList.length === 0) {
    console.log("\n▸ IndexNow: no URLs to submit");
    return { submitted: false, count: 0 };
  }

  const host = new URL(domain).hostname;

  const body = {
    host,
    key: indexNowKey,
    keyLocation: `${domain}/${indexNowKey}.txt`,
    urlList,
  };

  console.log(`\n▸ Submitting ${urlList.length} URLs to IndexNow...`);

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (response.ok || response.status === 202) {
    console.log(`  ✓ IndexNow accepted ${urlList.length} URLs (HTTP ${response.status})`);
    return { submitted: true, count: urlList.length };
  } else {
    const text = await response.text();
    console.error(`  ✗ IndexNow error: HTTP ${response.status} — ${text}`);
    return { submitted: false, count: 0, error: text };
  }
}

// CLI entry
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const cliUrls = process.argv.slice(2);
  pingIndexNow(cliUrls.length > 0 ? cliUrls : undefined).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
