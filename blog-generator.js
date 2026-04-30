import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";

const anthropic = new Anthropic({ apiKey: client.anthropicApiKey });

// ── Slug helper ───────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Niche photo map (mirrors generate-landing-page.js) ───────────────────────
const nichePhotos = {
  Plumbing: {
    hero: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600",
    services: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800",
    ],
  },
  default: {
    hero: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600",
    services: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    ],
  },
};

function getBlogPhotos(service, services) {
  const pool = nichePhotos[client.niche] || nichePhotos.default;
  const idx = services.indexOf(service);
  const heroPhoto = idx >= 0 ? pool.services[idx % pool.services.length] : pool.hero;
  const inlinePhoto = pool.services[(idx + 1) % pool.services.length];
  return { heroPhoto, inlinePhoto };
}

// ── Intents (ordered by priority — highest value first) ──────────────────────
const INTENTS = [
  { slug: "cost-guide",       priority: 1, template: (s, c) => `How Much Does ${s} Cost in ${c}?` },
  { slug: "how-to-choose",    priority: 2, template: (s, c) => `How to Choose the Best ${s} Company in ${c}` },
  { slug: "vs-diy",           priority: 3, template: (s, c) => `Professional ${s} vs DIY in ${c}: What You Need to Know` },
  { slug: "benefits",         priority: 4, template: (s, c) => `5 Benefits of Professional ${s} in ${c}` },
  { slug: "what-to-expect",   priority: 5, template: (s, c) => `What to Expect During ${s} in ${c}` },
  { slug: "best-time",        priority: 6, template: (s, c) => `Best Time to Schedule ${s} in ${c}` },
  { slug: "maintenance-tips", priority: 7, template: (s, c) => `${s} Maintenance Tips for ${c} Homeowners` },
  { slug: "common-mistakes",  priority: 8, template: (s, c) => `Common ${s} Mistakes ${c} Homeowners Make` },
];

// ── Topic matrix — prioritized by intent → city (primary first) → service ────
export function generateTopicMatrix() {
  const { services, cities, city: primaryCity } = client;
  // Cities ordered: primary first, then the rest in config order
  const orderedCities = [primaryCity, ...cities.filter((c) => c !== primaryCity)];

  const topics = [];
  const seenSlugs = new Set();

  // Outer loop: intent priority (cost-guide first → common-mistakes last)
  // This way highest-value keywords publish first
  for (const intent of INTENTS) {
    for (const city of orderedCities) {
      for (const service of services) {
        const titleService = service.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
        const title = intent.template(titleService, city);
        const slug = `${slugify(service)}-${intent.slug}-${slugify(city)}`;

        if (seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        topics.push({
          slug,
          title,
          city,
          service,
          intent: intent.slug,
          priority: intent.priority,
          focusKeyword: `${service} ${city.toLowerCase()}`,
        });
      }
    }
  }

  return topics;
}

// ── Internal link builder ────────────────────────────────────────────────────
function buildInternalLinks(city, currentSlug) {
  const { cities, nicheSlug, services, niche } = client;
  const links = [];

  // Priority 1: main city page + 2 service×city pages
  links.push(`<a href="/${nicheSlug}-${slugify(city)}/">${niche} services in ${city}</a>`);
  links.push(`<a href="/${nicheSlug}-${slugify(city)}/">${niche} company in ${city}</a>`);
  for (const service of services.slice(0, 2)) {
    const titleService = service.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    links.push(`<a href="/${slugify(service)}-${slugify(city)}/">${titleService} in ${city}</a>`);
  }

  // Priority 2: other city pages (2)
  for (const otherCity of cities.filter((c) => c !== city).slice(0, 2)) {
    links.push(`<a href="/${nicheSlug}-${slugify(otherCity)}/">${niche} in ${otherCity}</a>`);
  }

  // Priority 3: related blog posts (2 from same city, different intent)
  const matrix = generateTopicMatrix();
  const related = matrix.filter((t) => t.city === city && t.slug !== currentSlug).slice(0, 2);
  for (const post of related) {
    links.push(`<a href="/blog/${post.slug}/">${post.title}</a>`);
  }

  return links.slice(0, 10);
}

// ── Local specifics by city (neighborhoods + regional factors) ───────────────
const cityLocalDetails = {
  Austin: {
    neighborhoods: ["Hyde Park", "South Congress", "East Austin", "Mueller", "Zilker", "Tarrytown", "Barton Hills"],
    factors: "Central Texas heat, hard water, expansive clay soil that shifts with drought",
  },
  "Round Rock": {
    neighborhoods: ["Old Town Round Rock", "Teravista", "Brushy Creek", "Forest Creek"],
    factors: "fast-growing suburbs with aging infrastructure and heavy hard-water mineral buildup",
  },
  "Cedar Park": {
    neighborhoods: ["Buttercup Creek", "Twin Creeks", "Avery Ranch", "Cedar Park Town Center"],
    factors: "suburban expansion, newer construction with builder-grade plumbing reaching end of life",
  },
  Pflugerville: {
    neighborhoods: ["Blackhawk", "Falcon Pointe", "Heatherwilde", "Windermere"],
    factors: "limestone-heavy water supply causing scale buildup, seasonal freeze events",
  },
  Chicago: {
    neighborhoods: ["Lincoln Park", "Wicker Park", "River North", "Wrigleyville", "Logan Square", "Pilsen"],
    factors: "brutal winter freezes, century-old cast iron pipes, lake-effect humidity",
  },
};

function getLocalDetails(city) {
  return cityLocalDetails[city] || {
    neighborhoods: [`Downtown ${city}`, `North ${city}`, `South ${city}`, `West ${city}`],
    factors: "local climate and soil conditions",
  };
}

// ── Blog prompt builder ──────────────────────────────────────────────────────
function buildBlogPrompt(topic) {
  const {
    businessName, phone, niche, nicheKeyword, nicheSlug, services, cities,
    state, primaryColor, accentColor, footerColor, domain,
    headlineFont, bodyFont, blogAuthorName, blogAuthorTitle, blogAuthorBio,
    trustPoints,
  } = client;

  const { title, city, slug, focusKeyword, service } = topic;
  const titleService = service.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const serviceList = services.join(", ");
  const internalLinks = buildInternalLinks(city, slug);
  const local = getLocalDetails(city);
  const year = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  const authorBio = blogAuthorBio ||
    `${blogAuthorName} brings years of professional ${niche.toLowerCase()} experience to ${city} and surrounding areas.`;

  const matrix = generateTopicMatrix();
  const relatedPosts = matrix.filter((t) => t.city === city && t.slug !== slug).slice(0, 3);
  const relatedPostsHtml = relatedPosts
    .map((p) => `<a href="/blog/${p.slug}/">${p.title}</a>`)
    .join("\n    ");

  const { heroPhoto, inlinePhoto } = getBlogPhotos(service, services);
  const category = topic.intent.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // LSI keywords specific to niche
  const lsiKeywords = niche === "Plumbing"
    ? ["pipes", "plumber", "plumbing company", "licensed plumber", "emergency plumber", "local plumber", "plumbing repair"]
    : [niche.toLowerCase(), `${nicheKeyword}s`, `${nicheKeyword} company`, `licensed ${nicheKeyword}`, `local ${nicheKeyword}`];

  return `You are a senior SEO content writer who has written for actual local home service businesses for 10+ years. You write content that ranks on page 1 of Google AND converts browsers into paying customers. Write a premium blog post as a production-ready HTML page.

═══════════════════════════════════════════════════════════════════════
POST DATA
═══════════════════════════════════════════════════════════════════════
Title: ${title}
City: ${city}, ${state}
Primary keyword: "${focusKeyword}"
Service: ${titleService}
Niche: ${niche}
Slug: /blog/${slug}/
Business: ${businessName}
Phone: ${phone}
Domain: ${domain}
Year: ${year}
Publish date: ${today}

LSI / semantic keywords to weave in naturally: ${lsiKeywords.join(", ")}

LOCAL CONTEXT — must reference these specifics:
- Real ${city} neighborhoods: ${local.neighborhoods.join(", ")}
- Regional factors affecting ${niche.toLowerCase()}: ${local.factors}

═══════════════════════════════════════════════════════════════════════
WORD COUNT & KEYWORD DENSITY (strict requirements)
═══════════════════════════════════════════════════════════════════════
- 1,000-1,400 words of actual body content (NOT counting HTML tags, nav, footer, schema)
- Primary keyword "${focusKeyword}" appears naturally 8-12 times
- City name "${city}" appears minimum 10 times
- LSI keywords woven in naturally (at least 5 of these: ${lsiKeywords.join(", ")})
- Bold the MOST important 1-2 phrases per H2 section
- NEVER keyword stuff — must read naturally

═══════════════════════════════════════════════════════════════════════
CONTENT QUALITY RULES (ENFORCED)
═══════════════════════════════════════════════════════════════════════
1. Opening paragraph: hook with a specific scenario or problem the reader is facing RIGHT NOW. Example: "It's 7am and your kitchen drain is completely backed up. You've got work in an hour and..." — make it visceral and specific. No generic openers.
2. Every H2 answers a real Google query (see structure below)
3. Include specific numbers: real price ranges ($150-$400), real timelines (2-4 hours), real statistics
4. Include local specifics: actual ${city} neighborhoods (${local.neighborhoods.slice(0, 3).join(", ")}), regional conditions (${local.factors})
5. Voice: an expert plumber who does this work daily — conversational, direct, authoritative
6. FORBIDDEN phrases: "In conclusion", "As you can see", "It's important to note", "In today's world", "At the end of the day", "Look no further", "Trust us"
7. Short paragraphs: max 3 sentences each
8. Bullet lists for any set of 3+ items
9. Bold key phrases using <strong>

═══════════════════════════════════════════════════════════════════════
ARTICLE STRUCTURE (1,000-1,400 words)
═══════════════════════════════════════════════════════════════════════

1. <h1>${title}</h1>
   Below H1: publish date "${today}", author "${blogAuthorName}", reading time estimate (calculate: wordCount / 200 rounded up)

2. Opening 2 paragraphs (150-180 words):
   - Hook with specific scenario
   - Naturally include 2 internal links to city pages in the first 2 paragraphs:
     ${internalLinks.slice(0, 2).join("\n     ")}

3. H2: "How Much Does ${titleService} Cost in ${city}?" (or similar question-based heading appropriate to the topic)
   200-250 words, include specific dollar ranges, factors that affect price
   Include 1 internal link to a service page:
     ${internalLinks.slice(2, 3).join("")}

4. H2: "How Long Does ${titleService} Take in ${city}?" (or topic-appropriate question)
   200-250 words with real timelines, what happens during each stage
   Include 1 internal link:
     ${internalLinks.slice(3, 4).join("")}

5. H2: "What to Look for in a ${city} ${titleService} Company" (or topic-appropriate)
   200-250 words — licensing, insurance, warranty, local reputation, response time
   Use a bulleted list for the "what to look for" items
   Include 1 internal link to another city page:
     ${internalLinks.slice(4, 5).join("")}

6. H2: "Why ${city} Homeowners Need ${titleService}"
   150-200 words specific to ${city}: neighborhoods (mention 2-3: ${local.neighborhoods.slice(0, 3).join(", ")}), regional conditions (${local.factors})
   Include 1 internal link to related blog post:
     ${internalLinks.slice(6, 7).join("")}

7. H2: "How to Prepare for ${titleService} in ${city}"
   150-200 words of practical prep tips
   Include 1 more internal link:
     ${internalLinks.slice(7, 8).join("")}

8. H2: "Frequently Asked Questions About ${focusKeyword}"
   5 FAQ items using <details>/<summary> accordion
   Questions must mirror actual Google "People Also Ask" format (conversational, specific):
   - "How much does ${service} cost in ${city}?"
   - "How long does ${service} take in ${city}?"
   - "Is DIY ${service} worth it in ${city}?"
   - "How do I find the best ${service} company in ${city}?"
   - "What's included in professional ${service} in ${city}?"
   Each answer: 40-80 words, specific, helpful. Feature-snippet optimized.
   "${city}" MUST appear in every question.

9. Closing paragraph (60-100 words): specific CTA with phone link
   <a href="tel:+1${phone.replace(/[^0-9]/g, "")}">${phone}</a>
   No "In conclusion" — just specific actionable next step.

═══════════════════════════════════════════════════════════════════════
PAGE LAYOUT & DESIGN — PREMIUM, MATCHES LANDING PAGES
═══════════════════════════════════════════════════════════════════════

NOTHING VISIBLE ABOVE THE HEADER. Schema markup and meta tags live ONLY inside <head> — never rendered as visible text. NEVER output raw JSON, raw code, or schema text visibly on the page.

FONTS — CRITICAL PLACEMENT RULE:
The @import line MUST be the VERY FIRST line INSIDE the opening <style> tag. Never place it outside any tag, never place it before <style>, never put it in <body>, never let it appear as visible text on the page.
CORRECT structure (exactly this — the @import is INSIDE <style>):
<style>
@import url('https://fonts.googleapis.com/css2?family=${headlineFont.replace(/\s+/g, "+")}&family=${bodyFont.replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap');
/* all other CSS below */
</style>
If the @import appears as visible text on the rendered page, the HTML is broken. Verify it is wrapped in <style></style>.
- ${headlineFont}: h1, h2, h3, logo
- ${bodyFont}: body text, 1.1rem, line-height 1.8

COLORS: primary ${primaryColor}, accent ${accentColor}, footer ${footerColor}, text #222, light bg #f8f9fa

─────────────────────────────────────────────────────────────────────
1. HEADER (sticky, identical to landing pages)
─────────────────────────────────────────────────────────────────────
- position: fixed, top: 0, z-index: 1000, ${primaryColor} bg, padding 1rem 0
- Left: "${businessName}" logo in ${headlineFont}, white, 2rem
- Right: phone <a href="tel:+1${phone.replace(/[^0-9]/g, "")}">${phone}</a> in ${accentColor} with pulse animation
- Mobile: hamburger toggles nav

─────────────────────────────────────────────────────────────────────
2. READING PROGRESS BAR
─────────────────────────────────────────────────────────────────────
Fixed at very top, 3px tall, ${accentColor}, width grows 0% → 100% with scroll

─────────────────────────────────────────────────────────────────────
3. HERO BANNER (full width, 400px tall — at top of every post, below header)
─────────────────────────────────────────────────────────────────────
- <section class="blog-hero"> height: 400px, width: 100%, position: relative, overflow: hidden
- Background: <img src="${heroPhoto}" loading="eager" alt="${title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
- Dark overlay: ::after pseudo, position absolute, inset 0, background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 100%), z-index: 1
- Content wrapper: position relative, z-index: 2, max-width 1200px, margin 0 auto, padding: 6rem 2rem 3rem, color: white
  - Breadcrumb at top: small, letter-spacing 2px, opacity 0.8: <a href="/">Home</a> › <a href="/blog/">Blog</a> › <span>${category}</span>
  - H1 title: ${headlineFont}, 3.5rem desktop / 2rem mobile, text-transform: uppercase, letter-spacing: 2px, text-shadow: 2px 4px 8px rgba(0,0,0,0.4), margin-top: 1rem
  - Meta row below title: "📅 ${today}  ·  ⏱️ [reading time] min read  ·  ✍️ ${blogAuthorName}" — font-size 0.95rem, opacity 0.9

─────────────────────────────────────────────────────────────────────
4. BLOG LAYOUT — TWO COLUMNS ON DESKTOP
─────────────────────────────────────────────────────────────────────
<div class="blog-container"> max-width: 1200px, margin: 0 auto, padding: 3rem 2rem
Grid CSS (CRITICAL — prevents content disappearing):
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 3rem;
  align-items: start; /* CRITICAL: prevents column collapse from hiding text */
Below 1024px: grid-template-columns: 1fr (sidebar stacks below article)

RENDERING SAFETY RULES (enforce these — text disappearance prevention):
- .blog-container, .blog-content, .blog-sidebar, article, and any content wrapper: NO overflow: hidden. Only image containers and the hero banner may use overflow: hidden.
- NO clip-path on .blog-content, article, .post-body, or any content wrapper. clip-path is ONLY allowed on the hero banner and CTA banner.
- Inline image figures: add position: relative; z-index: 0; to prevent painting over surrounding text.
- Sticky sidebar z-index stays LOW (z-index: 1), NEVER above 10.
- Force explicit visible text color on all article text:
    .blog-content p, .blog-content li, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content strong, .blog-content a { color: #222; }
    .blog-content h2, .blog-content h3, .blog-content strong { color: ${primaryColor}; }
  This prevents any inherited color:transparent or color:white from bleeding into article text.

LEFT COLUMN — <article class="blog-content">:
- Background: white, border-radius: 16px, padding: 3rem, box-shadow: 0 4px 30px rgba(0,0,0,0.06)
- Drop cap on first letter of the opening paragraph:
    article > p:first-of-type::first-letter { float: left; font-family: ${headlineFont}; font-size: 5rem; line-height: 0.9; color: ${accentColor}; padding-right: 0.75rem; padding-top: 0.5rem; }
- H2 styling (every H2 in the article):
    font-family: ${headlineFont}; font-size: 2rem; color: ${primaryColor}; border-left: 4px solid ${accentColor}; padding-left: 1rem; margin: 3rem 0 1.5rem; scroll-margin-top: 100px;
- H3 styling: ${headlineFont}, 1.4rem, color ${primaryColor}
- Paragraphs: max 3 sentences each, margin-bottom 1.5rem, color #333
- <strong> elements: color ${primaryColor} (navy), not just bold black
- Bullet lists: custom styled — ul { list-style: none; padding-left: 0; } li { position: relative; padding-left: 2rem; margin-bottom: 0.75rem; } li::before { content: '●'; color: ${accentColor}; position: absolute; left: 0; font-size: 1.2rem; }
- INLINE IMAGES: include 1-2 inline photos between H2 sections using this template:
    <figure style="margin: 2.5rem 0;"><img src="${inlinePhoto}" loading="lazy" alt="[descriptive alt text]" style="width:100%; border-radius:12px; display:block;"><figcaption style="text-align:center; color:#888; font-size:0.9rem; margin-top:0.75rem; font-style:italic;">[caption describing the image]</figcaption></figure>
- BLOCKQUOTE style for key stats or callouts (use at least ONE in the article):
    blockquote { border-left: 4px solid ${accentColor}; background: #f8f9fa; padding: 1.5rem 2rem; margin: 2rem 0; font-size: 1.2rem; font-style: italic; color: ${primaryColor}; border-radius: 0 8px 8px 0; }
    Example usage: put a key dollar-range stat or notable fact in a blockquote.

RIGHT COLUMN — <aside class="blog-sidebar">:
- position: sticky, top: 120px, align-self: start, z-index: 1 (LOW — never above content)
- On mobile (max-width 1024px): position: static (no sticky, no z-index)
- Contains 3 boxes stacked vertically with 1.5rem gap:

  BOX 1 — Table of Contents:
  - Background: white, border: 1px solid #e5e7eb, border-radius: 12px, padding: 1.5rem
  - H4 "In This Article" — ${headlineFont}, color ${primaryColor}
  - Ordered list of H2s — smooth-scroll anchor links. Each link: color #555, hover color ${accentColor}, padding 0.5rem 0, display block, font-size 0.95rem
  - Generate TOC links dynamically via JavaScript on page load (query all h2 elements, build list)

  BOX 2 — STICKY CTA:
  - Background: ${primaryColor}, border: 2px solid ${accentColor}, border-radius: 12px, padding: 2rem, color: white
  - H4 "${businessName}" in ${headlineFont}, ${accentColor} color, 1.5rem
  - Phone: <a href="tel:+1${phone.replace(/[^0-9]/g, "")}"> ${phone}</a> in white, 1.5rem, display block, margin 1rem 0, font-weight 700
  - Full-width button "Get Free Estimate" → #contact: ${accentColor} bg, #111 text, padding 0.875rem, border-radius 8px, font-weight 700

  BOX 3 — Related Posts:
  - Background: white, border: 1px solid #e5e7eb, border-radius: 12px, padding: 1.5rem
  - H4 "Related Articles" — ${headlineFont}, color ${primaryColor}
  - 3 post link items: ${relatedPostsHtml}
  - Each: display block, padding 0.75rem 0, border-bottom 1px solid #eee, color #333, hover ${accentColor}, font-size 0.95rem

─────────────────────────────────────────────────────────────────────
5. AFTER ARTICLE (full width, below the two-column layout)
─────────────────────────────────────────────────────────────────────

AUTHOR BIO BOX — directly after article:
<div class="author-box" style="max-width:1200px; margin:3rem auto; padding:2rem; background:#f8f9fa; border-radius:16px; display:flex; gap:1.5rem; align-items:center;">
  Left: circular icon 70px, ${primaryColor} bg, white first letter of businessName in ${headlineFont} 2rem
  Right: <strong>Written by ${businessName} Team</strong> + 2-sentence description of the company's ${niche.toLowerCase()} expertise in ${city}
</div>

SOCIAL SHARE ROW:
- max-width 1200px, margin: 0 auto, padding: 0 2rem, display: flex, gap: 1rem, align-items: center
- Label "Share this article:" in #666
- 3 buttons (Facebook, X/Twitter, Copy link): each 40px square, border-radius 8px, border 1px solid #e5e7eb, background white, hover: ${accentColor} bg white text, transition 0.3s
- Use inline SVG icons (not text):
  Facebook: share URL https://www.facebook.com/sharer/sharer.php?u=${domain}/blog/${slug}/
  X/Twitter: https://twitter.com/intent/tweet?url=${domain}/blog/${slug}/&text=${title.replace(/"/g, "")}
  Copy link: JavaScript navigator.clipboard.writeText(window.location.href) + toast "Link copied"

RELATED POSTS GRID (3 cards, full width below author bio):
<section style="max-width:1200px; margin:3rem auto; padding:0 2rem;">
  <h3 style="font-family:${headlineFont}; color:${primaryColor}; margin-bottom:1.5rem;">Related Articles</h3>
  3 cards in grid: each card has thumbnail photo (use ${inlinePhoto}), title in ${headlineFont}, 2-line excerpt, "Read More →" link in ${accentColor}
  Cards: white bg, border-radius 12px, box-shadow, padding 0, overflow hidden, hover translateY(-8px)
  Grid: grid-template-columns: repeat(3, 1fr), gap 2rem (1fr on mobile)
</section>

CTA BANNER (matches landing page style):
- ${primaryColor} bg, full width, padding 5rem 2rem, text-align center
- H2 "Ready to Hire a ${nicheKeyword} in ${city}?" — white, ${headlineFont}
- Phone: ${phone} in ${accentColor}, ${headlineFont}, 3.5rem, text-shadow glow animation
- Button "Get Free Estimate" → tel: link

─────────────────────────────────────────────────────────────────────
6. FOOTER (identical to landing pages)
─────────────────────────────────────────────────────────────────────
${footerColor} bg, 3 columns: About | Services (${services.join(", ")}) | Service Area (${cities.join(", ")})
City links woven: ${cities.filter((c) => c !== city).map((c) => `<a href="/${nicheSlug}-${slugify(c)}/">${c}</a>`).join(" | ")}
Copyright: © ${year} ${businessName}. All rights reserved.

BODY padding-top: 80px so content doesn't hide under fixed header.

═══════════════════════════════════════════════════════════════════════
SEO & SCHEMA
═══════════════════════════════════════════════════════════════════════
<title>${title} | ${businessName} — ${year}</title>
<meta name="description" content="..."> — 150-155 chars. Primary keyword "${focusKeyword}" appears in FIRST 10 words. Include a CTA like "Call today" or "Get a free estimate".
<link rel="canonical" href="${domain}/blog/${slug}/">
Open Graph: og:title, og:description, og:type="article", og:url
<meta name="robots" content="index, follow">

BlogPosting JSON-LD (valid JSON):
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "author": { "@type": "Organization", "name": "${businessName}" },
  "publisher": { "@type": "Organization", "name": "${businessName}", "logo": { "@type": "ImageObject", "url": "${domain}/logo.png" } },
  "datePublished": "${today}",
  "dateModified": "${today}",
  "description": "[meta description]",
  "mainEntityOfPage": "${domain}/blog/${slug}/",
  "wordCount": [actual word count],
  "keywords": "${focusKeyword}, ${lsiKeywords.slice(0, 5).join(", ")}"
}

FAQPage JSON-LD for the 5 FAQ questions (valid JSON).

═══════════════════════════════════════════════════════════════════════
JAVASCRIPT (single <script> before </body>)
═══════════════════════════════════════════════════════════════════════
1. Reading progress bar (window scroll → bar width %)
2. Hamburger nav toggle (mobile)
3. FAQ accordion smooth max-height transition
4. TOC builder on page load: query all h2 inside .blog-content, give each an id (slugify text), and inject a list of smooth-scroll anchor links into the TOC sidebar box
5. TOC smooth-scroll: clicking a TOC link smoothly scrolls to the h2
6. Fade-in-on-scroll (IntersectionObserver)
7. Copy link button: navigator.clipboard.writeText(window.location.href) + alert "Link copied!"

═══════════════════════════════════════════════════════════════════════
OUTPUT RULES
═══════════════════════════════════════════════════════════════════════
- RAW HTML only — start <!DOCTYPE html>, end </html>
- NO markdown, NO code fences, NO explanation text before or after
- NO placeholder text, NO [Insert X], NO Lorem ipsum
- 1,000-1,400 words of real content
- "${city}" 10+ times
- "${focusKeyword}" 8-12 times
- 6-10 internal links woven into SENTENCES (not listed)
- All CSS in one <style>, all JS in one <script>
- Premium design matching the landing pages`;
}

// ── posts.json manifest ──────────────────────────────────────────────────────
function loadPostsManifest() {
  const path = join("output", "posts.json");
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8"));
  }
  return [];
}

function savePostsManifest(posts) {
  writeFileSync(join("output", "posts.json"), JSON.stringify(posts, null, 2), "utf8");
}

// ── Word-count + keyword density helpers ─────────────────────────────────────
function stripHtmlForAnalysis(html) {
  // Remove <script> and <style> blocks, then strip tags
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, "")
                       .replace(/<style[\s\S]*?<\/style>/gi, "");
  const text = noScript.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text;
}

function analyzePost(html, topic) {
  const text = stripHtmlForAnalysis(html);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const cityMatches = (text.match(new RegExp(`\\b${topic.city}\\b`, "gi")) || []).length;
  const kwRegex = new RegExp(topic.focusKeyword.replace(/\s+/g, "\\s+"), "gi");
  const keywordMatches = (text.match(kwRegex) || []).length;
  const internalLinkCount = (html.match(/<a[^>]+href=["']\/[^"']+["']/gi) || []).length;
  return { wordCount, cityMatches, keywordMatches, internalLinkCount };
}

// ── Generate one post ────────────────────────────────────────────────────────
export async function generatePost(topic) {
  console.log(`  Writing: "${topic.title}" (${topic.city})...`);

  const prompt = buildBlogPrompt(topic);

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();

  let html = message.content[0].text
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // SAFETY: if @import leaked outside <style>, relocate it to the first line inside <style>
  const strayImport = html.match(/^(\s*@import\s+url\([^)]+\)\s*;?)/m);
  if (strayImport && !/<style[^>]*>[\s\S]{0,50}@import/i.test(html)) {
    html = html.replace(strayImport[0], "");
    html = html.replace(/<style([^>]*)>/i, `<style$1>\n${strayImport[1].trim()}`);
  }

  mkdirSync(join("output", "blog"), { recursive: true });
  const outputPath = join("output", "blog", `${topic.slug}.html`);
  writeFileSync(outputPath, html, "utf8");

  // Append to posts.json manifest
  const posts = loadPostsManifest();
  const exists = posts.find((p) => p.slug === topic.slug);
  if (!exists) {
    posts.push({
      slug: topic.slug,
      title: topic.title,
      city: topic.city,
      service: topic.service,
      intent: topic.intent,
      url: `/blog/${topic.slug}/`,
      publishedAt: new Date().toISOString(),
    });
    savePostsManifest(posts);
  }

  const stats = analyzePost(html, topic);
  console.log(`  ✓ ${outputPath}`);
  console.log(`    Words: ${stats.wordCount} | "${topic.focusKeyword}" × ${stats.keywordMatches} | "${topic.city}" × ${stats.cityMatches} | internal links: ${stats.internalLinkCount} | tokens: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);

  return { path: outputPath, usage: message.usage, stats };
}

export async function generateAllPosts(topics) {
  const allTopics = topics || generateTopicMatrix();
  console.log(`\n▸ Generating ${allTopics.length} blog posts for ${client.businessName}...`);
  const results = [];
  for (const topic of allTopics) {
    results.push(await generatePost(topic));
  }
  console.log(`  Done — ${results.length} blog posts generated.\n`);
  return results;
}

// ── CLI entry ────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : undefined;

  const topics = generateTopicMatrix();
  const subset = limit ? topics.slice(0, limit) : topics;

  console.log(`Topic matrix: ${topics.length} total (priority-ordered, generating ${subset.length})`);
  console.log(`First 5 topics:`);
  subset.slice(0, 5).forEach((t, i) => console.log(`  ${i + 1}. ${t.title} [${t.intent}]`));

  generateAllPosts(subset).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
