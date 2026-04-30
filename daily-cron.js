import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { client } from "./client-config.js";
import { generateTopicMatrix, generatePost } from "./blog-generator.js";
import { generateSitemap } from "./sitemap-generator.js";
import { pingIndexNow } from "./indexnow-ping.js";

const PUBLISHED_FILE = "published-slugs.json";
const LOG_FILE = "daily-log.txt";

// ── Published slugs tracker ───────────────────────────────────────────────────
function loadPublished() {
  if (existsSync(PUBLISHED_FILE)) {
    return JSON.parse(readFileSync(PUBLISHED_FILE, "utf8"));
  }
  return [];
}

function savePublished(slugs) {
  writeFileSync(PUBLISHED_FILE, JSON.stringify(slugs, null, 2), "utf8");
}

// ── Daily log ─────────────────────────────────────────────────────────────────
function log(message) {
  const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
  const line = `[${timestamp}] ${message}\n`;
  appendFileSync(LOG_FILE, line, "utf8");
  console.log(line.trim());
}

// ── Main cron job ─────────────────────────────────────────────────────────────
async function dailyCron() {
  const postsPerDay = client.blogPostsPerDay || 3;

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  Daily Cron: ${client.businessName.padEnd(46)}║`);
  console.log(`║  Posts per day: ${postsPerDay.toString().padEnd(43)}║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // 1. Load published slugs
  const published = loadPublished();
  const publishedSet = new Set(published);

  // 2. Generate full topic matrix
  const allTopics = generateTopicMatrix();
  const unpublished = allTopics.filter((t) => !publishedSet.has(t.slug));

  console.log(`  Total topics: ${allTopics.length}`);
  console.log(`  Already published: ${published.length}`);
  console.log(`  Remaining: ${unpublished.length}`);

  if (unpublished.length === 0) {
    log("No unpublished topics remaining. Topic matrix exhausted.");
    console.log("\n  All topics have been published. Add more cities or services to generate new topics.");
    return;
  }

  // 3. Pick next N unpublished topics
  const batch = unpublished.slice(0, postsPerDay);
  console.log(`\n  Generating ${batch.length} posts...\n`);

  let totalIn = 0;
  let totalOut = 0;
  const newUrls = [];

  for (const topic of batch) {
    const result = await generatePost(topic);
    totalIn += result.usage.input_tokens;
    totalOut += result.usage.output_tokens;
    newUrls.push(`${client.domain}/blog/${topic.slug}/`);

    // Mark as published immediately (crash-safe)
    published.push(topic.slug);
    savePublished(published);
  }

  // 4. Rebuild sitemap
  generateSitemap();

  // 5. Ping IndexNow for new URLs only
  if (newUrls.length > 0) {
    await pingIndexNow(newUrls);
  }

  // 6. Log summary
  const cost = (totalIn * 0.000003 + totalOut * 0.000015).toFixed(2);
  const slugList = batch.map((t) => t.slug).join(", ");
  log(`Generated ${batch.length} posts: ${slugList} | Tokens: ${totalIn} in / ${totalOut} out | Cost: ~$${cost}`);

  console.log(`\n  ✓ Daily cron complete — ${batch.length} new posts, ${unpublished.length - batch.length} remaining`);
}

dailyCron().catch((err) => {
  log(`ERROR: ${err.message}`);
  console.error("Error:", err.message);
  process.exit(1);
});
