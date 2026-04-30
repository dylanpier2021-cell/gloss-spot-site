import { client } from "./client-config.js";
import {
  generateAllLandingPages, generateAllServicePages,
  generateAboutPage, generateBlogIndex,
} from "./generate-landing-page.js";
import { generateTopicMatrix, generateAllPosts } from "./blog-generator.js";
import { generateSitemap } from "./sitemap-generator.js";
import { pingIndexNow } from "./indexnow-ping.js";
import { setupGHL } from "./ghl-setup.js";

// ── Config validation ─────────────────────────────────────────────────────────
function validateConfig() {
  const required = {
    businessName: client.businessName,
    niche: client.niche,
    nicheKeyword: client.nicheKeyword,
    nicheSlug: client.nicheSlug,
    city: client.city,
    state: client.state,
    phone: client.phone,
    primaryColor: client.primaryColor,
    domain: client.domain,
  };

  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error(`\n✗ Missing required fields in client-config.js: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (!client.cities || client.cities.length === 0) {
    console.error("\n✗ client-config.js: cities array is empty");
    process.exit(1);
  }

  if (!client.services || client.services.length === 0) {
    console.error("\n✗ client-config.js: services array is empty");
    process.exit(1);
  }

  if (!client.anthropicApiKey) {
    console.error("\n✗ ANTHROPIC_API_KEY not set in .env");
    process.exit(1);
  }
}

// ── Token + cost tracker ──────────────────────────────────────────────────────
function summarizeUsage(results) {
  let totalIn = 0;
  let totalOut = 0;
  for (const r of results) {
    if (r.usage) {
      totalIn += r.usage.input_tokens;
      totalOut += r.usage.output_tokens;
    }
  }
  const costIn = totalIn * 0.000003;
  const costOut = totalOut * 0.000015;
  return { totalIn, totalOut, cost: costIn + costOut };
}

// ── Main runner ───────────────────────────────────────────────────────────────
async function run() {
  const startTime = Date.now();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  Deploying: ${client.businessName.padEnd(47)}║`);
  console.log(`║  Niche: ${client.niche.padEnd(51)}║`);
  console.log(`║  Cities: ${client.cities.length.toString().padEnd(50)}║`);
  console.log(`║  Services: ${client.services.length.toString().padEnd(48)}║`);
  console.log(`║  Domain: ${client.domain.padEnd(50)}║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  // 1. Validate
  console.log("\n[1/9] Validating client config...");
  validateConfig();
  console.log("  ✓ Config valid\n");

  const allResults = [];

  // 2. City landing pages
  console.log("[2/9] City landing pages");
  const pageResults = await generateAllLandingPages();
  allResults.push(...pageResults);

  // 3. Service pages
  console.log("[3/9] Service pages");
  const serviceResults = await generateAllServicePages();
  allResults.push(...serviceResults);

  // 4. About page
  console.log("[4/9] About page");
  const aboutResult = await generateAboutPage(client.city);
  allResults.push(aboutResult);

  // 5. Topic matrix + blog posts
  console.log("[5/9] Topic matrix");
  const topics = generateTopicMatrix();
  console.log(`  ✓ ${topics.length} topics generated across ${client.cities.length} cities\n`);

  console.log("[6/9] Blog posts");
  const blogResults = await generateAllPosts(topics);
  allResults.push(...blogResults);

  // 7. Blog index
  console.log("[7/9] Blog index");
  const blogIndexResult = await generateBlogIndex();
  allResults.push(blogIndexResult);

  // 8. Sitemap
  console.log("[8/9] Sitemap");
  const sitemapUrls = generateSitemap();

  // 9. GHL + IndexNow
  console.log("\n[9/9] GHL + IndexNow");
  const ghlResult = await setupGHL();
  const indexResult = await pingIndexNow();

  // ── Summary ─────────────────────────────────────────────────────────────
  const usage = summarizeUsage(allResults);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    DEPLOYMENT SUMMARY                       ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Landing pages:    ${pageResults.length.toString().padEnd(40)}║`);
  console.log(`║  Service pages:    ${serviceResults.length.toString().padEnd(40)}║`);
  console.log(`║  About page:       ${"1".padEnd(40)}║`);
  console.log(`║  Blog posts:       ${blogResults.length.toString().padEnd(40)}║`);
  console.log(`║  Blog index:       ${"1".padEnd(40)}║`);
  console.log(`║  Sitemap URLs:     ${sitemapUrls.length.toString().padEnd(40)}║`);
  console.log(`║  GHL setup:        ${(ghlResult.setup ? "Complete" : "Skipped (no key)").padEnd(40)}║`);
  console.log(`║  IndexNow:         ${(indexResult.submitted ? `${indexResult.count} URLs submitted` : "Skipped (no key)").padEnd(40)}║`);
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log(`║  Input tokens:     ${usage.totalIn.toLocaleString().padEnd(40)}║`);
  console.log(`║  Output tokens:    ${usage.totalOut.toLocaleString().padEnd(40)}║`);
  console.log(`║  Estimated cost:   $${usage.cost.toFixed(2).padEnd(39)}║`);
  console.log(`║  Time elapsed:     ${elapsed}s${" ".repeat(39 - elapsed.length)}║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

run().catch((err) => {
  console.error("\n✗ Deployment failed:", err.message);
  process.exit(1);
});
