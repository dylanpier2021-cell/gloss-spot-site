import { readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";

const TODAY = new Date().toISOString().split("T")[0];

function scanOutputDir() {
  const { domain, nicheSlug } = client;
  const urls = [];

  // Homepage
  urls.push({ loc: `${domain}/`, priority: "1.0", changefreq: "weekly" });

  const outputFiles = existsSync("output") ? readdirSync("output") : [];

  // City landing pages: {City}-landing-page.html
  for (const file of outputFiles) {
    if (!file.endsWith("-landing-page.html")) continue;
    const city = file.replace("-landing-page.html", "").toLowerCase().replace(/\s+/g, "-");
    urls.push({
      loc: `${domain}/${nicheSlug}-${city}/`,
      priority: "0.9",
      changefreq: "monthly",
    });
  }

  // Service pages: {service-slug}-{city-slug}.html (not landing pages, not about pages)
  for (const file of outputFiles) {
    if (file.endsWith("-landing-page.html")) continue;
    if (file.startsWith("about-")) continue;
    if (!file.endsWith(".html")) continue;
    const slug = file.replace(".html", "");
    urls.push({
      loc: `${domain}/${slug}/`,
      priority: "0.85",
      changefreq: "monthly",
    });
  }

  // About pages: about-{city-slug}.html
  for (const file of outputFiles) {
    if (!file.startsWith("about-") || !file.endsWith(".html")) continue;
    const slug = file.replace(".html", "");
    urls.push({
      loc: `${domain}/${slug}/`,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  // Blog posts
  const blogDir = join("output", "blog");
  const blogFiles = existsSync(blogDir) ? readdirSync(blogDir) : [];
  for (const file of blogFiles) {
    if (!file.endsWith(".html") || file === "index.html") continue;
    const slug = file.replace(".html", "");
    urls.push({
      loc: `${domain}/blog/${slug}/`,
      priority: "0.7",
      changefreq: "monthly",
    });
  }

  // Blog index
  if (blogFiles.includes("index.html")) {
    urls.push({
      loc: `${domain}/blog/`,
      priority: "0.8",
      changefreq: "daily",
    });
  }

  return urls;
}

function buildSitemap(urls) {
  const entries = urls
    .map(
      ({ loc, priority, changefreq }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export function generateSitemap() {
  const urls = scanOutputDir();
  const xml = buildSitemap(urls);

  writeFileSync(join("output", "sitemap.xml"), xml, "utf8");

  console.log(`\n▸ Sitemap generated — ${urls.length} URLs → output/sitemap.xml`);
  return urls;
}

// CLI entry
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const urls = generateSitemap();
  urls.forEach((u) => console.log(`  ${u.loc}`));
}
