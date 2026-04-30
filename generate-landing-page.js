import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";

const anthropic = new Anthropic({ apiKey: client.anthropicApiKey });

// ── Slug helpers ──────────────────────────────────────────────────────────────
function citySlug(city) {
  const slug = city.toLowerCase().replace(/\s+/g, "-");
  // Champaign gets "-il" suffix to match existing indexed URLs on theglossspotil.com
  return slug === "champaign" ? "champaign-il" : slug;
}
function serviceSlug(service) {
  return service.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Niche photo map ───────────────────────────────────────────────────────────
const nichePhotos = {
  Plumbing: {
    hero: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600",
    services: [
      // 0: drain cleaning — plumber working on pipes
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
      // 1: water heater installation — water heater equipment
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      // 2: leak repair — pipe repair closeup
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
      // 3: pipe replacement — plumbing pipes
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800",
    ],
  },
  "Epoxy Flooring": {
    hero: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1600",
    services: [
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    ],
  },
  Roofing: {
    hero: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=1600",
    services: [
      "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=800",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    ],
  },
  HVAC: {
    hero: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1600",
    services: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800",
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    ],
  },
  "Car Detailing": {
    hero: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1600",
    services: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800",
      "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800",
      "https://images.unsplash.com/photo-1600661653561-629509216228?w=800",
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

function getPhotos() {
  return nichePhotos[client.niche] || nichePhotos.default;
}

// ── Call Claude API helper ────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 32000) {
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();
  const html = message.content[0].text
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return { html, usage: message.usage };
}

// ── Shared design system instructions ─────────────────────────────────────────
function designSystem() {
  const {
    businessName, phone, niche, services, cities, state,
    primaryColor, accentColor, footerColor, textColor,
    headlineFont, bodyFont, domain, nicheSlug, hours,
    trustPoints, stats, showCities, showServices,
    facebook, instagram, google, yelp,
  } = client;
  const photos = getPhotos();
  const deepNavy = "#001a33";

  return `
═══════════════════════════════════════════════════════════════════════
DESIGN SYSTEM V2 — PREMIUM $15,000 LOOK — APPLY TO EVERY PAGE
═══════════════════════════════════════════════════════════════════════

FONTS (MANDATORY — first line inside <style>):
@import url('https://fonts.googleapis.com/css2?family=${headlineFont.replace(/\s+/g, "+")}&family=${bodyFont.replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap');
- ${headlineFont}: ALL h1, h2, h3, logo, stat numbers, nav links
- ${bodyFont}: ALL body text, paragraphs, buttons
- H1: 5rem desktop, 2.5rem mobile, letter-spacing: 3px, text-transform: uppercase
- H2: 3.5rem desktop, 2rem mobile
- H3: 1.75rem
- Body text: 1.1rem, line-height: 1.8

COLORS (3-color system + strict rules):
- Primary: ${primaryColor}
- Accent: ${accentColor} — ONLY for: CTA buttons, stat numbers, star ratings, checkmarks, phone in CTA, accent lines under headings. NEVER as text on white. NEVER as background color.
- Deep: ${deepNavy} (extra dark contrast: service area bg, stat bg, footer)
- Footer: ${footerColor}
- Text: ${textColor}
- Cards on light bg: white background, ${textColor} text
- Cards on dark bg: rgba(255,255,255,0.08) glass, white text
- Card shadows: 0 8px 30px rgba(0,0,0,0.12)
- Hover lift: translateY(-12px) rotate(1deg) + box-shadow: 0 20px 40px rgba(0,0,0,0.18)

SECTION COLOR SEQUENCE (follow EXACTLY — never deviate):
  Hero: dark photo + black overlay → white text ✓
  Trust bar: WHITE bg → DARK (#222) text, colored CSS icons ✓
  Services: #f8f9fa light gray bg → DARK text, white cards ✓
  Stats/Why Us: ${primaryColor} DARK bg → WHITE text, ${accentColor} numbers ✓
  Service Area: #1a1a2a VERY DARK bg → WHITE city names, ${accentColor} checkmarks ✓
  Reviews: #f0f4f8 light blue-gray bg → DARK text, ${accentColor} stars ✓
  FAQ: WHITE bg → DARK text ✓
  CTA Banner: ${primaryColor} DARK bg → WHITE text, ${accentColor} phone ✓
  Footer: ${footerColor} DARKEST bg → #999 text ✓
NEVER put white text on white/light background.
NEVER put gold/yellow text on white background.

SECTION H2 UNDERLINE:
Every section H2 must have an ::after pseudo-element:
  content: '', display: block, width: 0, height: 4px, background: ${accentColor},
  margin: 16px auto 0, border-radius: 2px, transition: width 0.6s ease.
When the section gets class .visible, the ::after changes to width: 80px.
This creates an animated gold underline that draws on scroll.

DIAGONAL SECTION TRANSITIONS (use ::after pseudo elements, NOT clip-path):
Instead of clip-path (which clips content), use an ::after pseudo on the BOTTOM of each section that creates a triangle in the NEXT section's background color. This is cleaner and never clips content.

Implementation for each transition — add ::after to section CSS:
  position: relative; (on the section)
  section::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 60px; z-index: 2; }

Specific transitions — each uses ONE ::after pseudo on the section above. NO duplicate triangles anywhere. Color of the triangle = background color of the next section:
  1. Hero → Services: hero::after { background: #f8f9fa; clip-path: polygon(0 100%, 100% 0, 100% 100%); }
  2. Services → Stats: services::after { background: ${primaryColor}; clip-path: polygon(0 100%, 100% 0, 100% 100%); }
  3. Stats → Service Area: stats::after { background: #1a1a2a; clip-path: polygon(0 100%, 100% 0, 100% 100%); }
  4. Service Area → Reviews: SAME COLOR (#1a1a2a) — NO triangle. Remove any ::after here.
  5. Reviews → FAQ: reviews::after { background: #f8f9fa; clip-path: polygon(0 100%, 100% 0, 100% 100%); }
  6. FAQ → CTA: NO triangle on FAQ. The CTA section already has a diagonal top clip-path that handles this transition. Adding an ::after on FAQ creates a duplicate. Skip it.
  7. CTA → Footer: cta::after { background: ${footerColor}; clip-path: polygon(0 100%, 100% 0, 100% 100%); }

CRITICAL: exactly ONE ::after per transition. Do not add triangles inside other elements or stack multiple triangles.

Each section with an ::after needs padding-bottom: 80px to make room for the triangle.
Do NOT use clip-path on any section element itself — only on the ::after pseudo.

IMAGES:
- ALL images must have loading="lazy"
- Hero photo: ${photos.hero}
- Service photos: ${photos.services.map((u, i) => `[${i}] ${u}`).join(", ")}
- Use object-fit: cover on all photo containers

NO EMOJIS RULE:
- Do NOT use emoji icons EXCEPT in the hero trust pills (🛡️📋⭐✅ only — these are inside the hero, not a separate section)
- Service cards: use a CSS circle with the service initial letter (${primaryColor} background, white text, 60px, ${headlineFont})
- Stats: just numbers, no emoji
- Footer social: use styled square buttons with letter abbreviations (Fb, Ig, G, Y) — ${primaryColor} bg, white text, 40px square, border-radius 8px, hover: rotate(10deg) + ${accentColor} bg
- FAQ: use large styled numbers (01, 02, 03...) instead of any icon

STICKY HEADER (shrinks on scroll — never disappears):
- Position: fixed, top: 0, left: 0, right: 0, z-index: 1000
- ALWAYS visible with background: rgba(${parseInt(primaryColor.slice(1, 3), 16)},${parseInt(primaryColor.slice(3, 5), 16)},${parseInt(primaryColor.slice(5, 7), 16)},0.95)
- Default: padding: 1rem 0, logo font-size: 2rem, phone font-size: 1.1rem
- On scroll past 100px (.scrolled class): padding: 0.5rem 0, logo font-size: 1.5rem, phone font-size: 0.95rem, background: ${primaryColor} solid, box-shadow: 0 4px 20px rgba(0,0,0,0.4)
- Transition: all 0.3s ease on header, logo, and phone elements
- The header gets COMPACT not hidden — still fully visible, just tighter
- Left: "${businessName}" logo in ${headlineFont}, white, transition: font-size 0.3s ease
- Right: phone <a href="tel:+1${phone.replace(/[^0-9]/g, "")}">${phone}</a> in ${accentColor}, transition: font-size 0.3s ease
  Phone has CSS pulsing animation: @keyframes phonePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} } animation: phonePulse 2s infinite
- Nav links: Home, Services, About, Reviews, FAQ, Contact
  Nav link hover: underline draws from left to right (use ::after pseudo, width 0 → 100%, ${accentColor}, transition 0.3s)
  Active section highlighting via IntersectionObserver
  Letter-spacing animates on hover: 0 → 2px, transition 0.3s
- Mobile: hamburger ☰ toggles nav slide-in from right

MOBILE CTA BAR:
- Fixed bottom, z-index: 9999, only visible below 768px
- ${primaryColor} bg, "Call ${businessName}" + "${accentColor}" Call Now button → tel: link
- Body padding-bottom: 70px on mobile

FLOATING CALL BUTTON (always visible, all screen sizes):
- Position: fixed, right: 2rem, bottom: 6rem, z-index: 9998
- Width: 60px, height: 60px, border-radius: 50%, background: ${accentColor}, color: #111
- Box-shadow: 0 4px 20px rgba(255,215,0,0.4)
- Pulse animation: @keyframes floatBtnPulse { 0%,100% { box-shadow: 0 4px 20px rgba(255,215,0,0.4); } 50% { box-shadow: 0 4px 40px rgba(255,215,0,0.8); } } — 2s infinite
- On hover: transform scale(1.1)
- On mobile (max-width: 768px): bottom: 5rem (sits above mobile CTA bar)
- Links: <a href="tel:+1${phone.replace(/[^0-9]/g, "")}"> with SVG phone icon inside:
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#111"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
- aria-label="Call us"

FOOTER:
- Subtle diagonal separator above footer (CSS triangle using ::before on footer)
- Background: ${footerColor}
- 3-column grid (stack on mobile), each column has a ${accentColor} 3px accent line at top
  Column 1 "About": business name in ${headlineFont}, tagline, phone
  Column 2 "Services": ${services.join(", ")}
  Column 3 "Service Area": ${cities.join(", ")}
- Social row: 4 buttons with INLINE SVG icons (NOT text abbreviations):
  Each button: width 44px, height 44px, background #1a1a2a, border: 1px solid rgba(255,255,255,0.2), border-radius 8px, display flex, align-items center, justify-content center
  Hover: background ${accentColor}, and the SVG fill changes to #111. transition: all 0.3s ease
  Facebook SVG: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  Instagram SVG: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  Google SVG: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
  Yelp SVG: <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M20.16 12.594l-4.995 1.433c-.96.275-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 011.596-.206 9.024 9.024 0 012.364 3.51c.24.637-.1 1.34-.694 1.201zM13.19 16.289l1.978 4.7c.286.683-.226 1.43-.963 1.406a9.068 9.068 0 01-4.19-1.536 1.072 1.072 0 01-.233-1.593l3.09-3.566c.596-.69 1.7-.393 1.318.589zm-5.51-1.894l-4.98 1.374c-.703.194-1.35-.47-1.128-1.159a9.068 9.068 0 011.957-3.844 1.072 1.072 0 011.6.144l2.829 4.375c.55.853-.322 1.917-1.278 1.11zm-1.93-7.05l4.314 3.126c.83.602.544 1.871-.46 2.068L4.63 13.73c-.712.14-1.28-.51-1.107-1.208a9.02 9.02 0 011.548-3.63 1.073 1.073 0 011.678-.547zM12.31 2.068c.015 0 .03 0 .045.002a9.024 9.024 0 014.117 1.315 1.072 1.072 0 01.258 1.611L13.6 9.021c-.605.789-1.865.517-2.083-.451L10.417 3.6c-.17-.71.374-1.41 1.096-1.506a9.48 9.48 0 01.796-.026z"/></svg>
${facebook ? `  Facebook href: ${facebook}` : "  Facebook: # (placeholder)"}
${instagram ? `  Instagram href: ${instagram}` : "  Instagram: # (placeholder)"}
${google ? `  Google href: ${google}` : "  Google: # (placeholder)"}
${yelp ? `  Yelp href: ${yelp}` : "  Yelp: # (placeholder)"}
- Map placeholder: dark box (${deepNavy}), 150px height, border-radius 12px, with a CSS-drawn location pin icon (${accentColor} circle + triangle) centered. NO text inside.
- Newsletter: email input + "Subscribe" button, ${accentColor} bg
- Copyright: © 2025 ${businessName}. All rights reserved.
- IMPORTANT: ALL footer text must be #999 (gray). ALL footer links must be #999, hover → ${accentColor}.
- Cities are ONLY listed in the "Service Area" column above. Do NOT add a second separate city-links row or strip at the bottom of the footer. No duplicate city listing anywhere in the footer.

NO WHITE SPACE AT BOTTOM:
- Footer: margin-bottom: 0, padding-bottom: 2rem (no extra space)
- CSS: html, body { overflow-x: hidden; margin: 0; padding: 0; }
- body padding-bottom: 0 on desktop. Only add padding-bottom: 70px on mobile (for CTA bar) inside @media (max-width: 768px)
- No extra empty divs after footer

CUSTOM SCROLLBAR:
::-webkit-scrollbar { width: 8px }
::-webkit-scrollbar-track { background: ${deepNavy} }
::-webkit-scrollbar-thumb { background: ${accentColor}; border-radius: 4px }

EXTRA SUBTLE ANIMATIONS (add throughout):
- Nav links on page load: fade in from top one by one. Each nav link: animation: navFadeIn 0.3s ease forwards with staggered animation-delay (0.1s, 0.2s, 0.3s...). @keyframes navFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
- Hero H1 shimmer: @keyframes shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } } applied to the gradient text (background-size 200% 100%), duration 4s ease infinite
- Service card h3: on card hover, h3 letter-spacing animates from 3px to 4px (transition: letter-spacing 0.3s ease)
- Stat boxes: when parent section gets .visible, border-color briefly flashes to ${accentColor} then back to rgba(255,255,255,0.15) — use @keyframes borderFlash { 0%,100% { border-color: rgba(255,255,255,0.15); } 50% { border-color: ${accentColor}; } } animation: borderFlash 1s ease 0.5s 1 (runs once after 0.5s delay when visible)
- Footer social buttons: on load, fade in from below with 0.1s stagger. animation: socialFadeIn 0.4s ease forwards; :nth-child(1) delay 0s, (2) 0.1s, (3) 0.2s, (4) 0.3s. @keyframes socialFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

GLOBAL ANIMATIONS (use easing: cubic-bezier(0.25, 0.46, 0.45, 0.94) for all):
1. Page load: body fades in (opacity 0 → 1, 0.5s)
2. Section children stagger in one by one when .visible is added:
   - Service cards: each slides up from below (translateY(40px)→0 + opacity 0→1), staggered 0.15s between cards. Use .visible .service-card:nth-child(1) { animation-delay: 0s } :nth-child(2) { 0.15s } :nth-child(3) { 0.3s } :nth-child(4) { 0.45s }
   - Stat boxes: fade in from below (translateY(30px)→0) + counter animation starts AFTER fade completes. Stagger 0.15s each.
   - Review cards: fade in with scale(0.95)→scale(1.0) + opacity 0→1, staggered 0.15s
   - Trust bar items: bounce in one by one on page load (translateY(-20px)→0 with slight overshoot). Stagger 0.2s each. Use animation with cubic-bezier(0.34, 1.56, 0.64, 1) for bounce feel.
   - City area cards: slide in from left (translateX(-30px)→0 + opacity 0→1), staggered 0.1s
   Each animation: 0.6s duration, cubic-bezier(0.25, 0.46, 0.45, 0.94), fill forwards
3. All link hovers: underline draws left-to-right (::after width 0→100%)
4. Dark sections: subtle CSS noise texture via SVG data URI: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")

JAVASCRIPT (single <script> before </body>):
1. Header scroll: add .scrolled class when scrollY > 100
2. Hamburger toggle
3. Smooth scroll for all anchor links
4. FAQ accordion (close others when one opens)
5. IntersectionObserver: add .visible to sections (threshold 0.1) — triggers fade-in + H2 underline animation + staggered children
6. Active nav link highlighting via IntersectionObserver
7. Animated counters: when stats enter viewport, count from 0 → target over 2s (requestAnimationFrame, parse int from data-count attribute)
8. Floating hero particles: create 20 small divs (4px, ${accentColor}, border-radius 50%, position absolute) inside hero, animate upward with random x positions + delays using CSS animation (float-up, 6-12s, infinite, random delay)

CRITICAL OUTPUT RULES (every page):
- RAW HTML only — start <!DOCTYPE html>, end </html>
- NO markdown, NO code fences, NO explanation text before or after
- NO placeholder like [Insert X] — write REAL content
- NO external CSS/JS except Google Fonts @import
- All CSS in one <style>, all JS in one <script>
- Mobile-first responsive design
- City name 8+ times in visible text
- Must look like $15,000 custom website — NOT a template`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CITY LANDING PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function buildLandingPrompt(city) {
  const {
    businessName, phone, services, cities, state, niche, nicheKeyword,
    nicheSlug, primaryColor, accentColor, domain, textColor,
    headlineFont, bodyFont, heroCTA1, heroCTA2,
    trustPoints, stats, reviews, hours, emergencyService,
  } = client;
  const photos = getPhotos();
  const primaryService = services[0];
  const serviceList = services.join(", ");
  const otherCityLinks = cities.filter((c) => c !== city)
    .map((c) => `<a href="/${nicheSlug}-${citySlug(c)}/">${c}</a>`).join(" | ");
  const servicePageLinks = services
    .map((s) => `<a href="/${serviceSlug(s)}-${citySlug(city)}/">${s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}</a>`)
    .join(", ");

  let reviewInstruction;
  if (reviews && reviews.length > 0) {
    reviewInstruction = `Use these exact reviews:\n${reviews.map((r) =>
      `  - "${r.text}" — ${r.name}, ${r.city || city} (${r.rating} stars)`
    ).join("\n")}`;
  } else {
    reviewInstruction = `Generate 3 realistic reviews. Each:
  - Large opening quote mark (") in ${accentColor}, font-size: 8rem, line-height: 0, opacity: 0.3
  - 2-3 sentence review about a specific ${niche.toLowerCase()} service (vary: ${serviceList})
  - Reviewer avatar: colored circle (60px) with initials in white, background varies per reviewer
  - ★★★★★ gold stars in ${accentColor}
  - Name bold + "${city} Homeowner" or "${city} Business Owner"
  - "Verified Customer ✓" badge in small green text`;
  }

  const statsInstruction = stats.map((s) =>
    `{ number: "${s.number}", label: "${s.label}" }`
  ).join(", ");

  const deepNavy = "#001a33";

  return `You are a world-class web designer. Build a PREMIUM landing page that looks like $15,000 custom work — NOT a template. Use diagonal section cuts, floating particles, glassmorphism, animated counters, staggered animations, and real photography.

${designSystem()}

═══════════════════════════════════════════════════════════════════════
PAGE-SPECIFIC DATA
═══════════════════════════════════════════════════════════════════════
Page Type: City Landing Page
Business: ${businessName}
Niche: ${niche} | Keyword: ${nicheKeyword}
City: ${city} | State: ${state}
Phone: ${phone}
Services: ${serviceList}
All Cities: ${cities.join(", ")}
Domain: ${domain}
Page URL: ${domain}/${nicheSlug}-${citySlug(city)}/
Hours: ${hours}
Emergency: ${emergencyService ? "24/7 emergency service" : "No"}

═══════════════════════════════════════════════════════════════════════
SECTIONS — build ALL in this exact order
Every section MUST have a diagonal clip-path bottom edge (alternating directions).
═══════════════════════════════════════════════════════════════════════

1. HERO (full viewport):
   - min-height: 100vh, display: flex, align-items: center, justify-content: center, position: relative, overflow: hidden
   - Background: <img src="${photos.hero}" loading="lazy" alt="${niche} services in ${city}"> position absolute, inset 0, object-fit cover, z-index 0
   - Overlay: ::after pseudo — background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%), z-index 1 (DIAGONAL gradient, not flat)
   - Geometric accent: ::before pseudo — CSS border shapes in top-right and bottom-left corners (large 200px right-angle triangle borders, ${accentColor} at 10% opacity)
   - FLOATING PARTICLES: JavaScript creates 20 small divs (.particle) inside hero:
     position: absolute, width: 4px, height: 4px, background: ${accentColor}, border-radius: 50%, opacity: 0.4
     CSS @keyframes floatUp { 0% { transform: translateY(100vh) translateX(0); opacity:0 } 20% { opacity:0.4 } 100% { transform: translateY(-100px) translateX(var(--drift)); opacity:0 } }
     Each particle: random left position, animation-duration 6-12s, animation-delay 0-10s random, infinite
   - VIGNETTE behind text content: radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 70%), z-index 1.5
   - DO NOT add any spinning rings, .hero-animation, .hero-ring, .hero-dot elements — keep hero clean. Only floating particles + H1 shimmer.
   - Content z-index 2, centered, white text, max-width 900px
   - Content wrapper has padding-top: 6rem to push everything below the fixed header
   - Badge above H1: "⭐ Serving ${city} Since 2012" — uppercase, letter-spacing 3px, border: 1px solid ${accentColor}, padding 10px 24px, border-radius 30px, font-size 0.8rem, display: inline-block, margin-bottom: 2.5rem (clear separation from H1 below)
   - H1: "Professional ${primaryService} in ${city}, ${state}"
     Font: ${headlineFont}, 5rem desktop/2.5rem mobile, letter-spacing 3px, uppercase
     TEXT COLOR: color: white !important (ALWAYS visible fallback). Then optionally ADD gradient enhancement on top:
       background: linear-gradient(90deg, white 0%, ${accentColor} 100%);
       -webkit-background-clip: text;
       -webkit-text-fill-color: transparent;
     The color: white MUST come BEFORE the gradient lines so if gradient fails, white text shows.
     The H1 must NEVER be invisible — test by imagining gradient support is off.
     OUTLINE SHADOW: add text-shadow: 0 0 60px rgba(255,215,0,0.3) for glow
   - Subheadline: 1.3rem, ${bodyFont}, white, opacity 0.9
   - Two CTA buttons side by side:
     "${heroCTA1}: ${phone}" → tel: link, ${accentColor} bg, #111 text, bold, padding 18px 36px, border-radius 8px
     "${heroCTA2}" → #contact, transparent bg, white border 2px, white text
     Both: hover scale(1.05), transition 0.3s
   - 4 frosted-glass trust pills below buttons (inline flex, gap 1.5rem, flex-wrap wrap, justify-content center):
     🛡️ Licensed & Insured | 📋 Free Estimates | ⭐ 5-Star Rated | ✅ Satisfaction Guaranteed
     Each pill: backdrop-filter: blur(10px), background: rgba(255,255,255,0.12), border: 1px solid rgba(255,255,255,0.2), padding: 10px 20px, border-radius: 30px, font-size: 0.85rem, color: white, white-space: nowrap
     These are the ONLY place emojis appear on the entire page
   - SCROLL INDICATOR: centered at bottom of hero, a downward arrow (chevron made from CSS borders), bouncing animation: @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(10px) } }, infinite, 2s
   - FADE IN: @keyframes fadeInUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
     Badge: delay 0.2s, H1: 0.4s, subtitle: 0.6s, buttons: 0.8s, trust: 1.0s, scroll arrow: 1.2s
   - Hero gets an ::after diagonal transition (triangle in #f8f9fa pointing into services section). NO clip-path on hero itself.

** NO TRUST BAR SECTION ** — trust items are inside the hero now. Do NOT generate a separate trust bar section. Go directly from hero to services.

2. SERVICES (id="services") — padding-top: 80px (room after hero diagonal):
   - Background: #f8f9fa
   - H2: "Our ${niche} Services in ${city}" + animated gold underline (::after, 0→80px on .visible)
   - CSS grid: grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) — responsive, shows as many columns as fit
   - CRITICAL: generate a card for EVERY SINGLE service in the list. Do NOT limit to 4. Show ALL ${services.length} services:
     ${serviceList}
   - Each service listed above MUST have its own card — no omitting any.
   - Each card:
     - gradient bg: linear-gradient(145deg, #ffffff 0%, #fafafa 100%)
     - border-radius: 16px on the whole card (clean rounded corners)
     - border-top: 4px solid ${accentColor} at the top of each card (gold accent stripe)
     - DO NOT use clip-path on service cards — no angled top corner. Just rounded corners + gold top border.
     - Photo at top: <img src="[exact URL below]" loading="lazy" alt="[service] in ${city}" style="height:200px; width:100%; object-fit:cover;">
       Cycle through the service photos array for each card using index % photos.length. Every card gets a different photo. Photos:
${services.map((s, i) => `       Card ${i + 1} "${s}": ${photos.services[i % photos.services.length]}`).join("\n")}
     - Large WATERMARK number behind card title: "01", "02", "03", "04" — font-size: 8rem, color: rgba(0,0,0,0.04), position absolute, top: 180px, right: 20px, ${headlineFont}, line-height: 1, pointer-events: none
     - CSS CIRCLE icon with service initial letter (replaces emoji): 60px circle, ${primaryColor} bg, white text, ${headlineFont}, font-size 1.5rem, margin-top: -30px, margin-left: 20px, box-shadow, z-index 2, position relative
     - H3: service name
     - 2-3 sentence description
     - Accent line: height 3px, width 0, ${accentColor}, transition: width 0.4s. On card hover → width: 100%
     - "Learn More →" link ALWAYS VISIBLE at bottom of card (not hover-triggered):
       color: ${primaryColor}, font-weight: 600, text-decoration: none, display: inline-block, margin-top: 1rem
       On hover: color shifts to ${accentColor}, letter-spacing animates from 0 to 2px, transition: all 0.3s ease
       Links: ${services.map((s) => `"${s}" → /${serviceSlug(s)}-${citySlug(city)}/`).join(", ")}
     - DO NOT add any hover tooltip/overlay on service cards. No .service-tooltip class. No sliding text.
     - Card hover: translateY(-12px) rotate(1deg), box-shadow: 0 20px 40px rgba(0,0,0,0.18)
   - clip-path bottom: polygon(0 0, 100% 0, 100% calc(100% - 60px), 0 100%)

3. STATS / WHY US — NO clip-path on this section itself. Uses ::after for diagonal (bg #1a1a2a). Padding: 100px top, 80px bottom.
   - Background: ${primaryColor} solid (NOT white, NOT transparent). This is a DARK section.
   - All text inside this section MUST be white or ${accentColor}. Never dark text here.
   - Add subtle grid pattern overlay: background-image with repeating-linear-gradient creating a fine grid at 5% white opacity
   - Add CSS noise texture overlay (SVG filter, very low opacity)
   - Two columns (stack mobile):
     LEFT COLUMN:
       H2 "Why ${city} Trusts ${businessName}" — white, ${headlineFont}, text-align left
       Large decorative quotation mark behind text: ::before content '"', ${accentColor}, font-size 15rem, opacity 0.08, position absolute, top: -40px, left: -20px
       3 bullet points with CSS-drawn checkmark icons (small ${accentColor} circles with white ✓ drawn via borders/transforms):
         - "Over ${stats[0]?.number || "500+"} satisfied customers"
         - "Licensed, insured, and certified"
         - "Transparent pricing, no hidden fees"
       Connected by a vertical timeline line (2px ${accentColor}, left of bullet points)
     RIGHT COLUMN: 2×2 stat grid
       Stats: ${statsInstruction}
       Each stat box: background: rgba(255,255,255,0.1), border: 1px solid rgba(255,255,255,0.15), border-radius 16px, padding 2.5rem, backdrop-filter: blur(10px)
       Number: ${headlineFont}, color: ${accentColor} (GOLD on dark bg — high contrast), font-size: 5rem, data-count="[number parsed]" for JS counter
       Label: color: WHITE (#ffffff), font-size: 0.9rem, ${bodyFont}
       IMPORTANT: stat numbers are GOLD, labels are WHITE. Both on DARK navy background. Never white-on-white.
       HOVER REVEAL: each stat box has overflow: hidden, position: relative. A hidden description at bottom:
         position: absolute, bottom: 0, left: 0, right: 0, padding: 10px, background: rgba(0,0,0,0.5), color: rgba(255,255,255,0.9), font-size: 0.8rem, text-align: center
         Default: opacity: 0, translateY(100%). On hover → opacity: 1, translateY(0), transition: 0.3s
         Descriptions: "${stats[0]?.number || '500+'} happy customers", "Consistently ${stats[1]?.number || '5'} stars", "Over a decade of experience", "We guarantee our work"
       Hover: background rgba(255,255,255,0.18), transform scale(1.05)

4. SERVICE AREA (id="service-area") — NO clip-path. Same dark bg as reviews, no diagonal between them:
   - Background: animated slow diagonal gradient:
     background: linear-gradient(135deg, #1a1a2a 0%, #0d0d1a 50%, #1a1a2a 100%), background-size: 200% 200%
     @keyframes bgShift { 0%{background-position:0% 0%} 50%{background-position:100% 100%} 100%{background-position:0% 0%} }
     animation: bgShift 15s ease infinite
   - H2: "Serving ${city} and Surrounding Areas" — color: WHITE. Gold underline ::after.
   - Grid of city cards:
     Cities: ${cities.join(", ")}
     Each card: background: rgba(255,255,255,0.08), border: 1px solid rgba(255,255,255,0.1), border-radius 12px, padding 2rem, text-align center, position relative, overflow hidden
     City name: WHITE, bold, ${headlineFont}, 1.3rem
     Checkmark: ${accentColor} gold ✓ above city name
     Location pin icon: CSS circle (12px, ${accentColor}) + triangle below, centered above checkmark
     PULSE ring on pin icon: @keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} } — a second circle behind the pin, animating scale + fade, infinite 2s
     On HOVER: background rgba(255,255,255,0.15), lift -8px, AND reveal a hidden description overlay:
       Position: absolute, bottom: 0, left: 0, right: 0 (ONLY bottom half of card — don't cover city name or checkmark on top)
       Background: rgba(0,26,51,0.97) — very dark navy, near opaque
       Border-top: 2px solid ${accentColor}
       Color: rgba(255,255,255,0.95) — WHITE text, fully readable
       Font-size: 0.8rem, text-align: center, padding: 1rem
       Default: opacity 0, transform translateY(100%). On card:hover → opacity 1, translateY(0), transition 0.3s
       Text: ONE short sentence only, max 10-15 words. Example: "Mobile detailing available throughout [city]."
       NOT a full paragraph. Just a punchy confirmation line.
     Slide-in-from-left animation on scroll, staggered 0.1s per card
   - Below grid: <a href="#footer" style="color:${accentColor}">View Full Service Area →</a>, centered, margin-top 2rem

5. REVIEWS (id="reviews"):
   - Background: #1a1a2a (DARK section — creates strong contrast with bright white cards)
   - Subtle diagonal stripe pattern overlay: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.015) 10px, rgba(255,255,255,0.015) 20px)
   - H2: "What ${city} Customers Say" — color: WHITE (dark bg). Gold underline ::after.
   - ${reviewInstruction}
   - PREMIUM card design:
     Background: WHITE (#ffffff), border-radius 16px, box-shadow: 0 12px 40px rgba(0,0,0,0.3), padding 2.5rem
     TOP BORDER: 4px solid — each card has DIFFERENT color matching its avatar (card 1: #2563eb, card 2: #059669, card 3: #dc2626)
     Position: relative (for quote mark)
     Quote mark: CSS ::before, content: '"', color: ${accentColor}, font-size: 6rem, opacity: 0.15, position: absolute, top: 10px, left: 15px, pointer-events: none, ${headlineFont}
     Stars: each ★ animates in one by one (opacity 0→1), animation-delay: nth-child(1) 0s, (2) 0.1s, (3) 0.2s, (4) 0.3s, (5) 0.4s — triggered when parent section gets .visible class. Color: ${accentColor}, font-size: 1.3rem
     Review text: color: #444, font-size: 1.05rem, line-height: 1.8, font-style: italic
     Reviewer name: color: ${primaryColor}, font-weight: 700
     Reviewer location: color: #888, font-size: 0.85rem
     Avatar circle: 50px, unique bg (nth-child: 1=#2563eb, 2=#059669, 3=#dc2626), white initials, font-weight 700
     Google Review badge: small gray pill, background: #f1f3f4, color: #5f6368, font-size: 0.7rem, padding: 3px 10px, border-radius: 12px, text: "Google Review"
     Verified badge: pill, background: #e8f5e9, color: #2d7a4f, font-size: 0.75rem, "✓ Verified"
     Hover: translateY(-8px), perspective(1000px) rotateX(3deg), box-shadow: 0 20px 50px rgba(0,0,0,0.4)
     Alternate tilt: nth-child(odd) rotate(0.5deg), nth-child(even) rotate(-0.5deg), hover → rotate(0)
   - NO clip-path on this section

6. FAQ ACCORDION (id="faq"):
   - Background: linear-gradient(180deg, #f8f9fa 0%, white 100%). Position: relative, overflow: hidden.
   - Large decorative watermark: a ::before pseudo on the FAQ section container:
     content: "FAQ", font-family: ${headlineFont}, font-size: 20rem, color: ${primaryColor}, opacity: 0.03,
     position: absolute, top: 50%, left: 50%, transform: translate(-50%, -50%), pointer-events: none, white-space: nowrap
   - H2: "Frequently Asked Questions" — color: ${primaryColor}. Gold underline ::after.
   - 5 FAQ items about ${niche.toLowerCase()} in ${city}
   - "${city}" MUST appear in every question
   - Topics: cost, timeline, warranty, maintenance, why choose us
   - Each item: large styled NUMBER on left (01, 02, 03...) — ${headlineFont}, ${accentColor}, 3rem, font-weight: bold, opacity 0.6
   - Summary: bold ${bodyFont}, padding 1.25rem 1.25rem 1.25rem 5rem (left space for number), cursor pointer, transition all 0.3s
   - Open/active state: border-left: 4px solid ${accentColor} + background: rgba(255,215,0,0.05) (very subtle gold tint)
   - Smooth height animation (max-height transition on the answer content)
   - FAQPage JSON-LD schema in <head>
   - NO clip-path on FAQ section

7. CTA BANNER (id="contact"):
   - Diagonal top cut ONLY: clip-path: polygon(0 60px, 100% 0, 100% 100%, 0 100%)
   - Background: MUST be dark — linear-gradient(135deg, ${primaryColor} 0%, ${deepNavy} 100%). No light colors.
   - FORCE: all h2 inside this section: color: white !important
   - FORCE: all p tags inside this section: color: rgba(255,255,255,0.9) !important
   - Padding: 8rem 0 (extra tall for impact)
   - H2: "Ready for Professional ${niche} Service in ${city}?" — white, ${headlineFont}, 3rem
   - PHONE ROW: a flex row containing [left arrow ►][phone number][right arrow ◄]
     HTML structure:
       <div class="cta-phone-row" style="display: flex; align-items: center; justify-content: center; gap: 2rem; margin: 1.5rem 0;">
         <div class="cta-arrow" style="color: ${accentColor}; opacity: 0.5; font-size: 2rem;">►</div>
         <a href="tel:+1${phone.replace(/[^0-9]/g, "")}" class="cta-phone">${phone}</a>
         <div class="cta-arrow" style="color: ${accentColor}; opacity: 0.5; font-size: 2rem;">◄</div>
       </div>
     Phone styling: color: ${accentColor}, ${headlineFont}, font-size: 4rem, letter-spacing: 4px, display: inline-block
     NO emoji, NO box, NO border, NO background, NO padding on phone link — just pure glowing text
     Pure text-shadow glow animation on the phone link:
     @keyframes phoneTextGlow { 0%,100% { text-shadow: 0 0 0px rgba(255,215,0,0); transform: scale(1); } 50% { text-shadow: 0 0 30px rgba(255,215,0,0.9); transform: scale(1.04); } }
     animation: phoneTextGlow 2s ease infinite
   - BEFORE the phone number, add ONE paragraph that includes the cities woven naturally:
     "Get fast, reliable ${niche.toLowerCase()} service from ${city}'s most trusted ${niche.toLowerCase()} company. Serving ${cities.slice(0, -1).join(", ")}, and ${cities[cities.length - 1]}."
     Color: rgba(255,255,255,0.9), font-size: 1.15rem, max-width: 700px, margin: 0 auto 1.5rem
   - ${heroCTA2} button (AFTER the phone row) — ${accentColor} bg, #111 text, large, hover scale(1.05)
   - DO NOT add a separate "Serving X, Y, Z" line at the bottom — cities are in the paragraph above
   - DO NOT add extra arrows elsewhere — the only arrows are the two in the .cta-phone-row flanking the phone

8. RELATED PAGES SECTION (id="related-pages") — above footer, below CTA:
   - Background: #f8f9fa
   - Two rows:
     Row 1 — "Our Services in ${city}" — grid of 4 service page cards (pick first 4 services):
       ${services.slice(0, 4).map((s) => {
         const ts = s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
         return `<a href="/${serviceSlug(s)}-${citySlug(city)}/">${ts}</a>`;
       }).join(", ")}
       Each card: white bg, border-radius 12px, shadow, padding 1.5rem, ${headlineFont} title, "View Service →" link, hover lift
     Row 2 — "Also Serving" — grid of 4 other city landing page cards (first 4 other cities):
       ${cities.filter((c) => c !== city).slice(0, 4).map((c) => `<a href="/${nicheSlug}-${citySlug(c)}/">${niche} in ${c}</a>`).join(", ")}
       Same card style, hover lift

INTERNAL LINKS IN BODY CONTENT — weave these naturally into sentences throughout the page (not listed in a block):
- Link to service pages: ${services.slice(0, 4).map((s) => `<a href="/${serviceSlug(s)}-${citySlug(city)}/">${s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} in ${city}</a>`).join(", ")}
- Link to other city pages: ${cities.filter((c) => c !== city).slice(0, 3).map((c) => `<a href="/${nicheSlug}-${citySlug(c)}/">${niche} in ${c}</a>`).join(", ")}
Use keyword-rich anchor text. Embed inside sentences naturally.

9. FOOTER (as described in design system — 3-column, SVG social icons, dark map box with CSS pin, newsletter signup)

═══════════════════════════════════════════════════════════════════════
SEO & CODE QUALITY (strict requirements)
═══════════════════════════════════════════════════════════════════════

TITLE TAG (exact format):
<title>${primaryService.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} in ${city}, ${state} | ${businessName}</title>

META DESCRIPTION: exactly 150-160 characters. Must include: city name, primary keyword, trust signal (licensed, free estimates, etc). Example format: "Professional [service] in [city], [state]. Licensed & insured [niche] company. Free estimates. Call [phone]."

CANONICAL: <link rel="canonical" href="${domain}/${nicheSlug}-${citySlug(city)}/">
OPEN GRAPH: og:title (same as title), og:description (same as meta desc), og:type="website", og:url (same as canonical)
ROBOTS: <meta name="robots" content="index, follow">

H1: exactly ONE per page. Must contain city name + primary keyword.
H2s: each section has unique descriptive H2. Never duplicate.
Heading hierarchy: H1 → H2 → H3 only. Never skip levels.

SCHEMA — LocalBusiness JSON-LD in <head> (valid JSON, no trailing commas):
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${businessName}",
  "telephone": "${phone}",
  "address": { "@type": "PostalAddress", "addressLocality": "${city}", "addressRegion": "${state}" },
  "url": "${domain}/${nicheSlug}-${citySlug(city)}/",
  "description": "Professional ${primaryService} services in ${city}, ${state}",
  "openingHours": "${hours}"
}

SCHEMA — FAQPage JSON-LD in <head> (valid JSON for all 5 FAQ Q&As)

PERFORMANCE:
- Hero image: loading="eager" (first paint). ALL other images: loading="lazy"
- Google Fonts @import URL must include &display=swap
- All JS in single <script> at bottom before </body> (not in <head>)
- Inline CSS only (no external except Google Fonts)
- No unused CSS classes

HTML STRUCTURE:
- Semantic HTML5: <header>, <main> wrapping all sections, <footer>
- Each section: unique id attribute matching nav links
- Nav: aria-label="Main navigation"
- All phone links: href="tel:+1${phone.replace(/[^0-9]/g, "")}"
- All images: descriptive alt text with city + service keyword
- No duplicate id attributes
- Footer: internal links to other city pages + service pages

MOBILE:
- <meta name="viewport" content="width=device-width, initial-scale=1.0">
- No horizontal scroll
- Touch targets: min 44px height
- Font-size: min 16px on mobile body text
- Footer stacks single column below 768px

FINAL:
- Zero console errors
- No broken links, no placeholder text
- Copyright: © 2025
- Business name + phone + city consistent throughout
- Service page links in body: ${servicePageLinks}
- Other city links: ${otherCityLinks}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function buildServicePrompt(service, city) {
  const {
    businessName, phone, niche, nicheKeyword, nicheSlug, services, cities,
    state, primaryColor, accentColor, domain, headlineFont, bodyFont,
    heroCTA1, heroCTA2, trustPoints, stats, hours,
  } = client;
  const photos = getPhotos();
  const titleService = service.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const serviceIdx = services.indexOf(service);
  const servicePhoto = photos.services[serviceIdx % photos.services.length];
  const otherServices = services.filter((s) => s !== service);
  const otherServiceLinks = otherServices.map((s) =>
    `<a href="/${serviceSlug(s)}-${citySlug(city)}/">${s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} in ${city}</a>`
  ).join(", ");

  return `You are a world-class web designer. Build a PREMIUM service page for a ${niche.toLowerCase()} company. Must look like $10,000 custom work. This page must feel like the SAME SITE as the landing page — same header, footer, colors, fonts, animations.

${designSystem()}

CONSISTENCY REQUIREMENTS — this service page must match the landing page exactly:
- Same sticky header (logo left, phone right, nav center, compacts on scroll)
- Same footer (3-column, SVG social icons, no duplicate city links)
- Same floating gold call button (fixed bottom-right, SVG phone icon, pulse animation)
- Same mobile CTA bar (fixed bottom, mobile only)
- Same section transition triangles (::after pseudo elements)
- Same fadeInUp animations + IntersectionObserver
- Same fonts, colors, shadows, hover effects

═══════════════════════════════════════════════════════════════════════
PAGE-SPECIFIC DATA
═══════════════════════════════════════════════════════════════════════
Page Type: Individual Service Page
Business: ${businessName}
Niche: ${niche}
Service: ${titleService}
City: ${city} | State: ${state}
Phone: ${phone}
All Services: ${services.join(", ")}
All Cities: ${cities.join(", ")}
Domain: ${domain}
Page URL: ${domain}/${serviceSlug(service)}-${citySlug(city)}/
Hours: ${hours}

═══════════════════════════════════════════════════════════════════════
SECTIONS — build ALL in this order
═══════════════════════════════════════════════════════════════════════

1. HERO:
   - min-height: 60vh
   - Background: <img src="${servicePhoto}" loading="eager" alt="${titleService} in ${city}"> with dark overlay linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.5))
   - Badge: "⭐ ${city}'s Trusted ${titleService} Experts"
   - H1: "${titleService} in ${city}, ${state}" — color: white !important, 5rem, uppercase, letter-spacing 3px
   - 4 frosted-glass trust pills below buttons (same as landing hero): Licensed & Insured | Free Estimates | 5-Star Rated | Satisfaction Guaranteed
   - Two CTA buttons: "${heroCTA1}: ${phone}" + "${heroCTA2}"
   - Fade-in animation, floating particles

3. WHAT IS ${titleService.toUpperCase()} (id="what"):
   - Background: white
   - H2: "What is ${titleService}?" + gold underline
   - 200-300 words detailed explanation
   - Include a relevant image: <img src="${photos.services[(serviceIdx + 1) % photos.services.length]}" loading="lazy" alt="${titleService} process" style="width:100%;max-width:600px;border-radius:12px;margin:2rem auto;display:block;">

4. WHY YOU NEED IT (id="why"):
   - Background: #f8f9fa
   - H2: "Why You Need Professional ${titleService} in ${city}" + gold underline
   - 4 benefit cards in grid, each with emoji icon, title, description
   - Internal link back to main city page: <a href="/${nicheSlug}-${citySlug(city)}/">${niche} in ${city}</a>

5. OUR PROCESS (id="process"):
   - Background: white
   - H2: "Our ${titleService} Process" + gold underline
   - Numbered steps (4-5 steps), each with:
     Step number in ${accentColor} circle (large, 60px)
     Step title (H3)
     1-2 sentence description
   - Clean timeline-style layout

6. BEFORE AND AFTER (id="results"):
   - Background: #f0f4f8
   - H2: "See the Difference" + gold underline
   - Two placeholder image boxes side by side:
     Left: gray box (#e0e0e0) labeled "Before" with border-radius, height 250px
     Right: gray box (#e0e0e0) labeled "After"
   - Text below: "Contact us to see real project photos from ${city}"

7. PRICING (id="pricing"):
   - Background: white
   - H2: "${titleService} Pricing in ${city}" + gold underline
   - Price range card: "Starting from $XXX" (make up a realistic range for ${service})
   - "Every project is unique — call for your free personalized estimate"
   - Large CTA button: "${heroCTA1}: ${phone}" → tel: link
   - Mention: free estimates, no hidden fees, financing available

8. SERVICE AREA:
   - All cities grid with checkmarks

9. FAQ ACCORDION (5 questions about ${service} in ${city}):
   - "${city}" in every question
   - FAQPage JSON-LD schema in <head>

10. CTA BANNER:
    - "Need ${titleService} in ${city}?" — strong headline
    - Phone + button

11. RELATED PAGES SECTION (id="related-pages"):
    - Background: #f8f9fa
    - Row 1 — "Other ${niche} Services in ${city}": grid of 4 cards for other services:
      ${otherServiceLinks}
      Each card: white bg, rounded 12px, shadow, padding 1.5rem, service name in ${headlineFont}, "View Service →", hover lift
    - Row 2 — "This Service in Other Cities": grid of 4 cards:
      ${cities.filter((c) => c !== city).slice(0, 4).map((c) => `<a href="/${serviceSlug(service)}-${citySlug(c)}/">${titleService} in ${c}</a>`).join(", ")}
      Same card style

INTERNAL LINKS IN BODY — weave naturally into sentences:
- Main city page: <a href="/${nicheSlug}-${citySlug(city)}/">${niche} services in ${city}</a>
- Other service pages: ${otherServices.slice(0, 3).map((s) => `<a href="/${serviceSlug(s)}-${citySlug(city)}/">${s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")} in ${city}</a>`).join(", ")}
- Same service other cities: ${cities.filter((c) => c !== city).slice(0, 2).map((c) => `<a href="/${serviceSlug(service)}-${citySlug(c)}/">${titleService} in ${c}</a>`).join(", ")}

12. FOOTER (3-column as design system)

SEO in <head>:
- <title>${titleService} in ${city}, ${state} | ${businessName}</title>
- <meta description> 150-160 chars specific to this service
- Canonical: ${domain}/${serviceSlug(service)}-${citySlug(city)}/
- OG tags, robots
- LocalBusiness JSON-LD
- FAQPage JSON-LD`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function buildAboutPrompt(city) {
  const {
    businessName, phone, niche, nicheKeyword, nicheSlug, services, cities,
    state, primaryColor, accentColor, domain, headlineFont, bodyFont,
    heroCTA1, heroCTA2, trustPoints, stats, hours,
    blogAuthorName, blogAuthorTitle,
  } = client;
  const photos = getPhotos();
  const serviceList = services.join(", ");

  return `You are a world-class web designer. Build a PREMIUM about page for a ${niche.toLowerCase()} company. This page must feel like the SAME SITE as the landing page — same header, footer, colors, fonts, animations.

${designSystem()}

CONSISTENCY REQUIREMENTS — this about page must match the landing page exactly:
- Same sticky header (logo left, phone right, nav center, compacts on scroll)
- Same footer (3-column, SVG social icons, no duplicate city links)
- Same floating gold call button (fixed bottom-right, SVG phone icon, pulse animation)
- Same mobile CTA bar (fixed bottom, mobile only)
- Same section transition triangles where appropriate (::after pseudo elements)
- Same fadeInUp animations + IntersectionObserver
- Same fonts, colors, shadows, hover effects
- H1: color: white !important (always visible on dark hero)

═══════════════════════════════════════════════════════════════════════
PAGE-SPECIFIC DATA
═══════════════════════════════════════════════════════════════════════
Page Type: About Page
Business: ${businessName}
Niche: ${niche}
City: ${city} | State: ${state}
Phone: ${phone}
Services: ${serviceList}
All Cities: ${cities.join(", ")}
Domain: ${domain}
Page URL: ${domain}/about-${citySlug(city)}/
Team: ${blogAuthorName} — ${blogAuthorTitle}

═══════════════════════════════════════════════════════════════════════
SECTIONS
═══════════════════════════════════════════════════════════════════════

1. HERO:
   - min-height: 50vh
   - Background: ${photos.hero} with dark overlay
   - H1: "About ${businessName}" — uppercase, 5rem
   - Subheadline: "Serving ${city} and ${state} with pride"
   - Fade-in animation

2. TEAM PHOTO PLACEHOLDER:
   - Large gray box (#e0e0e0), 400px height, border-radius 12px
   - Centered, max-width 800px
   - Label: "Our ${niche} Team" centered inside
   - Text below: "The ${businessName} team serving ${city} and surrounding areas"

3. OUR STORY (id="story"):
   - H2: "Our Story" + gold underline
   - 300-400 words about how the company started, why ${niche.toLowerCase()} matters
   - Mention ${city} at least 4 times
   - Weave in passion for quality, community

4. MISSION STATEMENT:
   - Background: ${primaryColor}, white text
   - Large quote-style mission statement about quality ${niche.toLowerCase()} service
   - ${headlineFont}, italic, 2rem, centered

5. BY THE NUMBERS:
   - Stats grid using client stats: ${stats.map((s) => `${s.number} ${s.label}`).join(", ")}
   - Dark bg, gold numbers, white labels, animated counters

6. SERVICE AREA:
   - All cities grid
   - "Professional ${niche.toLowerCase()} services throughout ${state}"

7. WHY WE STARTED:
   - Background: #f8f9fa
   - H2 + gold underline
   - Personal story about the founding, 150-200 words

8. CORE VALUES:
   - 4 values in grid:
     🎯 Quality Workmanship — description
     🤝 Honest Pricing — description
     ⚡ Fast Response — description
     💎 Customer First — description
   - Cards with emoji icon, title, description

9. CTA BANNER:
   - "Ready to Work With ${city}'s Best ${niche} Team?"
   - Phone + button

10. FOOTER (3-column as design system)

SEO:
- <title>About ${businessName} | ${niche} Services in ${city}, ${state}</title>
- <meta description>
- Canonical, OG tags, robots
- LocalBusiness JSON-LD
- Internal links to city pages and service pages`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG INDEX PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function buildBlogIndexPrompt() {
  const {
    businessName, phone, niche, nicheSlug, services, cities,
    state, primaryColor, accentColor, domain, headlineFont, bodyFont,
  } = client;
  const photos = getPhotos();

  // Read posts.json
  const postsPath = join("output", "posts.json");
  let posts = [];
  if (existsSync(postsPath)) {
    posts = JSON.parse(readFileSync(postsPath, "utf8"));
  }

  const postsJson = JSON.stringify(posts);
  const uniqueCities = [...new Set(posts.map((p) => p.city))];
  const uniqueServices = [...new Set(posts.map((p) => p.service))];

  return `You are a world-class web designer. Build a PREMIUM blog index page for a ${niche.toLowerCase()} company.

${designSystem()}

═══════════════════════════════════════════════════════════════════════
PAGE-SPECIFIC DATA
═══════════════════════════════════════════════════════════════════════
Page Type: Blog Index
Business: ${businessName}
Domain: ${domain}
Page URL: ${domain}/blog/

═══════════════════════════════════════════════════════════════════════
BLOG POSTS DATA (embed in a <script> tag as JSON):
═══════════════════════════════════════════════════════════════════════
const posts = ${postsJson};

═══════════════════════════════════════════════════════════════════════
PAGE STRUCTURE
═══════════════════════════════════════════════════════════════════════

1. HERO:
   - min-height: 40vh
   - Background: ${photos.hero} with dark overlay
   - H1: "${businessName} Blog" — uppercase, 5rem
   - Subheadline: "Expert ${niche} tips, guides, and advice for ${client.city} and beyond"

2. FILTER BAR:
   - Sticky below header
   - Search input (text field, placeholder: "Search articles...")
   - City filter buttons: ${uniqueCities.length > 0 ? uniqueCities.join(", ") : cities.join(", ")} + "All" button
   - Service filter buttons: ${uniqueServices.length > 0 ? uniqueServices.map((s) => s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")).join(", ") : services.map((s) => s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")).join(", ")} + "All" button
   - Active button: ${accentColor} bg
   - Inactive: white bg, border
   - Background: white, shadow, padding 1rem

3. BLOG GRID (id="posts"):
   - CSS grid: 3 columns desktop, 2 tablet, 1 mobile
   - Each card:
     - White bg, rounded 12px, shadow 0 8px 30px rgba(0,0,0,0.12)
     - Top: colored strip (4px) in ${accentColor}
     - Service tag: small badge with service name, ${primaryColor} bg, white text
     - City tag: small badge, ${accentColor} bg
     - Title: H3, ${headlineFont}, 1.5rem
     - Date: small gray text (format published date nicely)
     - "Read Article →" link in ${primaryColor}
     - Hover: lift -12px + stronger shadow
   - Cards rendered dynamically from posts array via JavaScript
   - If no posts: show "No articles yet. Check back soon!"

4. JAVASCRIPT FUNCTIONALITY:
   - Render all posts as cards from the posts array
   - Search: filter by title (case-insensitive, real-time on keyup)
   - City filter: show only posts matching selected city (or all)
   - Service filter: show only posts matching selected service (or all)
   - Both filters work together (AND logic)
   - Smooth card fade in/out when filtering

5. FOOTER (3-column as design system)

SEO:
- <title>${businessName} Blog | ${niche} Tips & Guides</title>
- <meta description> about the blog
- Canonical: ${domain}/blog/
- OG tags, robots`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateLandingPage(city) {
  console.log(`  Generating landing page: ${city}...`);
  const { html, usage } = await callClaude(buildLandingPrompt(city));
  mkdirSync("output", { recursive: true });
  const filename = `${city.replace(/\s+/g, "-")}-landing-page.html`;
  const outputPath = join("output", filename);
  writeFileSync(outputPath, html, "utf8");
  console.log(`  ✓ ${outputPath} (in: ${usage.input_tokens}, out: ${usage.output_tokens})`);
  return { path: outputPath, usage };
}

export async function generateServicePage(service, city) {
  const titleService = service.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  console.log(`  Generating service page: ${titleService} — ${city}...`);
  const { html, usage } = await callClaude(buildServicePrompt(service, city));
  mkdirSync("output", { recursive: true });
  const filename = `${serviceSlug(service)}-${citySlug(city)}.html`;
  const outputPath = join("output", filename);
  writeFileSync(outputPath, html, "utf8");
  console.log(`  ✓ ${outputPath} (in: ${usage.input_tokens}, out: ${usage.output_tokens})`);
  return { path: outputPath, usage };
}

export async function generateAboutPage(city) {
  console.log(`  Generating about page: ${city}...`);
  const { html, usage } = await callClaude(buildAboutPrompt(city));
  mkdirSync("output", { recursive: true });
  const outputPath = join("output", `about-${citySlug(city)}.html`);
  writeFileSync(outputPath, html, "utf8");
  console.log(`  ✓ ${outputPath} (in: ${usage.input_tokens}, out: ${usage.output_tokens})`);
  return { path: outputPath, usage };
}

export async function generateBlogIndex() {
  console.log(`  Generating blog index page...`);
  const { html, usage } = await callClaude(buildBlogIndexPrompt());
  mkdirSync(join("output", "blog"), { recursive: true });
  const outputPath = join("output", "blog", "index.html");
  writeFileSync(outputPath, html, "utf8");
  console.log(`  ✓ ${outputPath} (in: ${usage.input_tokens}, out: ${usage.output_tokens})`);
  return { path: outputPath, usage };
}

// ── Batch generators ──────────────────────────────────────────────────────────
export async function generateAllLandingPages() {
  const { cities, businessName } = client;
  console.log(`\n▸ Generating ${cities.length} landing pages for ${businessName}...`);
  const results = [];
  for (const city of cities) {
    results.push(await generateLandingPage(city));
  }
  console.log(`  Done — ${results.length} landing pages.\n`);
  return results;
}

export async function generateAllServicePages() {
  const { services, cities, businessName } = client;
  const total = services.length * cities.length;
  console.log(`\n▸ Generating ${total} service pages for ${businessName}...`);
  const results = [];
  for (const city of cities) {
    for (const service of services) {
      results.push(await generateServicePage(service, city));
    }
  }
  console.log(`  Done — ${results.length} service pages.\n`);
  return results;
}

// ── CLI entry ─────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  (async () => {
    const results = [];
    results.push(...await generateAllLandingPages());
    results.push(...await generateAllServicePages());
    results.push(await generateAboutPage(client.city));
    results.push(await generateBlogIndex());
    console.log(`\nTotal: ${results.length} pages generated.`);
  })().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
