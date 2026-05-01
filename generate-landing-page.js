import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";

// ── Slug helpers ──────────────────────────────────────────────────────────────
function lowerSlug(s) {
  return String(s).toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
// City slug for the city's own landing page.
// Champaign keeps capital C and -il suffix per indexed URLs.
function citySlug(city) {
  if (city === "Champaign") return "Champaign-il";
  return lowerSlug(city);
}
// City slug used inside service+city combo URLs (always lowercase).
function cityComboSlug(city) {
  if (city === "Champaign") return "champaign-il";
  return lowerSlug(city);
}
function serviceSlug(s) { return lowerSlug(s); }
function titleCase(s) {
  return String(s).split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function phoneDigits(p) { return String(p).replace(/[^0-9]/g, ""); }
function htmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function initials(name) {
  return String(name).split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const PHONE = client.phone;
const PHONE_TEL = `tel:+1${phoneDigits(PHONE)}`;
const PHONE_SMS = `sms:+1${phoneDigits(PHONE)}`;

// GHL chat widget snippet — uses location ID per docs.
const GHL_CHAT_WIDGET = `<script src="https://widgets.leadconnectorhq.com/loader.js" data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" data-widget-id="CLJQbljlapECB2Aiq27f"></script>`;

// Curated Unsplash fallbacks — used when client.photos.* is empty.
const FALLBACK_HERO = [
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1800&q=80",
  "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=80",
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1800&q=80",
  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1800&q=80",
];
const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=900&q=80",
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=900&q=80",
  "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=900&q=80",
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=900&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
  "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=900&q=80",
  "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=900&q=80",
  "https://images.unsplash.com/photo-1600661653561-629509216228?w=900&q=80",
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=900&q=80",
];
const FALLBACK_VALUE = "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1100&q=80";
const FALLBACK_BIGCTA = "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=1800&q=80";
const FALLBACK_OWNER = "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=900&q=80";

// Auto-discover photos in output/img/ — zero config required.
// Filename prefix decides where they go. Files are matched case-insensitively.
//   hero*.{jpg,webp,png,jpeg}  → hero carousel
//   gallery*.* OR work*.*       → gallery cards
//   value*.*                    → "we come to you" section
//   bigcta*.* OR cta*.*         → wide CTA background
//   owner*.* OR dom*.*          → owner card
//   blog*.*                     → blog post cards
function discoverPhotos() {
  const dir = "output/img";
  if (!existsSync(dir)) return {};
  let files;
  try { files = readdirSync(dir); } catch { return {}; }
  const usable = files
    .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
    .sort((a, b) => a.localeCompare(b));
  const pick = (rx) => usable.filter((f) => rx.test(f)).map((f) => `/img/${f}`);
  return {
    hero: pick(/^hero/i),
    gallery: pick(/^(gallery|work)/i),
    value: pick(/^value/i)[0],
    bigCta: pick(/^(bigcta|cta)/i)[0],
    owner: pick(/^(owner|dom)/i)[0],
    blog: pick(/^blog/i),
  };
}

// Resolved photo set: client.photos.* > auto-discovered files > Unsplash fallback.
const cp = client.photos || {};
const auto = discoverPhotos();
const pickArr = (a, b, c) => (a && a.length) ? a : (b && b.length) ? b : c;
const pickOne = (a, b, c) => a || b || c;
const PHOTO_HERO = pickArr(cp.hero, auto.hero, FALLBACK_HERO);
const PHOTO_GALLERY = pickArr(cp.gallery, auto.gallery, FALLBACK_GALLERY);
const PHOTO_VALUE = pickOne(cp.value, auto.value, FALLBACK_VALUE);
const PHOTO_BIGCTA = pickOne(cp.bigCta, auto.bigCta, FALLBACK_BIGCTA);
const PHOTO_OWNER = pickOne(cp.owner, auto.owner, FALLBACK_OWNER);
// Optional MP4 URL — when set, the homepage hero plays it as a muted autoplay loop.
const PHOTO_HERO_VIDEO = cp.heroVideo || "";

const _photoSummary = [
  PHOTO_HERO !== FALLBACK_HERO ? `hero(${PHOTO_HERO.length})` : null,
  PHOTO_GALLERY !== FALLBACK_GALLERY ? `gallery(${PHOTO_GALLERY.length})` : null,
  PHOTO_VALUE !== FALLBACK_VALUE ? "value" : null,
  PHOTO_BIGCTA !== FALLBACK_BIGCTA ? "bigCta" : null,
  PHOTO_OWNER !== FALLBACK_OWNER ? "owner" : null,
].filter(Boolean);
if (_photoSummary.length > 0) console.log(`  ▸ Custom photos: ${_photoSummary.join(", ")}`);

// ── Fonts + base CSS (shared by every page) ───────────────────────────────────
function fontsLink() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Inter+Tight:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">`;
}

function baseStyles() {
  const primary = client.primaryColor;
  const accent = client.accentColor || "#5cd9db";
  return `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--primary:${primary};--primary-dark:#016567;--primary-deep:#013d3e;--accent:${accent};--ink:#0d1418;--ink-2:#1a2329;--text:#1f2a30;--muted:#6b7680;--line:#e6e9ec;--bg:#fff;--soft:#f6f8f9;--warm:#fffaf2}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{font-family:'Inter Tight',system-ui,-apple-system,sans-serif;font-size:17px;line-height:1.65;color:var(--text);background:var(--bg);-webkit-font-smoothing:antialiased;font-feature-settings:"ss01","cv11"}
img{max-width:100%;display:block}
a{color:var(--primary);text-decoration:none;transition:color .2s}
a:hover{color:var(--primary-dark)}
.container{max-width:1240px;margin:0 auto;padding:0 28px}
h1,h2,h3,h4,h5{font-family:'Bricolage Grotesque',system-ui,sans-serif;font-weight:700;letter-spacing:-.02em;color:var(--ink);line-height:1.08;font-variation-settings:"opsz" 36}
h1{font-size:clamp(2.5rem,5.6vw,4.6rem);font-weight:800;font-variation-settings:"opsz" 96}
h2{font-size:clamp(1.95rem,3.6vw,3rem);margin-bottom:.55em}
h3{font-size:1.4rem;margin-bottom:.5em}
h4{font-size:1.1rem;margin-bottom:.4em}
.eyebrow{font-family:'Inter Tight',sans-serif;font-size:.78rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--primary);margin-bottom:1rem;display:inline-block}
.btn{display:inline-flex;align-items:center;gap:.55em;padding:15px 28px;font-weight:600;font-size:.97rem;border-radius:6px;border:none;cursor:pointer;transition:all .25s ease;letter-spacing:.005em;font-family:'Inter Tight',sans-serif;text-decoration:none}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:hover{background:var(--primary-dark);color:#fff;transform:translateY(-2px);box-shadow:0 14px 28px -10px rgba(2,136,138,.5)}
.btn-outline{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.7)}
.btn-outline:hover{background:#fff;color:var(--ink);border-color:#fff}
.btn-dark{background:var(--ink);color:#fff}
.btn-dark:hover{background:#000;color:#fff;transform:translateY(-2px)}
.btn-light{background:#fff;color:var(--ink);border:1px solid var(--line)}
.btn-light:hover{background:var(--soft);color:var(--ink);border-color:var(--primary)}
.accent-rule{width:50px;height:3px;background:var(--primary);margin-bottom:1.5rem;border-radius:2px}

.topbar{background:var(--ink);color:#cfd6db;font-size:.82rem;padding:9px 0;letter-spacing:.04em}
.topbar-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.topbar a{color:#cfd6db}
.topbar a:hover{color:var(--accent)}

nav.main{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);transition:box-shadow .3s}
nav.main.scrolled{box-shadow:0 8px 30px -12px rgba(0,0,0,.12)}
.nav-row{display:flex;align-items:center;justify-content:space-between;padding:18px 0;gap:24px}
.brand{display:flex;align-items:center;gap:11px;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:1.5rem;color:var(--ink);letter-spacing:-.03em}
.brand-mark{width:42px;height:42px;border-radius:50%;background:var(--primary);display:grid;place-items:center;color:#fff;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:1.15rem;box-shadow:inset 0 -3px 0 rgba(0,0,0,.18);flex-shrink:0}
.brand-mark-img{background:transparent;box-shadow:none;border-radius:0;object-fit:contain;width:auto;height:46px;max-width:160px;padding:0}
.brand small{display:block;font-family:'Inter Tight',sans-serif;font-size:.65rem;font-weight:600;color:var(--muted);letter-spacing:.16em;text-transform:uppercase;margin-top:2px}
.nav-links{display:flex;align-items:center;gap:32px;list-style:none}
.nav-links a{color:var(--ink);font-weight:500;font-size:.96rem;position:relative}
.nav-links a:hover{color:var(--primary)}
.nav-links a.active{color:var(--primary)}
.nav-links a.active::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--primary)}
.nav-cta{display:flex;align-items:center;gap:14px}
.nav-phone{color:var(--ink);font-weight:600;font-size:.95rem}
.nav-phone strong{color:var(--primary)}
.menu-btn{display:none;background:none;border:none;font-size:1.6rem;cursor:pointer;color:var(--ink);padding:6px}

.hero{position:relative;min-height:80vh;display:flex;align-items:center;color:#fff;overflow:hidden;background:#000}
.hero-tall{min-height:92vh}
.hero-slides{position:absolute;inset:0;z-index:0}
.hero-slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.6s ease-in-out}
.hero-slide.active{opacity:1}
.hero-slide::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,rgba(1,61,62,.85) 0%,rgba(13,20,24,.62) 55%,rgba(13,20,24,.4) 100%)}
.hero-static{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0}
.hero-static::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,rgba(1,61,62,.88) 0%,rgba(13,20,24,.65) 55%,rgba(13,20,24,.45) 100%)}
.hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;background:#000}
.hero-video-overlay{position:absolute;inset:0;background:linear-gradient(110deg,rgba(1,61,62,.78) 0%,rgba(13,20,24,.58) 55%,rgba(13,20,24,.4) 100%);z-index:1;pointer-events:none}
.hero-inner{position:relative;z-index:2;padding:120px 0 100px;width:100%}
.hero-tall .hero-inner{padding:140px 0 120px}
.hero h1{color:#fff;max-width:18ch;margin-bottom:.4em}
.hero h1 em{font-style:normal;color:var(--accent);font-family:inherit}
.hero .loc{display:inline-flex;align-items:center;gap:10px;font-size:.92rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;margin-bottom:1.6em;color:rgba(255,255,255,.85)}
.hero .loc::before{content:"";width:34px;height:1px;background:var(--accent)}
.hero .lede{font-size:1.18rem;max-width:54ch;color:rgba(255,255,255,.92);margin-bottom:2.5em;font-weight:300;line-height:1.6}
.hero-ctas{display:flex;gap:14px;flex-wrap:wrap}
.hero-trust{position:absolute;bottom:0;left:0;right:0;background:rgba(255,255,255,.08);backdrop-filter:blur(14px);border-top:1px solid rgba(255,255,255,.14);padding:22px 0;z-index:3}
.hero-trust-row{display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px;font-size:.85rem;color:rgba(255,255,255,.92);letter-spacing:.05em}
.hero-trust-row span{display:flex;align-items:center;gap:9px;font-weight:500}
.hero-trust-row span::before{content:"●";color:var(--accent);font-size:.7rem}
.slide-dots{position:absolute;bottom:96px;right:32px;display:flex;flex-direction:column;gap:8px;z-index:3}
.slide-dots button{width:9px;height:24px;border:none;border-radius:2px;background:rgba(255,255,255,.3);cursor:pointer;transition:all .3s;padding:0}
.slide-dots button.active{background:var(--accent);height:36px}

.intro-strip{padding:90px 0;background:#fff}
.intro-grid{display:grid;grid-template-columns:.7fr 1fr;gap:80px;align-items:center}
.intro-strip h2::after{content:"";display:block;width:60px;height:3px;background:var(--primary);margin-top:.6em;border-radius:2px}
.intro-pillars{display:grid;grid-template-columns:1fr;gap:30px}
.pillar{display:flex;gap:20px;align-items:flex-start}
.pillar-num{font-family:'Bricolage Grotesque',sans-serif;font-size:2rem;font-weight:800;color:var(--primary);line-height:1;min-width:48px;border-right:2px solid var(--line);padding-right:18px;text-align:right;font-variation-settings:"opsz" 96}
.pillar h4{font-family:'Inter Tight',sans-serif;font-weight:700;font-size:1.08rem;margin-bottom:6px;color:var(--ink);letter-spacing:-.005em}
.pillar p{color:var(--muted);font-size:.97rem;line-height:1.55}

.value-section{background:var(--soft);padding:110px 0}
.value-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.value-photo{position:relative;aspect-ratio:4/5;background-size:cover;background-position:center;box-shadow:0 30px 80px -25px rgba(0,0,0,.3);border-radius:4px}
.value-photo::before{content:"";position:absolute;inset:-20px -20px 20px 20px;border:2px solid var(--primary);z-index:-1;border-radius:4px}
.value-text p{color:#444;margin-bottom:1.2em;font-size:1.05rem}
.value-list{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:14px 24px;margin-top:1.8em}
.value-list li{display:flex;align-items:center;gap:11px;font-weight:500;color:var(--ink);font-size:.97rem}
.value-list li::before{content:"";width:8px;height:8px;background:var(--primary);border-radius:50%;flex-shrink:0}
.value-list li a{color:var(--ink);transition:color .2s}
.value-list li a:hover{color:var(--primary)}

.gallery-section{padding:110px 0}
.gallery-head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:50px;flex-wrap:wrap;gap:20px}
.gallery-head p{color:var(--muted);max-width:42ch}
.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.gallery-grid-4{grid-template-columns:repeat(4,1fr)}
.gallery-card{position:relative;aspect-ratio:4/5;overflow:hidden;background:#000;cursor:pointer;border-radius:4px}
.gallery-card img{width:100%;height:100%;object-fit:cover;transition:transform .8s ease}
.gallery-card:hover img{transform:scale(1.06)}
.gallery-card-meta{position:absolute;left:0;right:0;bottom:0;padding:24px 26px;color:#fff;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,0) 100%);z-index:1}
.gallery-card-meta small{display:block;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin-bottom:6px;font-weight:600}
.gallery-card-meta strong{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:1.25rem;display:block}

.services-section{background:var(--ink);color:#fff;padding:120px 0}
.services-section h2{color:#fff}
.services-section .eyebrow{color:var(--accent)}
.services-head{text-align:center;margin-bottom:70px;max-width:760px;margin-left:auto;margin-right:auto}
.services-head p{color:rgba(255,255,255,.72);font-size:1.08rem;line-height:1.65;margin-top:1rem}
.services-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
.services-grid-3{grid-template-columns:repeat(3,1fr)}
.service-card{background:var(--ink);padding:44px 32px 36px;position:relative;transition:background .4s ease;cursor:pointer;display:flex;flex-direction:column;min-height:280px;color:#fff}
.service-card:hover{background:var(--ink-2);color:#fff}
.service-card .num{font-family:'Bricolage Grotesque',sans-serif;font-size:.95rem;color:var(--accent);font-weight:600;margin-bottom:24px;letter-spacing:.05em}
.service-card h3{color:#fff;font-size:1.2rem;margin-bottom:.6em}
.service-card p{color:rgba(255,255,255,.65);font-size:.92rem;line-height:1.55;margin-bottom:1.4em;flex-grow:1}
.service-card .arrow{display:inline-flex;align-items:center;gap:8px;color:var(--accent);font-size:.85rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;transition:gap .3s}
.service-card:hover .arrow{gap:14px}

.reviews-section{padding:120px 0;background:var(--soft)}
.reviews-section.is-white{background:#fff}
.reviews-head{text-align:center;margin-bottom:60px}
.reviews-head .stars{color:#f5b301;font-size:1.2rem;letter-spacing:.15em;margin-bottom:1rem;display:block}
.reviews-head p{color:var(--muted);max-width:46ch;margin:0 auto;font-size:1.04rem}
.reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.reviews-grid-2{grid-template-columns:repeat(2,1fr)}
.review{background:#fff;border:1px solid var(--line);padding:32px 30px 28px;position:relative;transition:all .35s ease;border-radius:8px;box-shadow:0 6px 24px -16px rgba(13,20,24,.18);display:flex;flex-direction:column}
.review:hover{border-color:var(--primary);box-shadow:0 18px 50px -22px rgba(2,136,138,.3);transform:translateY(-3px)}
.review .stars{color:#f5b301;letter-spacing:.1em;font-size:1rem;margin-bottom:16px;line-height:1}
.review p{color:var(--text);font-size:.96rem;line-height:1.6;margin-bottom:22px;flex-grow:1}
.review .who{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:16px;margin-top:auto}
.review .who-name{font-weight:700;color:var(--ink);font-size:.98rem;font-family:'Inter Tight',sans-serif}
.review .verified{display:inline-flex;align-items:center;gap:7px;font-size:.78rem;color:var(--muted);font-weight:500;letter-spacing:.02em}
.review .verified svg{flex-shrink:0;width:14px;height:14px}
.review.is-hidden{display:none}
.reviews-foot{text-align:center;margin-top:50px;padding-top:30px}
.reviews-foot strong{color:var(--ink);font-weight:600}
.reviews-load-more{margin-top:44px;text-align:center}
.reviews-load-more button{background:var(--ink);color:#fff;border:none;padding:15px 32px;font-family:'Inter Tight',sans-serif;font-weight:600;font-size:.97rem;letter-spacing:.02em;border-radius:6px;cursor:pointer;transition:all .25s ease;display:inline-flex;align-items:center;gap:10px}
.reviews-load-more button:hover{background:var(--primary);transform:translateY(-2px);box-shadow:0 14px 28px -10px rgba(2,136,138,.5)}
.reviews-load-more button[disabled]{opacity:.5;cursor:default;transform:none;box-shadow:none}
.reviews-load-more .count{color:var(--muted);font-size:.85rem;margin-top:14px}

.owner-section{background:var(--soft);padding:120px 0}
.owner-grid{display:grid;grid-template-columns:.85fr 1fr;gap:80px;align-items:center;max-width:1100px;margin:0 auto}
.owner-photo{position:relative;aspect-ratio:1;background-size:cover;background-position:center top;background-color:var(--primary-dark);border-radius:4px}
.owner-photo::before{content:"";position:absolute;inset:18px -18px -18px 18px;border:2px solid var(--primary);z-index:-1;border-radius:4px}
.owner-card{position:absolute;left:24px;bottom:-30px;background:#fff;padding:18px 24px;box-shadow:0 18px 40px -18px rgba(0,0,0,.25);border-radius:4px}
.owner-card small{display:block;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);font-weight:700}
.owner-card strong{font-family:'Bricolage Grotesque',sans-serif;font-size:1.2rem;color:var(--ink)}
.owner-text p{color:#444;margin-bottom:1.2em;font-size:1.05rem;line-height:1.7}
.owner-bullets{display:grid;grid-template-columns:1fr 1fr;gap:18px 30px;margin-top:1.8em;list-style:none}
.owner-bullets li{display:flex;gap:12px;align-items:flex-start;font-size:.95rem;font-weight:500;color:var(--ink)}
.owner-bullets li::before{content:"✓";color:var(--primary);font-weight:700;font-size:1.1rem}
.owner-sig{margin-top:2.4em}
.owner-sig em{font-family:'Bricolage Grotesque',sans-serif;font-size:1.45rem;color:var(--ink);font-style:italic;font-weight:600}

.bigcta{position:relative;padding:140px 0;color:#fff;background:#0d1418 url('${PHOTO_BIGCTA}') center/cover;overflow:hidden}
.bigcta::before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(1,61,62,.92) 0%,rgba(13,20,24,.65) 100%)}
.bigcta-inner{position:relative;z-index:2;max-width:680px}
.bigcta h2{color:#fff;margin-bottom:.4em}
.bigcta h2 em{font-style:normal;color:var(--accent);font-family:inherit}
.bigcta p{font-size:1.1rem;color:rgba(255,255,255,.88);margin-bottom:2em;font-weight:300;line-height:1.6}
.bigcta .accent-rule{background:var(--accent);margin-bottom:1.6rem}

.process-section{padding:120px 0;background:#fff}
.process-head{text-align:center;margin-bottom:80px;max-width:680px;margin-left:auto;margin-right:auto}
.process-head p{color:var(--muted);font-size:1.05rem;margin-top:1rem}
.process-list{max-width:780px;margin:0 auto;position:relative}
.process-list::before{content:"";position:absolute;left:36px;top:30px;bottom:30px;width:2px;background:linear-gradient(to bottom,var(--primary) 0%,var(--accent) 100%);opacity:.3}
.process-step{display:grid;grid-template-columns:75px 1fr;gap:32px;padding:34px 0;align-items:flex-start;position:relative}
.process-step:not(:last-child){border-bottom:1px solid var(--line)}
.process-num{width:74px;height:74px;border-radius:50%;background:#fff;border:2px solid var(--primary);color:var(--primary);font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:1.6rem;display:grid;place-items:center;position:relative;z-index:1;transition:all .3s}
.process-step:hover .process-num{background:var(--primary);color:#fff}
.process-step h3{margin-bottom:.4em;font-size:1.4rem}
.process-step p{color:var(--muted);font-size:1rem;line-height:1.65;max-width:55ch}

.area-section{background:var(--ink);color:#fff;padding:120px 0}
.area-section h2{color:#fff}
.area-section .eyebrow{color:var(--accent)}
.area-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:80px;align-items:center}
.area-text p{color:rgba(255,255,255,.72);font-size:1.05rem;line-height:1.7;margin-bottom:1.2em}
.area-text strong{color:#fff;font-weight:600}
.area-cities{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-left:1px solid rgba(255,255,255,.12);border-top:1px solid rgba(255,255,255,.12);border-radius:4px;overflow:hidden}
.area-city{padding:22px 24px;border-right:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12);font-weight:500;color:#fff;font-size:.97rem;display:flex;align-items:center;gap:10px;transition:background .25s}
.area-city:hover{background:rgba(92,217,219,.08);color:var(--accent)}
.area-city.current{background:rgba(92,217,219,.15);color:var(--accent)}
.area-city::before{content:"";width:6px;height:6px;background:var(--accent);border-radius:50%;flex-shrink:0}
.area-callout{margin-top:40px;padding:24px 28px;border-left:3px solid var(--accent);background:rgba(255,255,255,.04);font-size:.96rem;color:rgba(255,255,255,.85);border-radius:0 4px 4px 0}
.area-callout a{color:var(--accent);font-weight:600}

.final-section{padding:120px 0;background:var(--soft);text-align:center}
.final-section h2{font-size:clamp(2.2rem,4.4vw,3.6rem);margin-bottom:.5em;max-width:18ch;margin-left:auto;margin-right:auto}
.final-section h2 em{font-style:normal;color:var(--primary);font-family:inherit}
.final-section p{color:#444;font-size:1.1rem;max-width:48ch;margin:0 auto 2.4em;line-height:1.6}
.final-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.final-phone{margin-top:2.4em;font-family:'Bricolage Grotesque',sans-serif;font-size:2.4rem;color:var(--ink);font-weight:800;font-variation-settings:"opsz" 96}
.final-phone a{color:var(--primary)}
.final-phone small{display:block;font-family:'Inter Tight',sans-serif;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:600;margin-top:6px}

footer{background:var(--ink);color:#9aa3a9;padding:90px 0 40px;font-size:.92rem}
.footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:50px;margin-bottom:60px}
.footer-brand .brand{color:#fff;margin-bottom:20px}
.footer-brand .brand small{color:rgba(255,255,255,.5)}
.footer-brand p{line-height:1.7;color:rgba(255,255,255,.6);margin-bottom:24px}
.footer-social{display:flex;gap:10px}
.footer-social a{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.08);display:grid;place-items:center;color:#fff;transition:all .25s;font-weight:600;font-size:.85rem}
.footer-social a:hover{background:var(--primary);color:#fff;transform:translateY(-2px)}
footer h5{color:#fff;font-family:'Inter Tight',sans-serif;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;font-weight:700;margin-bottom:22px}
footer ul{list-style:none}
footer ul li{margin-bottom:11px}
footer ul a{color:rgba(255,255,255,.62);font-size:.92rem;transition:color .2s}
footer ul a:hover{color:var(--accent)}
.footer-meta{padding-top:32px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;font-size:.82rem;color:rgba(255,255,255,.45);letter-spacing:.04em}
.footer-meta a{color:rgba(255,255,255,.6)}
.footer-meta a:hover{color:var(--accent)}

.mobile-call{display:none;position:fixed;left:0;right:0;bottom:0;z-index:999;background:var(--primary);color:#fff;text-align:center;padding:14px;font-weight:600;font-size:.98rem;box-shadow:0 -8px 20px rgba(0,0,0,.18)}
.mobile-call a{color:#fff}

.page-content{padding:90px 0;background:#fff}
.page-content-grid{display:grid;grid-template-columns:1fr 320px;gap:80px;align-items:start;max-width:1100px;margin:0 auto}
.page-content-body{font-size:1.05rem;line-height:1.78;color:#333}
.page-content-body p{margin-bottom:1.4em}
.page-content-body h2{margin-top:2em;margin-bottom:.6em;font-size:clamp(1.7rem,3vw,2.4rem)}
.page-content-body h2:first-child{margin-top:0}
.page-content-body h3{margin-top:1.6em}
.page-content-body ul,.page-content-body ol{margin:1.4em 0 1.4em 1.4em;line-height:1.8}
.page-content-body li{margin-bottom:.6em}
.page-content-body a{color:var(--primary);font-weight:500;text-decoration:underline;text-decoration-color:rgba(2,136,138,.3);text-underline-offset:3px}
.page-content-body a:hover{text-decoration-color:var(--primary)}
.page-content-body blockquote{border-left:3px solid var(--primary);padding:8px 24px;margin:1.8em 0;color:#444;font-style:italic;background:var(--soft);border-radius:0 4px 4px 0}
.page-content-body table{width:100%;border-collapse:collapse;margin:1.6em 0;font-size:.95rem}
.page-content-body table th,.page-content-body table td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left}
.page-content-body table th{background:var(--soft);font-weight:600;color:var(--ink);font-family:'Inter Tight',sans-serif;letter-spacing:.02em}
.page-content-aside{position:sticky;top:120px;background:var(--soft);padding:32px 28px;border-radius:6px;border:1px solid var(--line)}
.page-content-aside h4{font-family:'Inter Tight',sans-serif;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);margin-bottom:16px;font-weight:700}
.page-content-aside .ph{font-family:'Bricolage Grotesque',sans-serif;font-size:1.6rem;font-weight:800;color:var(--ink);margin-bottom:6px}
.page-content-aside .ph a{color:var(--ink);text-decoration:none}
.page-content-aside .small{font-size:.85rem;color:var(--muted);margin-bottom:18px}
.page-content-aside ul{list-style:none;margin:0;padding:0;margin-bottom:18px}
.page-content-aside ul li{padding:8px 0;border-bottom:1px solid var(--line);font-size:.92rem}
.page-content-aside ul li:last-child{border-bottom:none}
.page-content-aside ul li a{color:var(--ink);font-weight:500}
.page-content-aside ul li a:hover{color:var(--primary)}

.faq-section{padding:100px 0;background:#fff;border-top:1px solid var(--line)}
.faq-head{text-align:center;margin-bottom:50px}
.faq-list{max-width:780px;margin:0 auto}
.faq-item{border-bottom:1px solid var(--line);padding:22px 0}
.faq-item summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;font-family:'Bricolage Grotesque',sans-serif;font-size:1.15rem;font-weight:600;color:var(--ink);padding:8px 0}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary::after{content:"+";font-size:1.6rem;color:var(--primary);font-weight:300;transition:transform .25s}
.faq-item[open] summary::after{transform:rotate(45deg)}
.faq-item .ans{padding-top:14px;color:#444;font-size:1rem;line-height:1.7}

.blog-section{padding:100px 0;background:#fff}
.blog-head{margin-bottom:60px;max-width:780px}
.blog-head p{color:var(--muted);font-size:1.05rem;margin-top:1rem}
.blog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}
.blog-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:6px;overflow:hidden;transition:all .3s ease;text-decoration:none;color:inherit}
.blog-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px -18px rgba(0,0,0,.18);border-color:var(--primary)}
.blog-card-img{aspect-ratio:16/10;background-size:cover;background-position:center;background-color:var(--primary-deep)}
.blog-card-body{padding:26px 26px 30px;flex-grow:1;display:flex;flex-direction:column}
.blog-card .tag{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:var(--primary);margin-bottom:14px}
.blog-card h3{font-size:1.18rem;margin-bottom:.5em;color:var(--ink);line-height:1.25}
.blog-card p{color:var(--muted);font-size:.92rem;line-height:1.55;margin-bottom:18px;flex-grow:1}
.blog-card .more{font-size:.82rem;font-weight:600;color:var(--primary);letter-spacing:.05em;text-transform:uppercase}

/* packages page */
.pkg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:50px}
.pkg-card{background:#fff;border:1px solid var(--line);border-radius:6px;padding:36px 30px;display:flex;flex-direction:column;transition:all .3s ease;position:relative}
.pkg-card:hover{border-color:var(--primary);box-shadow:0 18px 40px -18px rgba(2,136,138,.25);transform:translateY(-4px)}
.pkg-card.featured{border-color:var(--primary);background:linear-gradient(180deg,#fff 0%,rgba(2,136,138,.04) 100%)}
.pkg-card.featured::before{content:"Most Popular";position:absolute;top:-12px;left:30px;background:var(--primary);color:#fff;font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 12px;border-radius:30px}
.pkg-card .name{font-family:'Bricolage Grotesque',sans-serif;font-size:1.5rem;font-weight:800;color:var(--ink);margin-bottom:6px;letter-spacing:-.01em}
.pkg-card .from{font-size:.85rem;color:var(--muted);margin-bottom:18px}
.pkg-card .price{font-family:'Bricolage Grotesque',sans-serif;font-size:2.6rem;font-weight:800;color:var(--primary);line-height:1;margin-bottom:6px}
.pkg-card .price small{font-size:.95rem;color:var(--muted);font-weight:500;margin-left:6px}
.pkg-card .duration{font-size:.85rem;color:var(--muted);margin-bottom:24px;letter-spacing:.04em}
.pkg-card ul{list-style:none;margin:0;padding:0;flex-grow:1;margin-bottom:24px}
.pkg-card ul li{padding:8px 0;border-bottom:1px solid var(--line);font-size:.93rem;color:#333;display:flex;gap:10px;align-items:flex-start}
.pkg-card ul li::before{content:"✓";color:var(--primary);font-weight:700;flex-shrink:0}
.pkg-card .pkg-cta{margin-top:auto}

@media (max-width:980px){
  .nav-links{display:none}
  .menu-btn{display:block}
  .nav-links.open{display:flex;position:absolute;top:100%;left:0;right:0;background:#fff;flex-direction:column;padding:24px;gap:18px;border-top:1px solid var(--line);box-shadow:0 12px 24px -12px rgba(0,0,0,.15)}
  .intro-grid,.value-grid,.owner-grid,.area-grid,.page-content-grid{grid-template-columns:1fr;gap:50px}
  .gallery-grid,.gallery-grid-4,.blog-grid,.pkg-grid{grid-template-columns:1fr 1fr}
  .services-grid{grid-template-columns:1fr 1fr}
  .reviews-grid{grid-template-columns:1fr}
  .area-cities{grid-template-columns:1fr 1fr}
  .footer-grid{grid-template-columns:1fr 1fr;gap:40px}
  .value-list,.owner-bullets{grid-template-columns:1fr}
  .hero-trust{position:relative;background:var(--ink)}
  .hero,.hero-tall{min-height:auto}
  .slide-dots{display:none}
  .mobile-call{display:block}
  body{padding-bottom:60px}
  .intro-strip,.value-section,.gallery-section,.services-section,.reviews-section,.owner-section,.bigcta,.process-section,.area-section,.final-section,.page-content,.faq-section,.blog-section{padding:70px 0}
  .topbar{display:none}
  .nav-phone span{display:none}
  .page-content-aside{position:static;top:auto}
}
@media (max-width:580px){
  .gallery-grid,.gallery-grid-4,.blog-grid,.pkg-grid{grid-template-columns:1fr}
  .services-grid{grid-template-columns:1fr}
  .footer-grid{grid-template-columns:1fr}
  .area-cities{grid-template-columns:1fr 1fr}
  .container{padding:0 22px}
  .hero-inner{padding:90px 0 110px}
  .process-step{grid-template-columns:60px 1fr;gap:20px}
  .process-num{width:58px;height:58px;font-size:1.3rem}
  .process-list::before{left:28px}
}`;
}

// ── Page head ─────────────────────────────────────────────────────────────────
function pageHead(opts) {
  const { title, description, canonical, ogImage = PHOTO_HERO[0], extraJsonLd = "", extraStyles = "" } = opts;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${htmlEscape(title)}</title>
<meta name="description" content="${htmlEscape(description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${htmlEscape(title)}">
<meta property="og:description" content="${htmlEscape(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:site_name" content="${htmlEscape(client.businessName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${client.primaryColor}">
${client.favicon ? `<link rel="icon" href="${client.favicon}" type="image/png">` : ""}
${fontsLink()}
<style>${baseStyles()}${extraStyles}</style>
${jsonLdBusiness()}
${extraJsonLd}
</head>`;
}

function jsonLdBusiness() {
  return `<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"AutoDetailing",
  "name":${JSON.stringify(client.businessName)},
  "image":${JSON.stringify(PHOTO_HERO[0])},
  "url":${JSON.stringify(client.domain + "/")},
  "telephone":"+1${phoneDigits(client.phone)}",
  "email":${JSON.stringify(client.email || "")},
  "priceRange":"$$",
  "address":{"@type":"PostalAddress","addressLocality":${JSON.stringify(client.city)},"addressRegion":${JSON.stringify(client.state)},"postalCode":${JSON.stringify(client.zip || "")},"addressCountry":"US"},
  "areaServed":${JSON.stringify(client.cities)},
  "openingHours":"Mo-Sa 08:00-20:00, Su 13:00-20:00",
  "aggregateRating":{"@type":"AggregateRating","ratingValue":"5.0","reviewCount":${JSON.stringify(String(client.reviewCount))}},
  "sameAs":${JSON.stringify([client.facebook, client.instagram, client.google, client.yelp].filter(Boolean))}
}
</script>`;
}

function jsonLdFaq(faqs) {
  if (!faqs || faqs.length === 0) return "";
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

// ── Components ────────────────────────────────────────────────────────────────
function topbar() {
  return `<div class="topbar">
  <div class="container topbar-row">
    <span>★ ★ ★ ★ ★ &nbsp;Rated 5.0 across ${client.reviewCount}+ Google reviews</span>
    <span>${client.hours || "Mon–Sat 8a–8p · Sun 1p–8p"} &nbsp;|&nbsp; <a href="${PHONE_TEL}"><strong>${PHONE}</strong></a></span>
  </div>
</div>`;
}

function brandMark() {
  if (client.logo) {
    return `<img src="${client.logo}" alt="${htmlEscape(client.businessName)} logo" class="brand-mark brand-mark-img" loading="eager" width="115" height="46">`;
  }
  return `<span class="brand-mark">${(client.businessName.match(/[A-Z]/) || ["G"])[0]}</span>`;
}

function navbar(currentPath) {
  const link = (href, label) => {
    const active = href === currentPath ? " active" : "";
    return `<li><a href="${href}" class="${active.trim()}">${label}</a></li>`;
  };
  return `<nav class="main" id="nav">
  <div class="container nav-row">
    <a href="/" class="brand">
      ${brandMark()}
      <span>${htmlEscape(client.businessName.replace(/\s+Auto\s+Detailing/i, ""))}<small>${htmlEscape(client.niche)} · ${htmlEscape(client.city)}, ${htmlEscape(client.state)}</small></span>
    </a>
    <ul class="nav-links" id="navLinks">
      ${link("/", "Home")}
      ${link("/packages", "Packages")}
      ${link("/about-us", "About")}
      ${link("/service-area", "Service Area")}
      ${link("/blog", "Blog")}
      ${link("/contact", "Contact")}
    </ul>
    <div class="nav-cta">
      <span class="nav-phone"><span>Call &nbsp;</span><strong>${PHONE}</strong></span>
      <a href="/book-an-appointment-1696" class="btn btn-primary" style="padding:12px 22px;font-size:.9rem">Book Now</a>
      <button class="menu-btn" id="menuBtn" aria-label="menu">☰</button>
    </div>
  </div>
</nav>`;
}

function heroSection(opts) {
  const {
    eyebrow, headline, lede, ctaPrimary, ctaSecondary, slides = PHOTO_HERO, showSlides = true,
    trust = ["Mobile — We Come To You", `${client.reviewCount}+ Five-Star Reviews`, "Licensed & Insured", "Same-Day Available"],
    tall = false,
  } = opts;
  const cta1 = ctaPrimary || { label: "Book a Detail →", href: "/book-an-appointment-1696" };
  const cta2 = ctaSecondary || { label: "Read Reviews", href: "/reviews" };
  const video = opts.video || "";
  const slidesHtml = video
    ? `<video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="${slides[0] || ""}"><source src="${video}" type="video/mp4"></video><div class="hero-video-overlay"></div>`
    : showSlides
    ? `<div class="hero-slides" id="slides">
${slides.map((u, i) => `      <div class="hero-slide${i === 0 ? " active" : ""}" style="background-image:url('${u}')"></div>`).join("\n")}
    </div>
    <div class="slide-dots" id="dots">
${slides.map((_, i) => `      <button${i === 0 ? ' class="active"' : ""} data-i="${i}" aria-label="slide ${i + 1}"></button>`).join("\n")}
    </div>`
    : `<div class="hero-static" style="background-image:url('${slides[0]}')"></div>`;
  return `<header class="hero${tall ? " hero-tall" : ""}" id="top">
  ${slidesHtml}
  <div class="container hero-inner">
    <div class="loc">${eyebrow}</div>
    <h1>${headline}</h1>
    <p class="lede">${lede}</p>
    <div class="hero-ctas">
      <a href="${cta1.href}" class="btn btn-primary">${cta1.label}</a>
      <a href="${cta2.href}" class="btn btn-outline">${cta2.label}</a>
    </div>
  </div>
  <div class="hero-trust">
    <div class="container hero-trust-row">
${trust.map((t) => `      <span>${htmlEscape(t)}</span>`).join("\n")}
    </div>
  </div>
</header>`;
}

function introPillars(opts) {
  const { city = client.city } = opts || {};
  return `<section class="intro-strip">
  <div class="container intro-grid">
    <div>
      <span class="eyebrow">${htmlEscape(city)} ${client.niche} Pros</span>
      <h2>Showroom finish. Right in your driveway.</h2>
    </div>
    <div class="intro-pillars">
      <div class="pillar"><div class="pillar-num">01</div><div>
        <h4>5+ Years Detailing Experience</h4>
        <p>Hundreds of vehicles detailed across central Illinois — daily drivers to high-end builds.</p>
      </div></div>
      <div class="pillar"><div class="pillar-num">02</div><div>
        <h4>Free, Honest Quotes</h4>
        <p>Send a few photos and we'll give you an exact quote in minutes — no upsells, no surprises.</p>
      </div></div>
      <div class="pillar"><div class="pillar-num">03</div><div>
        <h4>Owner On Every Detail</h4>
        <p>${htmlEscape(client.ownerName.split(" ")[0])} personally handles every ${htmlEscape(city)} appointment. No subcontractors, no swapped crews.</p>
      </div></div>
    </div>
  </div>
</section>`;
}

function valueProp(opts) {
  const { city = client.city, services = client.services.slice(0, 8) } = opts || {};
  return `<section class="value-section">
  <div class="container value-grid">
    <div class="value-photo" style="background-image:url('${PHOTO_VALUE}')"></div>
    <div class="value-text">
      <span class="eyebrow">No subcontractors. Ever.</span>
      <h2>We come to you. <em style="color:var(--primary);font-style:normal">Always.</em></h2>
      <div class="accent-rule"></div>
      <p>${htmlEscape(client.businessName)} is mobile-only. We arrive at your home, your office, or wherever your car lives in ${htmlEscape(city)} with everything we need — water, power, premium products, and the same person who picked up the phone.</p>
      <p>That means no awkward drop-offs, no shuttle rides, no waiting in a lobby. You hand off the keys, we transform the car, and you drive off in something that looks better than the day you bought it.</p>
      <ul class="value-list">
${services.map((s) => `        <li><a href="/${SERVICE_ALIASES[s.toLowerCase()] || serviceSlug(s)}">${titleCase(s)}</a></li>`).join("\n")}
      </ul>
    </div>
  </div>
</section>`;
}

function gallerySection(opts) {
  const { city = client.city, count = 3 } = opts || {};
  const items = [
    { tag: `Exterior · ${city}`, title: "Full Foam Wash & Decon", img: PHOTO_GALLERY[0] },
    { tag: `Interior · ${city}`, title: "Leather & Carpet Reset", img: PHOTO_GALLERY[1] },
    { tag: `Coating · ${city}`, title: "9H Ceramic Application", img: PHOTO_GALLERY[2] },
    { tag: `PPF · ${city}`, title: "Front-End Paint Protection", img: PHOTO_GALLERY[3] },
    { tag: `Tint · ${city}`, title: "Ceramic IR Window Tint", img: PHOTO_GALLERY[4] },
    { tag: `Engine · ${city}`, title: "Show-Quality Engine Bay", img: PHOTO_GALLERY[5] },
    { tag: `Headlights · ${city}`, title: "Headlight Restoration", img: PHOTO_GALLERY[6] },
    { tag: `Exterior · ${city}`, title: "Paint Correction + Polish", img: PHOTO_GALLERY[7] },
  ].slice(0, count);
  const cls = count > 3 ? " gallery-grid-4" : "";
  return `<section class="gallery-section">
  <div class="container">
    <div class="gallery-head">
      <div>
        <span class="eyebrow">Recent Work</span>
        <h2>Selected details, across central Illinois.</h2>
      </div>
      <p>A small slice of the cars, trucks, and SUVs we've brought back to life across ${client.cities.slice(0, 4).join(", ")} and beyond.</p>
    </div>
    <div class="gallery-grid${cls}">
${items.map((it) => `      <div class="gallery-card">
        <img src="${it.img}" alt="${htmlEscape(it.title)} in ${htmlEscape(city)}" loading="lazy">
        <div class="gallery-card-meta"><small>${htmlEscape(it.tag)}</small><strong>${htmlEscape(it.title)}</strong></div>
      </div>`).join("\n")}
    </div>
  </div>
</section>`;
}

const SERVICE_DESCRIPTIONS = {
  "mobile detailing": "Our flagship service. We bring the entire detail bay to your driveway — water, power, and pro-grade products included.",
  "interior detailing": "Deep vacuum, steam, shampoo, leather conditioning, and odor neutralization. Perfect for pet owners and family cars.",
  "exterior detailing": "Foam bath, iron decontamination, clay, sealant, and tire dressing. Salt-belt safe and perfect for Illinois winters.",
  "full service detailing": "Inside and out. The complete reset. Ideal before a sale, after a road trip, or when the car just needs to feel new again.",
  "ceramic coating": "Long-lasting hydrophobic protection — up to 5 years. Glossier paint, easier washes, real defense against UV and contaminants.",
  "paint correction": "Multi-stage machine polishing to remove swirls, scratches, and oxidation. The mirror finish behind every great coating job.",
  "headlight restoration": "Cloudy, yellow lenses sanded, polished, and sealed clear. Safer night driving — and your car looks years younger.",
  "engine detailing": "Safe degrease, dress, and polish. Show-quality bay without risking sensors or electronics — done right at your home.",
  "paint protection film": "Self-healing PPF on high-impact areas. Stops rock chips, road salt, and chemical etching before they ever reach the paint.",
  "window tinting": "Premium ceramic tint that blocks heat and UV without changing the look. Lifetime-warranty films, professional install.",
  "car wraps": "Color change, accent wraps, and protective vinyl. High-quality films installed by hand for a clean, factory-look finish.",
  "motorcycle detailing": "Bike-specific safe wash, polish, and ceramic coatings. Chrome, leather, and matte-finish work — done right.",
  "fleet detailing": "On-site detailing for sales lots, rental fleets, and company vehicles. Volume pricing, scheduled cleans.",
  "dealership detailing": "Lot-ready vehicle prep, pre-delivery inspection details, and trade-in reconditioning for area dealers.",
  "rental car detailing": "Quick-turn interior and exterior resets for rental fleets. Smoke, pet, and stain remediation.",
  "body shop detailing": "Final-stage post-paint detail to remove buffer trails, overspray, and prep the car for handoff to the customer.",
};

// Service alias map: client.services value → URL slug used on /service alias pages
const SERVICE_ALIASES = {
  "mobile detailing": "mobile-detailing",
  "interior detailing": "interior",
  "exterior detailing": "exterior",
  "full service detailing": "full-service",
  "ceramic coating": "ceramic",
  "paint correction": "paint-correction",
  "headlight restoration": "headlight",
  "engine detailing": "engine",
  "paint protection film": "ppf",
  "window tinting": "window-tint",
  "car wraps": "car-wraps",
  "motorcycle detailing": "motorcycle-detailing",
  "fleet detailing": "fleet-detailing",
  "dealership detailing": "dealership-detailing",
  "rental car detailing": "rental-car-detailing",
  "body shop detailing": "body-shop-detailing",
};

function servicesGrid(opts) {
  const { city = null, count = 8, services = client.services } = opts || {};
  const list = services.slice(0, count);
  return `<section class="services-section" id="services">
  <div class="container">
    <div class="services-head">
      <span class="eyebrow">What We Do</span>
      <h2>Premium ${client.niche.toLowerCase()} services${city ? ` in ${htmlEscape(city)}` : ""}.</h2>
      <p>Every ${htmlEscape(client.businessName.split(" ")[1] || "Gloss")} service is performed at your location with professional-grade equipment and products. Pick what you need — or let us recommend the right package.</p>
    </div>
    <div class="services-grid">
${list.map((s, i) => {
  const desc = SERVICE_DESCRIPTIONS[s.toLowerCase()] || `Professional ${s} done right at your home or office${city ? ` in ${city}` : ""}.`;
  const href = "/" + (SERVICE_ALIASES[s.toLowerCase()] || serviceSlug(s));
  return `      <a href="${href}" class="service-card">
        <span class="num">${String(i + 1).padStart(2, "0")} / ${titleCase(s.split(" ")[0])}</span>
        <h3>${titleCase(s)}</h3>
        <p>${htmlEscape(desc)}</p>
        <span class="arrow">Learn More →</span>
      </a>`;
}).join("\n")}
    </div>
  </div>
</section>`;
}

// Google "G" icon SVG — multi-color, used in the "Verified Google Review" badge.
const GOOGLE_G_SVG = `<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.46-.8 5.95-2.18l-2.9-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.97v2.32A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.04l3-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.96l3 2.32C4.68 5.16 6.66 3.58 9 3.58z"/></svg>`;

function reviewCard(r) {
  return `      <div class="review">
        <div class="stars">${"★".repeat(r.rating || 5)}</div>
        <p>${htmlEscape(r.text)}</p>
        <div class="who">
          <div class="who-name">${htmlEscape(r.name)}</div>
          <span class="verified">${GOOGLE_G_SVG} Verified Google Review</span>
        </div>
      </div>`;
}

function reviewsSection(opts) {
  const { city = null, max = 3, twoCol = false, expandable = false, batch = 6, whiteBg = false } = opts || {};
  let reviews = (client.reviews || []).filter((r) => r.text && r.text.trim().length > 0);
  if (city) {
    const matching = reviews.filter((r) => r.city === city);
    if (matching.length >= (expandable ? batch : max)) reviews = matching;
  }
  if (reviews.length === 0) return "";

  const sectionCls = whiteBg ? " is-white" : "";

  // Compact mode (service pages, blog, etc.) — fixed slice, no load more.
  if (!expandable) {
    const sliced = reviews.slice(0, max);
    const cls = twoCol ? " reviews-grid-2" : "";
    return `<section class="reviews-section${sectionCls}" id="reviews">
  <div class="container">
    <div class="reviews-head">
      <span class="stars">★ ★ ★ ★ ★</span>
      <span class="eyebrow">What Our Customers Say</span>
      <h2>${client.reviewCount}+ five-star reviews on Google.</h2>
      <p>Every review below is verified on Google. We don't pay for promotion — we just show up and get it right.</p>
    </div>
    <div class="reviews-grid${cls}">
${sliced.map(reviewCard).join("\n")}
    </div>
    <div class="reviews-foot"><strong>Rated 5.0 across ${client.reviewCount}+ Google reviews.</strong> &nbsp;${client.google ? `<a href="${client.google}">See them all on Google →</a>` : ""}</div>
  </div>
</section>`;
  }

  // Expandable mode (homepage + /reviews page) — 6 default + Load More batches of 6.
  const initialVisible = batch;
  const total = reviews.length;
  return `<section class="reviews-section${sectionCls}" id="reviews">
  <div class="container">
    <div class="reviews-head">
      <span class="stars">★ ★ ★ ★ ★</span>
      <span class="eyebrow">What Our Customers Say</span>
      <h2>${client.reviewCount}+ five-star reviews on Google.</h2>
      <p>Every review below is from a real, verified Google review. Rated 5.0 across our entire history.</p>
    </div>
    <div class="reviews-grid" id="reviewsGrid" data-batch="${batch}" data-total="${total}" data-shown="${initialVisible}">
${reviews.map((r, i) => `      <div class="review${i >= initialVisible ? " is-hidden" : ""}" data-idx="${i}">
        <div class="stars">${"★".repeat(r.rating || 5)}</div>
        <p>${htmlEscape(r.text)}</p>
        <div class="who">
          <div class="who-name">${htmlEscape(r.name)}</div>
          <span class="verified">${GOOGLE_G_SVG} Verified Google Review</span>
        </div>
      </div>`).join("\n")}
    </div>
    ${total > initialVisible ? `<div class="reviews-load-more">
      <button id="loadMoreReviews" type="button">Load More Reviews</button>
      <div class="count" id="reviewCount">Showing ${initialVisible} of ${total}</div>
    </div>` : ""}
    <div class="reviews-foot" style="margin-top:50px"><strong>Rated 5.0 across ${client.reviewCount}+ Google reviews.</strong> &nbsp;${client.google ? `<a href="${client.google}">See them all on Google →</a>` : ""}</div>
  </div>
</section>
<script>
(function(){
  const btn=document.getElementById('loadMoreReviews');
  if(!btn)return;
  const grid=document.getElementById('reviewsGrid');
  const counter=document.getElementById('reviewCount');
  const batch=parseInt(grid.dataset.batch,10);
  const total=parseInt(grid.dataset.total,10);
  btn.addEventListener('click',()=>{
    const cards=grid.querySelectorAll('.review.is-hidden');
    let revealed=0;
    for(const c of cards){if(revealed>=batch)break;c.classList.remove('is-hidden');revealed++;}
    const shown=grid.querySelectorAll('.review:not(.is-hidden)').length;
    grid.dataset.shown=shown;
    if(counter)counter.textContent='Showing '+shown+' of '+total;
    if(shown>=total){btn.textContent='All Reviews Loaded';btn.disabled=true;}
  });
})();
</script>`;
}

function ownerSection(opts) {
  const { city = client.city } = opts || {};
  const firstName = client.ownerName.split(" ")[0];
  return `<section class="owner-section" id="owner">
  <div class="container owner-grid">
    <div class="owner-photo" style="background-image:url('${PHOTO_OWNER}')">
      <div class="owner-card">
        <small>Owner / Operator</small>
        <strong>${htmlEscape(client.ownerName)}</strong>
      </div>
    </div>
    <div class="owner-text">
      <span class="eyebrow">Meet The Owner</span>
      <h2>${htmlEscape(client.ownerName)}</h2>
      <div class="accent-rule"></div>
      <p>${htmlEscape(client.businessName)} is brother-run and built around one rule: the person who books the job is the person doing the work. When you call ${htmlEscape(PHONE)}, that's ${htmlEscape(firstName)}. When the van pulls into your driveway in ${htmlEscape(city)}, that's ${htmlEscape(firstName)}. When you walk back out and see the car, that's still ${htmlEscape(firstName)} — looking just as proud as you are.</p>
      <p>That obsession is why we have ${client.reviewCount}+ five-star reviews and almost zero turnover in repeat customers. We treat every car in ${htmlEscape(city)} like it's our own.</p>
      <ul class="owner-bullets">
        <li>Owner-operated, every job</li>
        <li>Licensed &amp; fully insured</li>
        <li>Trained on ceramic &amp; correction</li>
        <li>Free quote by phone or text</li>
      </ul>
      <div class="owner-sig"><em>— ${htmlEscape(firstName)} &amp; the ${htmlEscape(client.businessName.split(" ")[1] || "Gloss Spot")} crew</em></div>
    </div>
  </div>
</section>`;
}

function bigCtaSection(opts) {
  const { city = client.city } = opts || {};
  return `<section class="bigcta">
  <div class="container bigcta-inner">
    <span class="eyebrow" style="color:var(--accent)">Bad Mess? Bring It On.</span>
    <h2>Got a disaster of a car? <em>We've seen worse.</em></h2>
    <div class="accent-rule"></div>
    <p>Pet hair, kids, road salt, fast-food spills, festival mud — there isn't much we haven't pulled out of a ${htmlEscape(city)} car. Send us a few photos for a free quote, and we'll tell you straight whether it's a refresh, a reset, or a full restoration.</p>
    <a href="/book-an-appointment-1696" class="btn btn-primary">Book a Free Quote →</a>
  </div>
</section>`;
}

function processSection(opts) {
  const { city = client.city } = opts || {};
  const steps = [
    { h: "Book", p: "Call, text, or fill out the contact form. Send a couple photos of the car if you can — exterior shot, interior shot, anything weird. We'll quote you fast." },
    { h: "We Come To You", p: `Pick a time and place anywhere in ${city}. Driveway, work parking lot, apartment garage — we bring power and water, so we just need a spot.` },
    { h: "We Detail", p: "Premium products, clean towels, careful work. Pet hair removal, deep extraction, decon wash, polish, coating — whatever you booked, done right." },
    { h: "You Drive Off", p: `We do a final walkaround with you. Pay easy by card, Apple Pay, Venmo, or cash. Most customers in ${city} book again within 90 days.` },
  ];
  return `<section class="process-section">
  <div class="container">
    <div class="process-head">
      <span class="eyebrow">How It Works</span>
      <h2>Four steps from first call to clean car.</h2>
      <p>Booking ${htmlEscape(client.businessName)} in ${htmlEscape(city)} is easy on purpose. Here's the whole flow.</p>
    </div>
    <div class="process-list">
${steps.map((s, i) => `      <div class="process-step">
        <div class="process-num">${i + 1}</div>
        <div><h3>${s.h}</h3><p>${htmlEscape(s.p)}</p></div>
      </div>`).join("\n")}
    </div>
  </div>
</section>`;
}

function serviceAreaSection(opts) {
  const { current = client.city } = opts || {};
  const cities = client.cities;
  return `<section class="area-section" id="area">
  <div class="container area-grid">
    <div class="area-text">
      <span class="eyebrow">Where We Work</span>
      <h2>Mobile across ${htmlEscape(client.city)}-Urbana &amp; central Illinois.</h2>
      <p>Based in <strong>${htmlEscape(client.city)}, ${htmlEscape(client.state)}</strong>, ${htmlEscape(client.businessName)} serves the entire ${htmlEscape(client.city)} metro plus surrounding counties. If your zip code is in this list, we'll come to you.</p>
      <p>Outside the area? Call us — we travel for ceramic coating jobs and fleet work.</p>
      <div class="area-callout">
        Not sure if you're in our service area? <a href="${PHONE_TEL}">Just call ${htmlEscape(PHONE)}</a> — we'll tell you straight.
      </div>
    </div>
    <div class="area-cities">
${cities.map((c) => `      <a href="/${citySlug(c)}" class="area-city${c === current ? " current" : ""}">${htmlEscape(c)}</a>`).join("\n")}
    </div>
  </div>
</section>`;
}

function finalCtaSection(opts) {
  const { city = client.city } = opts || {};
  return `<section class="final-section" id="contact">
  <div class="container">
    <span class="eyebrow">Get Started</span>
    <h2>Get your <em>free</em> detailing quote.</h2>
    <p>Five-minute booking by phone or text. Honest read on your car, real pricing, no surprises. Same-day appointments available across ${htmlEscape(city)}.</p>
    <div class="final-ctas">
      <a href="/book-an-appointment-1696" class="btn btn-primary">Book Online →</a>
      <a href="${PHONE_TEL}" class="btn btn-dark">Call ${htmlEscape(PHONE)}</a>
    </div>
    <div class="final-phone">
      <a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a>
      <small>${htmlEscape(client.hours || "Mon–Sat 8a–8p · Sun 1p–8p")}</small>
    </div>
  </div>
</section>`;
}

function footerSection() {
  const social = [
    client.facebook && { href: client.facebook, label: "f" },
    client.instagram && { href: client.instagram, label: "IG" },
    client.google && { href: client.google, label: "G" },
    client.yelp && { href: client.yelp, label: "Y" },
  ].filter(Boolean);
  const services = [
    { href: "/interior", label: "Interior Detailing" },
    { href: "/exterior", label: "Exterior Detailing" },
    { href: "/full-service", label: "Full Service" },
    { href: "/mobile-detailing", label: "Mobile Detailing" },
    { href: "/ceramic", label: "Ceramic Coating" },
    { href: "/paint-correction", label: "Paint Correction" },
    { href: "/window-tint", label: "Window Tinting" },
    { href: "/ppf", label: "Paint Protection" },
  ];
  const cities = client.cities.slice(0, 8);
  return `<footer>
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="brand">
          ${brandMark()}
          <span>${htmlEscape(client.businessName.replace(/\s+Auto\s+Detailing/i, ""))}<small>${htmlEscape(client.niche)}</small></span>
        </div>
        <p>${htmlEscape(client.footerTagline || `Premium mobile detailing across ${client.city}.`)} Owner-operated by ${htmlEscape(client.ownerName)} and the ${htmlEscape(client.businessName.split(" ")[1] || "Gloss Spot")} crew.</p>
        <div class="footer-social">
${social.map((s) => `          <a href="${s.href}" aria-label="${s.label}">${s.label}</a>`).join("\n")}
        </div>
      </div>
      <div>
        <h5>Services</h5>
        <ul>
${services.map((s) => `          <li><a href="${s.href}">${htmlEscape(s.label)}</a></li>`).join("\n")}
        </ul>
      </div>
      <div>
        <h5>Service Area</h5>
        <ul>
${cities.map((c) => `          <li><a href="/${citySlug(c)}">${htmlEscape(c)}</a></li>`).join("\n")}
        </ul>
      </div>
      <div>
        <h5>Contact</h5>
        <ul>
          <li><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></li>
          <li><a href="mailto:${htmlEscape(client.email || "")}">${htmlEscape(client.email || "")}</a></li>
          <li>${htmlEscape(client.address || `${client.city}, ${client.state}`)}</li>
          <li>${htmlEscape(client.hours || "Mon–Sat 8a–8p")}</li>
          <li style="margin-top:14px;color:#fff;font-weight:600">Owner: ${htmlEscape(client.ownerName)}</li>
          <li><a href="/about-us">About</a> · <a href="/faq">FAQ</a> · <a href="/blog">Blog</a></li>
          <li><a href="/privacy-policy">Privacy</a> · <a href="/terms-and-conditions">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-meta">
      <span>© <span id="yr"></span> ${htmlEscape(client.businessName)} · ${htmlEscape(client.city)}, ${htmlEscape(client.state)} · Licensed &amp; Insured</span>
      <span><a href="/book-an-appointment-1696">Book Now</a> · <a href="/cost-calculator">Cost Calculator</a> · <a href="/gallery">Gallery</a></span>
    </div>
  </div>
</footer>
<a href="${PHONE_TEL}" class="mobile-call">📞 Call ${htmlEscape(PHONE)} — Free Quote</a>
<script>
  const nav=document.getElementById('nav');
  if(nav){window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>8)});}
  const mb=document.getElementById('menuBtn');
  const nl=document.getElementById('navLinks');
  if(mb&&nl){mb.addEventListener('click',()=>nl.classList.toggle('open'));nl.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nl.classList.remove('open')));}
  const slides=document.querySelectorAll('.hero-slide');
  const dots=document.querySelectorAll('#dots button');
  if(slides.length>1){let idx=0;function show(i){slides.forEach((s,n)=>s.classList.toggle('active',n===i));dots.forEach((d,n)=>d.classList.toggle('active',n===i));idx=i}dots.forEach(d=>d.addEventListener('click',()=>show(parseInt(d.dataset.i,10))));setInterval(()=>show((idx+1)%slides.length),6000);}
  const yr=document.getElementById('yr');if(yr)yr.textContent=new Date().getFullYear();
</script>
${GHL_CHAT_WIDGET}
</body>
</html>`;
}

function faqSection(faqs) {
  if (!faqs || faqs.length === 0) return "";
  return `<section class="faq-section">
  <div class="container">
    <div class="faq-head">
      <span class="eyebrow">FAQ</span>
      <h2>Common questions, answered.</h2>
    </div>
    <div class="faq-list">
${faqs.map((f, i) => `      <details class="faq-item"${i === 0 ? " open" : ""}>
        <summary>${htmlEscape(f.q)}</summary>
        <div class="ans">${htmlEscape(f.a)}</div>
      </details>`).join("\n")}
    </div>
  </div>
</section>`;
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
function buildPage(opts) {
  const { head, currentPath, body } = opts;
  return `${head}
<body>
${topbar()}
${navbar(currentPath)}
${body}
${footerSection()}`;
}

function ensureOutputDirs() {
  const out = "output";
  const blog = join(out, "blog");
  if (!existsSync(out)) mkdirSync(out, { recursive: true });
  if (!existsSync(blog)) mkdirSync(blog, { recursive: true });
}

function writeHtml(filename, html) {
  ensureOutputDirs();
  const parts = filename.split("/");
  const fp = join("output", ...parts);
  if (parts.length > 1) {
    const dir = join("output", ...parts.slice(0, -1));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  writeFileSync(fp, html, "utf8");
}

// ═════════════════════════════════════════════════════════════════════════════
// Common FAQ sets
// ═════════════════════════════════════════════════════════════════════════════
function homeFaqs(city = client.city) {
  return [
    { q: `Do you really come to my house in ${city}?`, a: `Yes. ${client.businessName} is a 100% mobile detailing service in ${city}, ${client.state}. We bring water, power, and all equipment to your driveway, workplace, or anywhere in ${city} and the surrounding area.` },
    { q: `How long does a full detail take in ${city}?`, a: `Most full-service details in ${city} take 3 to 5 hours depending on the size and condition of the vehicle. Interior-only and exterior-only details run shorter.` },
    { q: `What does a full detail cost in ${city}?`, a: `Pricing in ${city} starts at $150 for an interior or exterior detail and goes up based on vehicle size and condition. Ceramic coatings are quoted separately. Free quotes by phone or text.` },
    { q: `Are you licensed and insured in ${client.state}?`, a: `Yes — ${client.businessName} is licensed and fully insured in ${client.state}, serving ${city} and the surrounding cities.` },
    { q: `Can you get pet hair and stains out of my car in ${city}?`, a: `Pet hair, food stains, salt, and odor are our specialty. We bring professional extractors to every ${city} appointment and our reviews are full of customers who couldn't believe the result.` },
  ];
}

function serviceFaqs(service, city = client.city) {
  const lower = service.toLowerCase();
  return [
    { q: `How much does ${lower} cost in ${city}?`, a: `Pricing for ${lower} in ${city} depends on the size and condition of the vehicle. Most ${lower} packages start around $150 and we'll send you an exact written quote before any work starts.` },
    { q: `How long does ${lower} take in ${city}?`, a: `Most ${lower} appointments in ${city} take 2 to 5 hours depending on the package and the condition of the car. We give you a realistic time estimate when we quote.` },
    { q: `Do you bring water and power for ${lower} in ${city}?`, a: `Yes. ${client.businessName} brings everything needed for ${lower} in ${city} — water tank, generator if needed, vacuum, polishers, and all products. You just need a parking spot.` },
    { q: `Can I get same-day ${lower} in ${city}?`, a: `Often, yes. Same-day ${lower} appointments in ${city} are common, especially in the morning. Call or text us at ${PHONE} to check today's availability.` },
    { q: `Are you insured for ${lower} work in ${city}?`, a: `Yes — ${client.businessName} carries full general liability insurance for all ${lower} and detailing work performed in ${city} and across ${client.state}.` },
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ═════════════════════════════════════════════════════════════════════════════
export async function generateHomePage() {
  const city = client.city;
  const headline = `${client.niche} in <em>${htmlEscape(city)},</em> ${htmlEscape(client.state)}`;
  const description = `Premium ${client.nicheKeyword} in ${city}, ${client.state}. ${client.businessName} brings showroom results to your driveway — interior, exterior, ceramic coating. Call ${PHONE}.`;
  const head = pageHead({
    title: `${client.niche} in ${city}, ${client.state} | ${client.businessName}`,
    description, canonical: `${client.domain}/`, extraJsonLd: jsonLdFaq(homeFaqs(city)),
  });
  const body = `${heroSection({
    eyebrow: `${city} County · ${client.state}`,
    headline,
    lede: `Premium interior, exterior, and ceramic coating service brought directly to your driveway. Owner-operated, fully insured, and trusted by ${client.reviewCount}+ five-star reviewers across ${city}.`,
    showSlides: true, tall: true, video: PHOTO_HERO_VIDEO,
  })}
${introPillars({ city })}
${valueProp({ city })}
${gallerySection({ city, count: 3 })}
${servicesGrid({ city, count: 8 })}
${reviewsSection({ expandable: true, batch: 6 })}
${ownerSection({ city })}
${bigCtaSection({ city })}
${processSection({ city })}
${serviceAreaSection({ current: city })}
${faqSection(homeFaqs(city))}
${finalCtaSection({ city })}`;
  writeHtml("index.html", buildPage({ head, currentPath: "/", body }));
  console.log(`  ✓ home → output/index.html`);
  return [{ file: "index.html" }];
}

// ═════════════════════════════════════════════════════════════════════════════
// CITY LANDING PAGES
// ═════════════════════════════════════════════════════════════════════════════
function buildCityLanding(city, isPrimary) {
  const cs = citySlug(city);
  const filename = `${cs}.html`;
  const headline = `${client.niche} in <em>${htmlEscape(city)},</em> ${htmlEscape(client.state)}`;
  const description = `Mobile ${client.nicheKeyword} in ${city}, ${client.state}. ${client.businessName} brings premium detailing to your driveway. Free quotes, same-day available. Call ${PHONE}.`;
  const head = pageHead({
    title: `${client.niche} in ${city}, ${client.state} | ${client.businessName}`,
    description, canonical: `${client.domain}/${cs}`, extraJsonLd: jsonLdFaq(homeFaqs(city)),
  });
  const body = `${heroSection({
    eyebrow: `${city} · ${client.state}`,
    headline,
    lede: `${client.businessName} brings premium mobile ${client.nicheKeyword} to ${city}. Owner-operated, ${client.reviewCount}+ five-star reviews, fully insured.`,
    showSlides: true, tall: false,
  })}
${introPillars({ city })}
${valueProp({ city })}
${servicesGrid({ city, count: 8 })}
${reviewsSection({ city, max: 3 })}
${ownerSection({ city })}
${bigCtaSection({ city })}
${processSection({ city })}
${serviceAreaSection({ current: city })}
${faqSection(homeFaqs(city))}
${finalCtaSection({ city })}`;
  writeHtml(filename, buildPage({ head, currentPath: `/${cs}`, body }));
  return { file: filename, city };
}

export async function generateAllLandingPages() {
  const results = [];
  for (const city of client.cities) {
    const r = buildCityLanding(city, city === client.city);
    results.push(r);
  }
  console.log(`  ✓ ${results.length} city landing pages`);
  return results;
}

export async function generateLandingPage(city) {
  return buildCityLanding(city, city === client.city);
}

// ═════════════════════════════════════════════════════════════════════════════
// SERVICE PAGES (alias + Champaign-IL combos)
// ═════════════════════════════════════════════════════════════════════════════
function buildServicePage({ slug, service, city, titleOverride, fileOverride }) {
  const titledService = titleCase(service);
  const desc = SERVICE_DESCRIPTIONS[service.toLowerCase()] || `Professional ${service} done right at your home or office${city ? ` in ${city}` : ""}.`;
  const description = `${titledService}${city ? ` in ${city}, ${client.state}` : ""}. ${desc.slice(0, 100)} Call ${PHONE} for a free quote.`;
  const headline = city ? `${titledService} in <em>${htmlEscape(city)}</em>` : `${titledService} <em>made easy.</em>`;
  const otherServices = client.services.filter((s) => s !== service).slice(0, 6);
  const otherCities = client.cities.filter((c) => c !== (city || client.city)).slice(0, 6);
  const title = titleOverride || (city ? `${titledService} in ${city}, ${client.state} | ${client.businessName}` : `${titledService} | ${client.businessName}`);
  const filename = fileOverride || `${slug}.html`;
  const head = pageHead({
    title, description, canonical: `${client.domain}/${slug}`,
    extraJsonLd: jsonLdFaq(serviceFaqs(service, city || client.city)),
  });
  const useCity = city || client.city;
  const body = `${heroSection({
    eyebrow: city ? `${city} · ${titledService}` : titledService,
    headline,
    lede: htmlEscape(desc),
    showSlides: false,
    slides: [PHOTO_HERO[Math.abs(slug.length) % PHOTO_HERO.length]],
  })}
<section class="page-content">
  <div class="container page-content-grid">
    <div class="page-content-body">
      <h2>${titledService} brought to ${city ? `your driveway in ${htmlEscape(city)}` : "you, anywhere in central Illinois"}.</h2>
      <p>${htmlEscape(desc)} ${htmlEscape(client.businessName)} performs every ${htmlEscape(service)} appointment ${city ? `in ${htmlEscape(city)}` : ""} on-site — your driveway, your office parking lot, your apartment garage. We bring water, power, and the same person who picked up the phone, every time.</p>
      <p>Whether it's a single car or a fleet, our ${htmlEscape(service)} packages include a written quote up front, no upsells once we're on-site, and a final walkaround so you see the result before you pay. Same-day appointments are available, and we book quickly via call or text — <a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a>.</p>

      <h2>What's included with ${titledService}${city ? ` in ${htmlEscape(city)}` : ""}</h2>
      <p>Every ${htmlEscape(service)} package${city ? ` in ${htmlEscape(city)}` : ""} is built around three things: prep, premium products, and time. We don't speed-run a clean. The car gets the time it actually needs, and we use the products that justify our reviews — not whatever is on the cheapest pallet.</p>
      <ul>
        <li><strong>Pre-inspection.</strong> We document the car's condition before we start, so you know exactly what we're working with.</li>
        <li><strong>Decontamination.</strong> Iron remover, clay, foam — depending on the package — to safely strip what's bonded to the paint.</li>
        <li><strong>The actual ${htmlEscape(service)} work.</strong> Whatever the package calls for, done with measured, careful technique.</li>
        <li><strong>Final walkaround.</strong> We show you what we did, in good light, before we accept payment.</li>
      </ul>

      <h2>Why customers choose ${htmlEscape(client.businessName)}</h2>
      <p>We're owner-operated. ${htmlEscape(client.ownerName.split(" ")[0])} is on every job — there's no swapped crew, no third-party detailer running it for us. That's how we keep our review average at 5.0 across ${client.reviewCount}+ verified Google reviews. People keep booking us because the result they got the first time is the result they get every time.</p>
      <p>Looking for service in another city? Browse our full <a href="/service-area">service area</a> or jump to ${otherCities.slice(0, 3).map((c) => `<a href="/${citySlug(c)}">${htmlEscape(c)}</a>`).join(", ")}.</p>

      <blockquote>"${htmlEscape((client.reviews || [])[0]?.text || "Best detailer I've ever used.").slice(0, 220)}" — ${htmlEscape((client.reviews || [])[0]?.name || "customer")}</blockquote>

      <h2>Booking ${titledService}${city ? ` in ${htmlEscape(city)}` : ""}</h2>
      <p>Booking is fast on purpose. <a href="/book-an-appointment-1696">Book online</a>, <a href="${PHONE_TEL}">call</a>, or <a href="${PHONE_SMS}">text us a photo</a> of the car. We'll send you a written quote within minutes. If the price works, we lock in a time and place${city ? ` anywhere in ${htmlEscape(city)}` : ""} — most appointments confirm same-day.</p>
      <p>Prefer to see real pricing first? Try our <a href="/cost-calculator">cost calculator</a> — pick your service, package, and vehicle size for an instant estimate.</p>
    </div>
    <aside class="page-content-aside">
      <h4>Get a Free Quote</h4>
      <div class="ph"><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></div>
      <div class="small">${htmlEscape(client.hours || "Mon–Sat 8a–8p")}</div>
      <a href="/book-an-appointment-1696" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:14px">Book Online</a>
      <a href="${PHONE_SMS}" class="btn btn-light" style="width:100%;justify-content:center;margin-bottom:24px">Text a Photo</a>
      <h4>Other Services</h4>
      <ul>
${otherServices.map((s) => `        <li><a href="/${SERVICE_ALIASES[s.toLowerCase()] || serviceSlug(s)}">${titleCase(s)}</a></li>`).join("\n")}
      </ul>
      ${city ? `<h4 style="margin-top:18px">${titledService} Nearby</h4>
      <ul>
${otherCities.slice(0, 4).map((c) => `        <li><a href="/${citySlug(c)}">${titledService} in ${htmlEscape(c)}</a></li>`).join("\n")}
      </ul>` : `<h4 style="margin-top:18px">Top Locations</h4>
      <ul>
${client.cities.slice(0, 4).map((c) => `        <li><a href="/${citySlug(c)}">${htmlEscape(c)}</a></li>`).join("\n")}
      </ul>`}
    </aside>
  </div>
</section>
${reviewsSection({ city, max: 3 })}
${faqSection(serviceFaqs(service, useCity))}
${bigCtaSection({ city: useCity })}
${finalCtaSection({ city: useCity })}`;
  writeHtml(filename, buildPage({ head, currentPath: `/${slug}`, body }));
  return { file: filename };
}

// Service alias pages (general): /interior, /exterior, /full-service, /mobile-detailing,
// /ceramic, /paint-correction, /headlight, /engine, /window-tint, /ppf, /car-wraps,
// /motorcycle-detailing, /vehicle-protection
const ALIAS_SERVICES = [
  ["interior", "interior detailing"],
  ["exterior", "exterior detailing"],
  ["full-service", "full service detailing"],
  ["mobile-detailing", "mobile detailing"],
  ["ceramic", "ceramic coating"],
  ["paint-correction", "paint correction"],
  ["headlight", "headlight restoration"],
  ["engine", "engine detailing"],
  ["window-tint", "window tinting"],
  ["ppf", "paint protection film"],
  ["car-wraps", "car wraps"],
  ["motorcycle-detailing", "motorcycle detailing"],
  ["vehicle-protection", "vehicle protection"],
];

export async function generateServiceAliasPages() {
  const results = [];
  for (const [slug, service] of ALIAS_SERVICES) {
    results.push(buildServicePage({ slug, service, city: null }));
  }
  console.log(`  ✓ ${results.length} service alias pages`);
  return results;
}

// Champaign-IL high-intent combos
const CHAMPAIGN_COMBOS = [
  ["interior-detailing-champaign-il", "interior detailing"],
  ["exterior-detailing-champaign-il", "exterior detailing"],
  ["full-service-detailing-champaign-il", "full service detailing"],
  ["mobile-detailing-champaign-il", "mobile detailing"],
];

export async function generateChampaignCombos() {
  const results = [];
  for (const [slug, service] of CHAMPAIGN_COMBOS) {
    results.push(buildServicePage({ slug, service, city: "Champaign" }));
  }
  console.log(`  ✓ ${results.length} Champaign high-intent service pages`);
  return results;
}

// B2B pages
const B2B_SERVICES = [
  ["b2b-detailing", "B2B Detailing", "Volume detailing for businesses — auto dealerships, rental fleets, body shops, and corporate fleets across central Illinois."],
  ["fleet-detailing", "Fleet Detailing", "Recurring on-site detailing for company fleets, ride-share drivers, and rental car companies. Volume pricing, scheduled cleans."],
  ["commercial-detailing", "Commercial Detailing", "Heavy-duty interior and exterior detailing for commercial vehicles, vans, trucks, and equipment."],
  ["dealership-detailing", "Dealership Detailing", "Lot-ready vehicle prep, pre-delivery inspection details, and trade-in reconditioning for area dealers."],
  ["body-shop-detailing", "Body Shop Detailing", "Final-stage post-paint detail to remove buffer trails, overspray, and prep the car for handoff to the customer."],
  ["rental-car-detailing", "Rental Car Detailing", "Quick-turn interior and exterior resets for rental fleets. Smoke, pet, and stain remediation."],
];

export async function generateB2BPages() {
  const results = [];
  for (const [slug, name, blurb] of B2B_SERVICES) {
    const description = `${name} from ${client.businessName} — mobile, owner-operated, central Illinois. ${blurb.slice(0, 80)} Call ${PHONE}.`;
    const head = pageHead({
      title: `${name} | ${client.businessName}`,
      description, canonical: `${client.domain}/${slug}`,
    });
    const body = `${heroSection({
      eyebrow: `B2B / Commercial`,
      headline: `${name} <em>at scale.</em>`,
      lede: blurb, showSlides: false, slides: [PHOTO_HERO[3]],
    })}
<section class="page-content">
  <div class="container page-content-grid">
    <div class="page-content-body">
      <h2>${name} for ${client.city}-area businesses</h2>
      <p>${client.businessName} runs a B2B program for dealerships, rental car branches, body shops, and company fleets across central Illinois. The model is the same as our retail work — mobile, owner-operated, premium products — but billed and scheduled to fit a business operation.</p>
      <h3>What's included</h3>
      <ul>
        <li>Volume pricing per vehicle</li>
        <li>Recurring schedule (weekly, biweekly, monthly)</li>
        <li>On-site at your lot or yard — we bring power and water</li>
        <li>Net 15 / Net 30 invoicing for established accounts</li>
        <li>Single point of contact (the owner)</li>
      </ul>
      <h3>Who we work with</h3>
      <p>We work with dealerships in ${client.cities.slice(0, 4).join(", ")}, regional rental car franchises, body shops finishing paintwork, and small fleet operators across the region. Whether you have 4 vehicles a month or 40, we'll build a plan that fits.</p>
      <h2>Get a B2B quote</h2>
      <p>Tell us your volume and we'll quote per-vehicle pricing the same day. <a href="${PHONE_TEL}">Call ${client.phone}</a> or <a href="mailto:${client.email}">email ${client.email}</a> with the basics — vehicle counts, location, frequency. We'll send back a real quote.</p>
    </div>
    <aside class="page-content-aside">
      <h4>B2B Quote</h4>
      <div class="ph"><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></div>
      <div class="small">Speak to ${htmlEscape(client.ownerName)}</div>
      <a href="${PHONE_TEL}" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:14px">Call Now</a>
      <a href="mailto:${client.email}" class="btn btn-light" style="width:100%;justify-content:center;margin-bottom:24px">Email Us</a>
      <h4>Other B2B Services</h4>
      <ul>
${B2B_SERVICES.filter(([s]) => s !== slug).slice(0, 5).map(([s, n]) => `        <li><a href="/${s}">${htmlEscape(n)}</a></li>`).join("\n")}
      </ul>
    </aside>
  </div>
</section>
${reviewsSection({ max: 3 })}
${finalCtaSection({})}`;
    writeHtml(`${slug}.html`, buildPage({ head, currentPath: `/${slug}`, body }));
    results.push({ file: `${slug}.html` });
  }
  console.log(`  ✓ ${results.length} B2B pages`);
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// ABOUT US
// ═════════════════════════════════════════════════════════════════════════════
export async function generateAboutPage() {
  const city = client.city;
  const description = `About ${client.businessName} — owner-operated mobile detailing in ${city}, ${client.state}. Meet ${client.ownerName}.`;
  const head = pageHead({
    title: `About Us | ${client.businessName}`,
    description, canonical: `${client.domain}/about-us`,
  });
  const body = `${heroSection({
    eyebrow: `About Us`,
    headline: `Brother-run. <em>Driveway-detailed.</em>`,
    lede: `${client.businessName} is a brother-run mobile detailing business serving ${city} and central Illinois. We bring premium results directly to your driveway.`,
    showSlides: false, slides: [PHOTO_HERO[0]],
  })}
<section class="page-content">
  <div class="container page-content-grid">
    <div class="page-content-body">
      <h2>How ${htmlEscape(client.businessName)} got started</h2>
      <p>${htmlEscape(client.ownerName)} started ${htmlEscape(client.businessName)} for one simple reason: every detailer he'd ever taken his own car to either gave it a half-effort wash, or charged a small fortune for an "ultimate package" that wasn't actually ultimate. So he opened up shop himself, with three rules:</p>
      <ul>
        <li><strong>Mobile only.</strong> We come to you. Period. No drop-offs, no shuttle rides.</li>
        <li><strong>No subcontractors.</strong> The owner is on every job. The person who books the work does the work.</li>
        <li><strong>Honest quotes.</strong> Real pricing up front. No "well actually it's more" once we're in the driveway.</li>
      </ul>
      <p>Those three rules are still our entire business model. We've now done hundreds of details across ${client.cities.slice(0, 4).join(", ")}, and the reviews speak for themselves — ${client.reviewCount}+ verified five-stars on Google.</p>

      <h2>What we believe about a good detail</h2>
      <p>A good detail isn't about the cheapest products — it's about the right ones, used carefully. We use professional foams, ceramic coatings, hot-water extractors, and steam tools. We also use time. Most "fast detailers" cut corners on prep. We don't.</p>

      <h2>Where we serve</h2>
      <p>We're based in ${htmlEscape(client.city)}, ${htmlEscape(client.state)} and we travel across the entire central Illinois region. See our <a href="/service-area">full service area list</a>, or browse our most-booked routes:</p>
      <ul>
${client.cities.slice(0, 6).map((c) => `        <li><a href="/${citySlug(c)}">${client.niche} in ${htmlEscape(c)}</a></li>`).join("\n")}
      </ul>

      <h2>Get in touch</h2>
      <p>Ready to book? <a href="${PHONE_TEL}">Call ${htmlEscape(PHONE)}</a>, <a href="${PHONE_SMS}">text us a photo</a>, or <a href="/book-an-appointment-1696">book online</a>.</p>
    </div>
    <aside class="page-content-aside">
      <h4>Talk to ${htmlEscape(client.ownerName.split(" ")[0])}</h4>
      <div class="ph"><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></div>
      <div class="small">${htmlEscape(client.hours || "Mon–Sat 8a–8p")}</div>
      <a href="/book-an-appointment-1696" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:14px">Book Online</a>
      <a href="${PHONE_SMS}" class="btn btn-light" style="width:100%;justify-content:center;margin-bottom:24px">Text Us</a>
      <h4>Quick Links</h4>
      <ul>
        <li><a href="/why-choose-us">Why Choose Us</a></li>
        <li><a href="/our-process">Our Process</a></li>
        <li><a href="/reviews">Reviews</a></li>
        <li><a href="/faq">FAQ</a></li>
      </ul>
    </aside>
  </div>
</section>
${ownerSection({ city })}
${reviewsSection({ max: 3 })}
${finalCtaSection({ city })}`;
  writeHtml("about-us.html", buildPage({ head, currentPath: "/about-us", body }));
  console.log(`  ✓ about-us → output/about-us.html`);
  return { file: "about-us.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTACT
// ═════════════════════════════════════════════════════════════════════════════
export async function generateContactPage() {
  const city = client.city;
  const description = `Contact ${client.businessName} — call, text, or email. Mobile ${client.nicheKeyword} in ${city}, ${client.state}.`;
  const head = pageHead({
    title: `Contact | ${client.businessName}`,
    description, canonical: `${client.domain}/contact`,
  });
  const body = `${heroSection({
    eyebrow: `Contact`,
    headline: `Easiest way to book? <em>Just call.</em>`,
    lede: `Or text us a photo of your car. We respond fast — and quotes are always free.`,
    showSlides: false,
  })}
<section class="page-content">
  <div class="container page-content-grid">
    <div class="page-content-body">
      <h2>Three ways to reach us</h2>
      <p><strong>Call:</strong> <a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a> — fastest. Picked up by ${htmlEscape(client.ownerName.split(" ")[0])} or a member of the team.</p>
      <p><strong>Text:</strong> <a href="${PHONE_SMS}">${htmlEscape(PHONE)}</a> — best for sending photos. Snap exterior + interior + anything weird. We'll write back with a quote.</p>
      <p><strong>Email:</strong> <a href="mailto:${client.email}">${client.email}</a> — for longer conversations or scheduling fleet work.</p>
      <p><strong>Online booking:</strong> Use our <a href="/book-an-appointment-1696">online booking form</a> for a guided 4-step flow that confirms your appointment instantly.</p>
      <h2>Hours</h2>
      <p>${htmlEscape(client.hours || "Mon–Sat 8am–8pm · Sun 1pm–8pm")}</p>
      <p>If we miss your call, we'll call you back the same day. We don't use voicemail trees — just real humans.</p>
      <h2>Service area</h2>
      <p>We're based in ${htmlEscape(client.city)}, ${htmlEscape(client.state)} and serve ${client.cities.length} cities across central Illinois. <a href="/service-area">See the full list</a>.</p>
    </div>
    <aside class="page-content-aside">
      <h4>Quick Book</h4>
      <div class="ph"><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></div>
      <div class="small">${htmlEscape(client.hours || "Mon–Sat 8a–8p")}</div>
      <a href="/book-an-appointment-1696" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:14px">Book Online</a>
      <a href="${PHONE_TEL}" class="btn btn-dark" style="width:100%;justify-content:center;margin-bottom:14px">Call Now</a>
      <a href="${PHONE_SMS}" class="btn btn-light" style="width:100%;justify-content:center">Text Us</a>
    </aside>
  </div>
</section>
${reviewsSection({ max: 3 })}
${finalCtaSection({ city })}`;
  writeHtml("contact.html", buildPage({ head, currentPath: "/contact", body }));
  console.log(`  ✓ contact → output/contact.html`);
  return { file: "contact.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// FAQ
// ═════════════════════════════════════════════════════════════════════════════
export async function generateFAQPage() {
  const faqs = [
    ...homeFaqs(client.city),
    { q: "What forms of payment do you accept?", a: "Cash, all major credit cards, Apple Pay, Google Pay, Venmo, Zelle. Payment is collected after the final walkaround — never up front." },
    { q: "Do I need to be home during the appointment?", a: "Not at all. As long as we have access to the car and a reasonably level surface, you can leave us with the keys and check in when we're done." },
    { q: "What if it rains the day of my appointment?", a: "We watch the weather closely. If rain is in the forecast we'll call you the morning of and reschedule for free. Light overcast or drizzle isn't usually a blocker for interior work." },
    { q: "Do you do ceramic coatings on new cars?", a: "Yes — and new is actually the best time to coat. The paint hasn't been damaged or contaminated yet, so the result is mirror-finish and the protection starts day one." },
    { q: "How does pricing work for SUVs and trucks?", a: "Larger vehicles take longer and use more product, so they're priced higher than coupes and sedans. Our cost calculator shows exact pricing for every vehicle size." },
    { q: "Can you remove cigarette smoke smell?", a: "Often, yes. Smoke remediation is a multi-stage process — we steam, deep extract, and ozone-treat. Severe cases may need multiple sessions but we tell you up front." },
    { q: "What's the difference between a wax and a ceramic coating?", a: "Wax lasts weeks. Ceramic coating lasts years. Ceramic also creates a much harder, more chemical-resistant layer over the paint. We have a full guide on this in our blog." },
    { q: "Do you offer recurring maintenance details?", a: "Yes — many of our customers book monthly or quarterly. We discount recurring schedules and prioritize their bookings." },
    { q: "How far do you travel?", a: "Anywhere in our 23-city service area without a travel fee. Outside that, we travel for ceramic coating jobs, fleet work, and any 5-hour-plus job." },
  ];
  const description = `Frequently asked questions about ${client.businessName} — pricing, mobile service, coatings, scheduling.`;
  const head = pageHead({
    title: `FAQ | ${client.businessName}`,
    description, canonical: `${client.domain}/faq`,
    extraJsonLd: jsonLdFaq(faqs),
  });
  const body = `${heroSection({
    eyebrow: `FAQ`,
    headline: `Common questions, <em>answered.</em>`,
    lede: `Pricing, scheduling, weather, smoke remediation — the questions we get most often, with honest answers.`,
    showSlides: false,
  })}
${faqSection(faqs)}
${bigCtaSection({ city: client.city })}
${finalCtaSection({ city: client.city })}`;
  writeHtml("faq.html", buildPage({ head, currentPath: "/faq", body }));
  console.log(`  ✓ faq → output/faq.html`);
  return { file: "faq.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// WHY CHOOSE US
// ═════════════════════════════════════════════════════════════════════════════
export async function generateWhyUsPage() {
  const description = `Why choose ${client.businessName}? Owner-operated, mobile-only, ${client.reviewCount}+ five-star reviews across central Illinois.`;
  const head = pageHead({
    title: `Why Choose Us | ${client.businessName}`,
    description, canonical: `${client.domain}/why-choose-us`,
  });
  const reasons = [
    { num: "01", h: "Owner is on every job", p: `${client.ownerName.split(" ")[0]} personally handles every appointment. There's no swapped crew, no third-party detailer running it for us.` },
    { num: "02", h: "Mobile-only, water + power included", p: "We arrive at your home, work, or wherever your car lives. We bring our own water tank, generator, and full pro kit. You just need a parking spot." },
    { num: "03", h: "Honest quotes, no surprise upsells", p: "We give you a real price up front — based on your vehicle and the package. You won't hear 'oh actually it's more' once we get on-site." },
    { num: "04", h: `${client.reviewCount}+ verified five-star reviews`, p: "5.0 average rating on Google, with verified reviews going back years. We don't pay for reviews — we earn them." },
    { num: "05", h: "Premium products, real time per car", p: "Professional foams, ceramic coatings, steam, extraction. We don't speed-run a clean. The car gets the time it actually needs." },
    { num: "06", h: "Licensed, insured, local", p: `${client.businessName} is fully insured for damage and liability. We're based in ${client.city}, ${client.state} and we live where we work.` },
  ];
  const body = `${heroSection({
    eyebrow: `Why Us`,
    headline: `Six reasons we have <em>${client.reviewCount}+ five-stars.</em>`,
    lede: `Owner-operated, mobile-only, premium products. Here's what sets ${client.businessName} apart from anyone else you'd hire.`,
    showSlides: false,
  })}
<section class="process-section">
  <div class="container">
    <div class="process-list">
${reasons.map((r) => `      <div class="process-step">
        <div class="process-num">${r.num}</div>
        <div><h3>${htmlEscape(r.h)}</h3><p>${htmlEscape(r.p)}</p></div>
      </div>`).join("\n")}
    </div>
  </div>
</section>
${reviewsSection({ max: 3 })}
${ownerSection({})}
${finalCtaSection({})}`;
  writeHtml("why-choose-us.html", buildPage({ head, currentPath: "/why-choose-us", body }));
  console.log(`  ✓ why-choose-us → output/why-choose-us.html`);
  return { file: "why-choose-us.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// OUR PROCESS
// ═════════════════════════════════════════════════════════════════════════════
export async function generateProcessPage() {
  const description = `Our 4-step detailing process — book, we come to you, we detail, you drive off. ${client.businessName} in ${client.city}, ${client.state}.`;
  const head = pageHead({
    title: `Our Process | ${client.businessName}`,
    description, canonical: `${client.domain}/our-process`,
  });
  const body = `${heroSection({
    eyebrow: `Our Process`,
    headline: `Four steps. <em>Zero friction.</em>`,
    lede: `From the first call to the keys back in your hand — here's exactly how a ${client.businessName} appointment runs.`,
    showSlides: false,
  })}
${processSection({})}
<section class="page-content">
  <div class="container page-content-grid">
    <div class="page-content-body">
      <h2>Step 1 — Book</h2>
      <p>Call <a href="${PHONE_TEL}">${PHONE}</a>, text us, or use our <a href="/book-an-appointment-1696">online booking form</a>. The fastest way is text — send a couple photos of the car (exterior, interior, anywhere you're concerned) and we'll send you back a real quote within minutes.</p>
      <h2>Step 2 — We come to you</h2>
      <p>Pick a time and place anywhere in our <a href="/service-area">service area</a>. Driveway, work parking lot, apartment garage. We bring our own water tank and power so you just need a flat parking spot.</p>
      <h2>Step 3 — We detail</h2>
      <p>The package you booked is the package you get. No surprise add-ons, no upsells once we're on-site. We use professional products, take real time per car, and document the work as we go.</p>
      <h2>Step 4 — You drive off</h2>
      <p>Final walkaround in good light. You see the result before you pay. Cash, card, Apple Pay, Venmo, Zelle — whatever's easiest. Most customers book again within 90 days.</p>
    </div>
    <aside class="page-content-aside">
      <h4>Ready to start?</h4>
      <div class="ph"><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></div>
      <a href="/book-an-appointment-1696" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:14px">Book Online</a>
      <a href="${PHONE_SMS}" class="btn btn-light" style="width:100%;justify-content:center">Text a Photo</a>
    </aside>
  </div>
</section>
${finalCtaSection({})}`;
  writeHtml("our-process.html", buildPage({ head, currentPath: "/our-process", body }));
  console.log(`  ✓ our-process → output/our-process.html`);
  return { file: "our-process.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// GALLERY
// ═════════════════════════════════════════════════════════════════════════════
export async function generateGalleryPage() {
  const description = `Recent detailing work from ${client.businessName} — interior resets, ceramic coatings, paint correction, and more across central Illinois.`;
  const head = pageHead({
    title: `Gallery | ${client.businessName}`,
    description, canonical: `${client.domain}/gallery`,
  });
  const body = `${heroSection({
    eyebrow: `Gallery`,
    headline: `Recent work, <em>real results.</em>`,
    lede: `Cars, trucks, and SUVs we've recently brought back to life across central Illinois. Click any image for the package details.`,
    showSlides: false,
  })}
${gallerySection({ count: 8 })}
${reviewsSection({ max: 3 })}
${bigCtaSection({})}
${finalCtaSection({})}`;
  writeHtml("gallery.html", buildPage({ head, currentPath: "/gallery", body }));
  console.log(`  ✓ gallery → output/gallery.html`);
  return { file: "gallery.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// REVIEWS
// ═════════════════════════════════════════════════════════════════════════════
export async function generateReviewsPage() {
  const description = `${client.reviewCount}+ verified five-star Google reviews for ${client.businessName} — read what real ${client.city}-area customers say.`;
  const reviews = client.reviews || [];
  const head = pageHead({
    title: `Reviews | ${client.businessName}`,
    description, canonical: `${client.domain}/reviews`,
  });
  const body = `${heroSection({
    eyebrow: `Reviews`,
    headline: `${client.reviewCount}+ five-stars. <em>Zero asterisks.</em>`,
    lede: `Every review below is verified on Google. We don't pay for promotion, we don't run review-bait campaigns — we just do the work.`,
    showSlides: false,
  })}
${reviewsSection({ expandable: true, batch: 6 })}
${bigCtaSection({})}
${finalCtaSection({})}`;
  writeHtml("reviews.html", buildPage({ head, currentPath: "/reviews", body }));
  console.log(`  ✓ reviews → output/reviews.html`);
  return { file: "reviews.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// SERVICE AREA
// ═════════════════════════════════════════════════════════════════════════════
export async function generateServiceAreaPage() {
  const description = `Service area for ${client.businessName} — mobile ${client.nicheKeyword} across ${client.cities.length} central Illinois cities.`;
  const head = pageHead({
    title: `Service Area | ${client.businessName}`,
    description, canonical: `${client.domain}/service-area`,
  });
  const body = `${heroSection({
    eyebrow: `Service Area`,
    headline: `${client.cities.length} cities. <em>One mobile crew.</em>`,
    lede: `${client.businessName} is mobile-only. We come to you across ${client.cities.length} cities in central Illinois — pick yours below.`,
    showSlides: false,
  })}
${serviceAreaSection({ current: null })}
<section class="page-content">
  <div class="container">
    <div class="page-content-body" style="max-width:780px;margin:0 auto">
      <h2>Outside our service area?</h2>
      <p>Call us. We do travel for larger jobs — multi-day ceramic coatings, fleet routes, paint protection film installs. There's no harm in asking.</p>
      <p>For everyday details, the cities listed above are where we run our standard mobile schedule. If you're in one of those cities, you'll usually have a slot within 1-3 days.</p>
    </div>
  </div>
</section>
${reviewsSection({ max: 3 })}
${bigCtaSection({})}
${finalCtaSection({})}`;
  writeHtml("service-area.html", buildPage({ head, currentPath: "/service-area", body }));
  console.log(`  ✓ service-area → output/service-area.html`);
  return { file: "service-area.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// PACKAGES
// ═════════════════════════════════════════════════════════════════════════════
export async function generatePackagesPage() {
  const description = `${client.businessName} packages — Express Interior, Interior Refresh, Express In & Out, Full Interior, Full Detail. Mobile, ${client.city}.`;
  const head = pageHead({
    title: `Packages | ${client.businessName}`,
    description, canonical: `${client.domain}/packages`,
  });
  const packages = [
    {
      name: "Express Interior",
      price: "110",
      from: "Starting from (Coupe)",
      duration: "1 hour",
      featured: false,
      includes: ["Vacuum (carpets, mats, seats)", "Wipe-down hard surfaces", "Window cleaning", "Light interior tidy"],
    },
    {
      name: "Interior Refresh",
      price: "150",
      from: "Starting from (Coupe)",
      duration: "1.5 hours",
      featured: false,
      includes: ["Express Interior +", "Light shampoo problem spots", "UV protectant on plastics", "Air freshener of choice"],
    },
    {
      name: "Express In & Out",
      price: "200",
      from: "Starting from (Coupe)",
      duration: "2.25 hours",
      featured: true,
      includes: ["Foam wash exterior", "Wheels + tires + jambs", "Full vacuum interior", "Wipe-down hard surfaces", "Window cleaning"],
    },
    {
      name: "Full Interior Detail",
      price: "220",
      from: "Starting from (Coupe)",
      duration: "2.5 hours",
      featured: false,
      includes: ["Full vacuum + extraction", "Steam clean every panel", "Leather conditioning", "Headliner + air vents", "Odor neutralization"],
    },
    {
      name: "Full Detail",
      price: "300",
      from: "Starting from (Coupe)",
      duration: "3.5 hours",
      featured: true,
      includes: ["Decon foam wash", "Iron remover + clay", "Full interior detail", "Tire dressing + jambs", "Sealant on paint", "Final walkaround"],
    },
    {
      name: "Ceramic Coating (1yr)",
      price: "200",
      from: "Coating only — add detail to prep",
      duration: "6 hours",
      featured: false,
      includes: ["Paint decontamination", "Light polish", "1-year ceramic coating", "Hydrophobic finish", "Easier washes for 12 months"],
    },
    {
      name: "Window Tint (Sedan)",
      price: "450",
      from: "Obsidian — Sedan size",
      duration: "3 hours",
      featured: false,
      includes: ["All side + rear windows", "Lifetime warranty film", "Heat + UV reduction", "Add windshield: +$250", "Add brow strip: +$75"],
    },
    {
      name: "PPF — City Coverage",
      price: "300",
      from: "Front bumper basics",
      duration: "6 hours",
      featured: false,
      includes: ["Self-healing PPF", "Front bumper + leading edges", "Rock chip protection", "Optional upgrades to Highway/Track Pack"],
    },
    {
      name: "Paint Correction (Misc)",
      price: "500",
      from: "Misc color, Coupe",
      duration: "5 hours",
      featured: false,
      includes: ["Multi-stage machine polish", "Swirl + scratch removal", "Mirror-finish base", "Pairs with ceramic coating"],
    },
  ];
  const body = `${heroSection({
    eyebrow: `Packages`,
    headline: `Every package, <em>every detail.</em>`,
    lede: `From a one-hour interior reset to multi-stage paint correction with ceramic. Click any package to book — or use our cost calculator for your vehicle.`,
    showSlides: false,
  })}
<section class="page-content">
  <div class="container">
    <div class="pkg-grid">
${packages.map((p) => `      <div class="pkg-card${p.featured ? " featured" : ""}">
        <div class="name">${htmlEscape(p.name)}</div>
        <div class="from">${htmlEscape(p.from)}</div>
        <div class="price">$${p.price}<small>/from</small></div>
        <div class="duration">⏱ ${htmlEscape(p.duration)}</div>
        <ul>
${p.includes.map((i) => `          <li>${htmlEscape(i)}</li>`).join("\n")}
        </ul>
        <a href="/book-an-appointment-1696" class="btn btn-primary pkg-cta" style="width:100%;justify-content:center">Book This Package</a>
      </div>`).join("\n")}
    </div>
    <div style="text-align:center;margin-top:60px">
      <p style="color:var(--muted);margin-bottom:20px">Need help picking? <a href="/cost-calculator">Try our cost calculator</a> — pick service, package, and vehicle size for an instant estimate.</p>
      <a href="${PHONE_TEL}" class="btn btn-dark">Talk to ${htmlEscape(client.ownerName.split(" ")[0])} · ${PHONE}</a>
    </div>
  </div>
</section>
${reviewsSection({ max: 3 })}
${bigCtaSection({})}
${finalCtaSection({})}`;
  writeHtml("packages.html", buildPage({ head, currentPath: "/packages", body }));
  console.log(`  ✓ packages → output/packages.html`);
  return { file: "packages.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// PRIVACY POLICY
// ═════════════════════════════════════════════════════════════════════════════
export async function generatePrivacyPage() {
  const description = `Privacy policy for ${client.businessName} — how we handle customer data, contact info, and bookings.`;
  const head = pageHead({
    title: `Privacy Policy | ${client.businessName}`,
    description, canonical: `${client.domain}/privacy-policy`,
  });
  const body = `${heroSection({
    eyebrow: `Legal`,
    headline: `Privacy Policy`,
    lede: `How ${client.businessName} collects, uses, and protects your information.`,
    showSlides: false,
  })}
<section class="page-content">
  <div class="container">
    <div class="page-content-body" style="max-width:780px;margin:0 auto">
      <p><em>Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</em></p>
      <h2>What we collect</h2>
      <p>When you contact ${client.businessName} or book an appointment, we collect basic contact information: name, phone number, email, vehicle details, and the address where the service will be performed. We do not collect payment card details — payment is collected via your preferred method at the time of service.</p>
      <h2>How we use it</h2>
      <p>We use your information to contact you about your appointment, send quotes and confirmations, and follow up on past services. We may occasionally send appointment reminders or service offers. You can opt out of marketing messages at any time by replying STOP.</p>
      <h2>How we store it</h2>
      <p>Customer information is stored in our CRM (GoHighLevel) and protected by industry-standard encryption. We do not sell, rent, or share your information with third parties for marketing purposes.</p>
      <h2>Your choices</h2>
      <p>You can request a copy of your stored information, ask us to correct it, or request deletion at any time. Contact <a href="mailto:${client.email}">${client.email}</a> with your request.</p>
      <h2>Cookies and analytics</h2>
      <p>This website uses standard analytics to understand which pages people visit. No personally identifying information is collected by these analytics. Our chat widget (GoHighLevel) may set cookies to remember if you've interacted with it.</p>
      <h2>Contact</h2>
      <p>Questions about this policy? Email <a href="mailto:${client.email}">${client.email}</a> or call <a href="${PHONE_TEL}">${PHONE}</a>.</p>
    </div>
  </div>
</section>`;
  writeHtml("privacy-policy.html", buildPage({ head, currentPath: "/privacy-policy", body }));
  console.log(`  ✓ privacy-policy → output/privacy-policy.html`);
  return { file: "privacy-policy.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// TERMS AND CONDITIONS
// ═════════════════════════════════════════════════════════════════════════════
export async function generateTermsPage() {
  const description = `Terms and conditions for ${client.businessName} — booking, cancellation, and service policies.`;
  const head = pageHead({
    title: `Terms and Conditions | ${client.businessName}`,
    description, canonical: `${client.domain}/terms-and-conditions`,
  });
  const body = `${heroSection({
    eyebrow: `Legal`,
    headline: `Terms and Conditions`,
    lede: `Booking, cancellation, weather, and service policies for ${client.businessName}.`,
    showSlides: false,
  })}
<section class="page-content">
  <div class="container">
    <div class="page-content-body" style="max-width:780px;margin:0 auto">
      <p><em>Last updated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</em></p>
      <h2>1. Booking and confirmation</h2>
      <p>An appointment is confirmed once we send a written quote and you accept it (by reply text, email, or online booking). We may request a deposit for jobs over $500.</p>
      <h2>2. Cancellation</h2>
      <p>You can cancel or reschedule with 24 hours' notice at no charge. Cancellations within 24 hours may be subject to a 25% fee. No-shows (we arrive and the vehicle is not available) are charged in full.</p>
      <h2>3. Weather</h2>
      <p>${client.businessName} performs work in light overcast or drizzle conditions. We monitor forecasts and may proactively reschedule for severe weather (heavy rain, hail, lightning). Rescheduling for weather is free.</p>
      <h2>4. Vehicle access</h2>
      <p>You agree to provide reasonable access to the vehicle and a flat parking surface. We bring our own water and power. If we cannot complete the work due to lack of access, the appointment is treated as a no-show.</p>
      <h2>5. Pre-existing damage</h2>
      <p>We document the vehicle's condition before any work begins. Pre-existing scratches, swirls, dents, stains, and other damage are not the responsibility of ${client.businessName}. We will inform you of any pre-existing condition that affects the result.</p>
      <h2>6. Result expectations</h2>
      <p>Detailing improves the appearance of a vehicle but does not always restore it to new condition. Severely damaged paint, deep stains, smoke damage, and biological contamination may require multiple sessions or specialized restoration that is beyond standard detailing.</p>
      <h2>7. Payment</h2>
      <p>Payment is due upon completion. We accept cash, all major credit cards, Apple Pay, Google Pay, Venmo, and Zelle.</p>
      <h2>8. Insurance</h2>
      <p>${client.businessName} carries general liability insurance. In the unlikely event of accidental damage caused by our service, we will work with you to resolve the issue fairly.</p>
      <h2>Contact</h2>
      <p>Questions? <a href="mailto:${client.email}">${client.email}</a> or <a href="${PHONE_TEL}">${PHONE}</a>.</p>
    </div>
  </div>
</section>`;
  writeHtml("terms-and-conditions.html", buildPage({ head, currentPath: "/terms-and-conditions", body }));
  console.log(`  ✓ terms-and-conditions → output/terms-and-conditions.html`);
  return { file: "terms-and-conditions.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// 404
// ═════════════════════════════════════════════════════════════════════════════
export async function generate404Page() {
  const head = pageHead({
    title: `Page Not Found | ${client.businessName}`,
    description: `That page doesn't exist. Try our home page, packages, or call ${PHONE}.`,
    canonical: `${client.domain}/404`,
  });
  const body = `${heroSection({
    eyebrow: `404`,
    headline: `That page doesn't exist <em>(but we do).</em>`,
    lede: `Looks like you followed a broken link or mistyped the URL. No worries — head back home or jump straight to booking.`,
    showSlides: false,
  })}
<section class="page-content">
  <div class="container">
    <div class="page-content-body" style="max-width:680px;margin:0 auto;text-align:center">
      <h2>Where to next?</h2>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:30px 0">
        <a href="/" class="btn btn-primary">Home</a>
        <a href="/packages" class="btn btn-dark">Packages</a>
        <a href="/book-an-appointment-1696" class="btn btn-light">Book Online</a>
        <a href="${PHONE_TEL}" class="btn btn-light">Call ${PHONE}</a>
      </div>
      <p style="color:var(--muted);margin-top:30px">Or browse: <a href="/about-us">About</a> · <a href="/service-area">Service Area</a> · <a href="/blog">Blog</a> · <a href="/faq">FAQ</a> · <a href="/reviews">Reviews</a></p>
    </div>
  </div>
</section>`;
  writeHtml("404.html", buildPage({ head, currentPath: "/404", body }));
  console.log(`  ✓ 404 → output/404.html`);
  return { file: "404.html" };
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOG INDEX
// ═════════════════════════════════════════════════════════════════════════════
const PHOTO_BLOG = PHOTO_GALLERY;

export async function generateBlogIndex() {
  ensureOutputDirs();
  const postsPath = join("output", "blog", "posts.json");
  let posts = [];
  if (existsSync(postsPath)) {
    try { posts = JSON.parse(readFileSync(postsPath, "utf8")); } catch {}
  }
  posts = posts.filter((p) => p && p.slug && p.title)
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

  const description = `${client.niche} tips, guides, and how-tos from ${client.businessName}. Cost guides, ceramic vs wax, mobile vs shop — published regularly.`;
  const head = pageHead({
    title: `Blog | ${client.businessName}`,
    description, canonical: `${client.domain}/blog`,
  });

  const grid = posts.length === 0
    ? `<p style="color:var(--muted);font-size:1.1rem">New posts coming soon. Subscribe to updates by texting "BLOG" to <a href="${PHONE_SMS}">${htmlEscape(PHONE)}</a>.</p>`
    : `<div class="blog-grid">
${posts.map((p, i) => `      <a href="/blog/${p.slug}" class="blog-card">
        <div class="blog-card-img" style="background-image:url('${PHOTO_BLOG[i % PHOTO_BLOG.length]}')"></div>
        <div class="blog-card-body">
          <span class="tag">${htmlEscape(p.intent || "guide")} · ${htmlEscape(p.city || client.city)}</span>
          <h3>${htmlEscape(p.title)}</h3>
          <p>${htmlEscape((p.excerpt || `${p.title}. Honest, ${client.city}-specific guide from ${client.businessName}.`).slice(0, 140))}</p>
          <span class="more">Read more →</span>
        </div>
      </a>`).join("\n")}
    </div>`;

  const body = `${heroSection({
    eyebrow: `Blog`,
    headline: `${client.niche} <em>guides &amp; tips.</em>`,
    lede: `Real, practical answers from ${client.businessName} — cost guides, comparisons, and what to expect.`,
    showSlides: false,
  })}
<section class="blog-section">
  <div class="container">
    <div class="blog-head">
      <span class="eyebrow">Latest Posts</span>
      <h2>Honest answers about ${client.niche.toLowerCase()}.</h2>
      <p>Every post is written by the same crew that does the work. No filler, no listicles — just answers we wish someone had told us when we started.</p>
    </div>
    ${grid}
  </div>
</section>
${bigCtaSection({})}
${finalCtaSection({})}`;
  writeHtml("blog/index.html", buildPage({ head, currentPath: "/blog", body }));
  console.log(`  ✓ blog index → output/blog/index.html (${posts.length} posts)`);
  return { file: "blog/index.html" };
}

// ── Blog post template (used by blog-generator) ──────────────────────────────
export function blogPostHTML(post, allPosts) {
  const { slug, title, city = client.city, service = "detailing", intent = "guide" } = post;
  const description = post.excerpt || `${title} — practical guide from ${client.businessName}.`;
  const canonical = `${client.domain}/blog/${slug}`;
  const related = (allPosts || []).filter((p) => p.slug !== slug).slice(0, 3);
  const head = pageHead({
    title: `${title} | ${client.businessName}`,
    description, canonical,
    ogImage: PHOTO_BLOG[Math.abs(slug.length) % PHOTO_BLOG.length],
    extraJsonLd: `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org", "@type": "BlogPosting",
      headline: title, datePublished: post.publishedAt || new Date().toISOString(),
      author: { "@type": "Organization", name: client.businessName },
      publisher: { "@type": "Organization", name: client.businessName },
      mainEntityOfPage: canonical, image: PHOTO_BLOG[0],
    })}</script>${jsonLdFaq(serviceFaqs(service, city))}`,
  });
  const body = `${heroSection({
    eyebrow: `${intent} · ${city}`,
    headline: htmlEscape(title),
    lede: htmlEscape(description.slice(0, 200)),
    showSlides: false,
    slides: [PHOTO_BLOG[Math.abs(slug.length) % PHOTO_BLOG.length]],
  })}
<section class="page-content">
  <div class="container page-content-grid">
    <div class="page-content-body">
${post.contentHtml}
      <h2>Ready to book ${htmlEscape(service)}?</h2>
      <p>${htmlEscape(client.businessName)} is mobile-only — we come to you anywhere in our <a href="/service-area">central Illinois service area</a>. <a href="${PHONE_TEL}">Call ${PHONE}</a>, <a href="${PHONE_SMS}">text a photo</a>, or <a href="/book-an-appointment-1696">book online</a>.</p>
      ${related.length > 0 ? `<h2 style="margin-top:2.5em">Related reading</h2>
      <ul>
${related.map((r) => `        <li><a href="/blog/${r.slug}">${htmlEscape(r.title)}</a></li>`).join("\n")}
      </ul>` : ""}
    </div>
    <aside class="page-content-aside">
      <h4>Free Quote</h4>
      <div class="ph"><a href="${PHONE_TEL}">${htmlEscape(PHONE)}</a></div>
      <a href="/book-an-appointment-1696" class="btn btn-primary" style="width:100%;justify-content:center;margin-bottom:14px">Book Online</a>
      <a href="${PHONE_SMS}" class="btn btn-light" style="width:100%;justify-content:center;margin-bottom:24px">Text Us</a>
      <h4>Top Services</h4>
      <ul>
        <li><a href="/full-service">Full Service Detail</a></li>
        <li><a href="/ceramic">Ceramic Coating</a></li>
        <li><a href="/paint-correction">Paint Correction</a></li>
        <li><a href="/window-tint">Window Tinting</a></li>
      </ul>
    </aside>
  </div>
</section>
${bigCtaSection({ city })}
${finalCtaSection({ city })}`;
  return buildPage({ head, currentPath: `/blog/${slug}`, body });
}

// Re-exports for run.js compatibility
export const generateAllServicePages = generateServiceAliasPages;

// Shared helpers for other generators (booking, cost-calc)
export {
  pageHead, topbar, navbar, footerSection, buildPage,
  baseStyles, fontsLink, htmlEscape, phoneDigits, lowerSlug, citySlug,
  ensureOutputDirs, writeHtml, heroSection, finalCtaSection, bigCtaSection,
  PHONE, PHONE_TEL, PHONE_SMS,
};
