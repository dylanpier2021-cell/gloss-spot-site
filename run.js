import { client } from "./client-config.js";
import {
  generateHomePage,
  generateAllLandingPages,
  generateServiceAliasPages,
  generateChampaignCombos,
  generateB2BPages,
  generateAboutPage,
  generateContactPage,
  generateFAQPage,
  generateWhyUsPage,
  generateProcessPage,
  generateGalleryPage,
  generateReviewsPage,
  generateServiceAreaPage,
  generatePackagesPage,
  generatePrivacyPage,
  generateTermsPage,
  generate404Page,
  generateBlogIndex,
} from "./generate-landing-page.js";
import { generateBookingPage, generateCostCalculator } from "./generate-booking.js";
import { generateAllPosts } from "./blog-generator.js";
import { generateSitemap } from "./sitemap-generator.js";

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
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.error(`\n✗ Missing required fields in client-config.js: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!client.cities || client.cities.length === 0) {
    console.error("\n✗ client-config.js: cities array is empty"); process.exit(1);
  }
}

async function run() {
  const startTime = Date.now();

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  Building: ${client.businessName.padEnd(48)}║`);
  console.log(`║  Niche: ${client.niche.padEnd(51)}║`);
  console.log(`║  Cities: ${String(client.cities.length).padEnd(50)}║`);
  console.log(`║  Domain: ${client.domain.padEnd(50)}║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  console.log("\n[1/14] Validating client config…");
  validateConfig();
  console.log("  ✓ Config valid\n");

  console.log("[2/14] Home page");
  await generateHomePage();

  console.log("\n[3/14] City landing pages");
  await generateAllLandingPages();

  console.log("\n[4/14] Service alias pages (/interior, /exterior, …)");
  await generateServiceAliasPages();

  console.log("\n[5/14] Champaign-IL high-intent service combos");
  await generateChampaignCombos();

  console.log("\n[6/14] B2B / Commercial pages");
  await generateB2BPages();

  console.log("\n[7/14] About / Contact / FAQ / Why Us / Our Process");
  await generateAboutPage();
  await generateContactPage();
  await generateFAQPage();
  await generateWhyUsPage();
  await generateProcessPage();

  console.log("\n[8/14] Gallery / Reviews / Service Area / Packages");
  await generateGalleryPage();
  await generateReviewsPage();
  await generateServiceAreaPage();
  await generatePackagesPage();

  console.log("\n[9/14] Privacy / Terms / 404");
  await generatePrivacyPage();
  await generateTermsPage();
  await generate404Page();

  console.log("\n[10/14] Booking page (/book-an-appointment-1696)");
  await generateBookingPage();

  console.log("\n[11/14] Cost calculator");
  await generateCostCalculator();

  console.log("\n[12/14] Blog posts");
  await generateAllPosts();

  console.log("\n[13/14] Blog index");
  await generateBlogIndex();

  console.log("\n[14/14] Sitemap + robots.txt");
  generateSitemap();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  ✓ Build complete in ${elapsed}s${" ".repeat(40 - String(elapsed).length)}║`);
  console.log("║                                                              ║");
  console.log("║  Output: ./output/                                           ║");
  console.log("║  Push to GitHub → Vercel auto-deploys                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
}

run().catch((err) => {
  console.error("\n✗ Build failed:", err.stack || err.message);
  process.exit(1);
});
