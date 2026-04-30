import { readdirSync, writeFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";

const TODAY = new Date().toISOString().split("T")[0];

// Map slugs to suggested priority/changefreq.
function meta(slug) {
  if (slug === "" || slug === "index") return { priority: "1.0", changefreq: "weekly" };
  if (slug === "Champaign-il") return { priority: "0.95", changefreq: "weekly" };
  if (slug === "book-an-appointment-1696") return { priority: "0.95", changefreq: "monthly" };
  if (slug === "cost-calculator") return { priority: "0.9", changefreq: "monthly" };
  if (slug.startsWith("interior-detailing-") || slug.startsWith("exterior-detailing-") ||
      slug.startsWith("full-service-detailing-") || slug.startsWith("mobile-detailing-")) {
    return { priority: "0.9", changefreq: "monthly" };
  }
  if (["packages", "about-us", "contact", "service-area", "gallery", "reviews", "faq",
       "why-choose-us", "our-process", "blog"].includes(slug)) {
    return { priority: "0.85", changefreq: "weekly" };
  }
  if (["privacy-policy", "terms-and-conditions"].includes(slug)) {
    return { priority: "0.3", changefreq: "yearly" };
  }
  return { priority: "0.75", changefreq: "monthly" };
}

function scanOutput() {
  const urls = [];
  if (!existsSync("output")) return urls;

  // Top-level .html files
  for (const file of readdirSync("output")) {
    const fp = join("output", file);
    if (!file.endsWith(".html") || file === "404.html") continue;
    const slug = file === "index.html" ? "" : file.replace(/\.html$/, "");
    const m = meta(slug);
    urls.push({ loc: `${client.domain}/${slug}`, ...m });
  }

  // Blog
  const blogDir = join("output", "blog");
  if (existsSync(blogDir) && statSync(blogDir).isDirectory()) {
    for (const file of readdirSync(blogDir)) {
      if (!file.endsWith(".html")) continue;
      if (file === "index.html") {
        urls.push({ loc: `${client.domain}/blog`, priority: "0.85", changefreq: "weekly" });
      } else {
        const slug = file.replace(/\.html$/, "");
        urls.push({ loc: `${client.domain}/blog/${slug}`, priority: "0.7", changefreq: "monthly" });
      }
    }
  }

  return urls;
}

function buildSitemapXml(urls) {
  const entries = urls.map(({ loc, priority, changefreq }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

# Block crawl of internal API endpoints
Disallow: /api/

Sitemap: ${client.domain}/sitemap.xml
`;
}

export function generateSitemap() {
  const urls = scanOutput();
  writeFileSync(join("output", "sitemap.xml"), buildSitemapXml(urls), "utf8");
  writeFileSync(join("output", "robots.txt"), buildRobotsTxt(), "utf8");
  console.log(`  ✓ sitemap (${urls.length} URLs) → output/sitemap.xml`);
  console.log(`  ✓ robots.txt → output/robots.txt`);
  return urls;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  generateSitemap();
}
