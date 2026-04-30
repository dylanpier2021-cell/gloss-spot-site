# Pierson Digital — Home Service Website Agent

## WHAT THIS IS
This is a premium AI-powered website and SEO content generation 
system built for Pierson Digital. We are a marketing agency that 
sells complete website + SEO packages to home service businesses 
for $997-$2,997/month.

This agent does what Tim's tropicalyardstaugustine.com system does 
but for ANY home service niche. It generates a complete website 
with city pages, service pages, and 3-5 blog posts per day that 
compound in rankings over time.

## WHAT TIM'S SYSTEM DOES (WE ARE COPYING THIS)
- Static HTML site — no WordPress, no CMS, no database
- One page per city: /plumbing-austin/
- One page per service x city: /drain-cleaning-austin/
- Blog posts at /blog/{slug}/ — 3-5 per day auto-generated
- Every blog post links to 6-10 internal city and service pages
- posts.json manifest — blog index reads this dynamically
- sitemap.xml rebuilt on every publish run
- IndexNow API ping after every new page — indexed within hours
- Topic matrix: [service] x [city] x [intent] = hundreds of topics

## HOW WE ARE BETTER THAN TIM
- Fully customizable through client-config.js alone
- Works for ANY home service niche not just one business
- Premium $10,000-looking design on every page
- GHL CRM integration built in
- One command deploys entire system for any client

## WHO USES THIS
Dylan Pierson fills out client-config.js with a client's info 
and runs: node run.js
The entire website, blog system, sitemap, GHL setup, and 
IndexNow ping all happen automatically.

## CLIENT TYPES
ANY home service business:
Epoxy flooring, plumbing, roofing, HVAC, painting, 
landscaping, pressure washing, concrete, garage doors, 
electricians, window cleaning, junk removal, nail spas,
car detailing, and more.

## ALL CLIENT DATA LIVES IN client-config.js ONLY
Zero hardcoded business names, cities, niches, or domains 
anywhere in any script. Everything is dynamic.
The word "epoxy" must NEVER appear in any script file.

## NICHE SYSTEM
Every client needs these fields in client-config.js:
  niche: "Plumbing"          (display name)
  nicheKeyword: "plumber"    (main search keyword)
  nicheSlug: "plumbing"      (URL slug)
These replace all hardcoded niche references.
The niche drives: page titles, H1s, schema, blog topics,
service area copy, and FAQ questions automatically.

## PHOTO SYSTEM
Unsplash photos selected by niche via nichePhotos map in
generate-landing-page.js. Hero photo and service card 
photos are auto-selected based on client.niche.
All images use loading="lazy" except hero (loading="eager").
Client can override by adding photo URLs to client-config.js.
Supported niches in photo map: Plumbing, Epoxy Flooring,
Roofing, HVAC, default (fallback for any other niche).

## DESIGN STANDARD — NON-NEGOTIABLE
Every page must look like a $10,000 custom website.
This is what justifies the $2,997-$4,997/month price.

FONTS: Bebas Neue (all headlines) + Inter (all body) 
       via Google Fonts @import with &display=swap
HERO: Full bleed real Unsplash photo + dark overlay,
      100vh minimum height, two CTA buttons, floating
      particles, fade-in animations, scroll indicator
ANIMATIONS: CSS fade-in on scroll via IntersectionObserver,
            hover lift on cards, staggered children delays,
            animated counters on stats, star animations
MOBILE: Mobile first, fixed call button bottom (mobile only),
        hamburger nav menu, min 16px font size
COLORS: primaryColor = hero/nav, #FFD700 = CTAs only,
        #0a0a0a = footer, #001a33 = deep contrast accents
TYPOGRAPHY: Bebas Neue 5rem desktop headlines,
            clear H1 > H2 > H3 size hierarchy

## SECTION COLOR SEQUENCE — NON-NEGOTIABLE
Every page must follow this exact color sequence.
NEVER same color text on same color background.
NEVER gold (#FFD700) text on white background.
NEVER gold as a background color.

Hero          → dark photo + rgba(0,0,0,0.6) overlay + white text
Trust bar     → WHITE background + DARK (#222) text
Services      → #f8f9fa light gray + DARK text + white cards
Stats/Why Us  → #003366 DARK BLUE + WHITE text + GOLD numbers
Service Area  → #1a1a2a VERY DARK + WHITE city names + GOLD checks
Reviews       → #f0f4f8 light blue-gray + DARK text + GOLD stars
FAQ           → WHITE background + DARK text
CTA Banner    → #003366 DARK + WHITE text + GOLD phone number
Footer        → #0a0a0a DARKEST + #999 muted text

Gold (#FFD700) is ONLY used on:
  buttons, stat numbers, star ratings, checkmarks,
  phone number in CTA, accent underlines on headings
Gold is NEVER text color on white or light backgrounds.

## PAGE SECTIONS (IN ORDER)
1. Sticky nav — logo left, phone right as tel: link, hamburger mobile
   Header always visible: rgba(0,51,102,0.95) from load
   Becomes solid #003366 on scroll
2. Hero — H1 with service + city, subheadline, 2 CTAs,
   real Unsplash photo background, floating particles,
   scroll indicator, frosted glass trust items
3. Trust bar — 4 icons from client.trustPoints, white bg
4. Services — 2x2 grid, photo + letter icon, hover rotate,
   watermark numbers (01 02 03 04), accent line on hover
5. Why Us/Stats — dark bg, glassmorphism stat cards,
   animated counters, timeline bullet list
6. Service area — dark bg, all client.cities, map-pin cards
7. Reviews — alternating tilt, gold quote marks, verified badges
8. FAQ accordion — numbered, 5 questions, city in every question
9. CTA banner — diagonal cuts, animated gradient, ring animation
10. Footer — 3 columns: About | Services | Service Area
    Social icons, map placeholder, newsletter signup

## GENERATED PAGE TYPES
City landing pages:   output/{City}-landing-page.html
Service pages:        output/{service-slug}-{city-slug}.html
About page:           output/about-{city-slug}.html
Blog posts:           output/blog/{slug}.html
Blog index:           output/blog/index.html

## FILE STRUCTURE
output/
  {City}-landing-page.html     → city money pages
  {service-slug}-{city-slug}.html → individual service pages
  about-{city-slug}.html       → about page
  blog/
    {slug}.html                → blog posts
    index.html                 → blog index with search/filter
  sitemap.xml                  → auto-rebuilt every run
  posts.json                   → blog index manifest

## SCRIPTS
client-config.js   → single source of truth, all client data
generate-landing-page.js → exports:
  generateLandingPage(city)
  generateServicePage(service, city)
  generateAboutPage(city)
  generateBlogIndex()
  generateAllLandingPages()
  generateAllServicePages()
blog-generator.js  → builds blog posts from topic matrix
sitemap-generator.js → rebuilds sitemap.xml
indexnow-ping.js   → pings IndexNow for fast indexing
ghl-setup.js       → sets up GHL CRM for client
run.js             → master runner, one command deploys all
daily-cron.js      → runs 3 posts/day, tracks published slugs

## SEO ON EVERY PAGE
- <title>: [Service] in [City], [State] | [Business Name]
- <meta description>: 150-160 chars, city + keyword + trust signal
- H1: primary keyword + city name (exactly one per page)
- City name: minimum 8 times in visible text
- Internal links: all other city pages + service pages
- JSON-LD: LocalBusiness schema (valid JSON, no trailing commas)
- JSON-LD: FAQPage schema (all 5 Q&As)
- <link rel="canonical"> matching exact page URL
- Open Graph: og:title, og:description, og:type, og:url
- Meta robots: index, follow
- Hero image: loading="eager", all others loading="lazy"
- Phone links: href="tel:+1XXXXXXXXXX" format

## BLOG POST STRUCTURE (COPYING TIM EXACTLY)
URL: /blog/{service-slug}-{intent-slug}-{city-slug}/
Every post MUST have:
- Same premium header and footer as city pages
- Reading progress bar at top (3px gold, fixed)
- Table of contents sidebar (desktop, sticky)
- H1 with keyword + city
- Opening paragraph linking to 2 city pages
- 3 H2 content sections (150-200 words each)
- City-specific local section with neighborhood names
- FAQ accordion (5 questions, city in every question)
- Author box (from client.blogAuthorName)
- Related posts section (3 links from topic matrix)
- CTA banner linking to main city page
- 6-10 internal links woven naturally throughout
- BlogPosting JSON-LD schema
- FAQPage JSON-LD schema
- 800-1200 words body content
- City name 8+ times in visible text

## TOPIC MATRIX (SAME AS TIM)
Auto-generate in code — no topics.json file needed.
Formula: services x cities x intents
Intents: cost-guide, how-to-choose, vs-diy, benefits,
         maintenance-tips, common-mistakes,
         best-time, what-to-expect
Result: 5+ topics per city minimum
Slugs: {service-slug}-{intent-slug}-{city-slug}
Tracked in published-slugs.json to avoid duplicates

## CODE QUALITY STANDARDS
HTML: Valid semantic HTML5, header/main/section/footer tags
      Unique id on every section, no duplicate ids
      Proper heading hierarchy H1 > H2 > H3
CSS: All inline in <style> tag, no external except Google Fonts
     Minified comments, no unused classes
JS: All in single <script> before </body>, no external CDN
    Zero console errors on load
Performance: lazy loading all images except hero
             Google Fonts with &display=swap
Accessibility: alt text on all images, aria-label on buttons
               44px minimum touch targets, 16px min mobile font
               WCAG AA color contrast (4.5:1 minimum)

## SECURITY
- NEVER commit .env to git
- NEVER log or print API keys anywhere
- NEVER hardcode credentials in any file
- All secrets in .env via dotenv only
- .gitignore must include: .env, output/, node_modules/, 
  daily-log.txt, published-slugs.json