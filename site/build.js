// The Gloss Spot site builder. Pure Node, no network, no API calls.
//   npm run build   → writes output/*.html, output/blog/*, output/assets/*,
//                     output/sitemap.xml and REDESIGN.md
// All copy lives in site/content.js and site/pages.js.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  biz, photos, beforeAfter, media, sizes, ceramicSizes, detailPackages,
  ceramic, ppf, wraps, membership, maintenance, reviews, story, howItWorks, areaLine,
  faqs, cities, posts, instagram, spotted,
} from "./content.js";
import { pages, redirectsAdded } from "./pages.js";
import { CSS } from "./styles.js";
import { clientJS } from "./client.js";
import { buildHeadlightLanding, HL } from "./landing-headlight.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "output");

// ── helpers ─────────────────────────────────────────────────────────────────
export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s) => String(s ?? "").replace(/<[^>]+>/g, "");
export const money = (n) => "$" + Number(n).toLocaleString("en-US");
const range = ([a, b]) => `${money(a)} – ${money(b)}`;
const url = (p) => `${biz.domain}/${p}`.replace(/\/$/, p ? "" : "/");
const href = (p) => (p ? `/${p}` : "/");

// ── icons (inline SVG, stroke = currentColor) ───────────────────────────────
const ICONS = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="M19 3v4M17 5h4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  drop: '<path d="M12 2.7s6 6.3 6 11.3a6 6 0 0 1-12 0c0-5 6-11.3 6-11.3z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  map: '<path d="M12 22s-8-7.6-8-13a8 8 0 0 1 16 0c0 5.4-8 13-8 13z"/><circle cx="12" cy="9" r="3"/>',
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  car: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 6v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z"/><path d="M3 13h18"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  brush: '<path d="M9.06 11.9 18.6 2.4a2 2 0 0 1 2.9 2.9l-9.5 9.6"/><path d="M7.07 14.94c-1.7 0-3 1.3-3 3 0 1.3-2.5 1.5-2 2 1.1 1.1 2.5 2 4 2 2.2 0 4-1.8 4-4 0-1.7-1.3-3-3-3z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
};
export const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;

// ── images ──────────────────────────────────────────────────────────────────
const CLD = "https://res.cloudinary.com/djp1yfsj5/image/upload/";
function cld(id, w, ar) {
  const crop = ar ? `,c_fill,g_auto,ar_${ar.replace("/", ":")}` : "";
  return `${CLD}f_auto,q_auto,w_${w}${crop}/${id}`;
}
// img(key, { ar:"4:3", widths:[480,800,1200], sizes:"...", eager, cls })
export function img(key, o = {}) {
  const p = typeof key === "string" ? photos[key] : key;
  if (!p) return "";
  const alt = esc(o.alt || p.alt);
  const loading = o.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  const cls = o.cls ? ` class="${o.cls}"` : "";
  if (p.cld) {
    const widths = o.widths || [480, 800, 1200];
    const [aw, ah] = (o.ar || "4:3").split(":").map(Number);
    const set = widths.map((w) => `${cld(p.cld, w, o.ar === "free" ? null : o.ar || "4:3")} ${w}w`).join(", ");
    const mid = widths[Math.min(1, widths.length - 1)];
    const dims = o.ar === "free" ? "" : ` width="${mid}" height="${Math.round((mid * ah) / aw)}"`;
    return `<img${cls} src="${cld(p.cld, mid, o.ar === "free" ? null : o.ar || "4:3")}" srcset="${set}" sizes="${o.sizes || "(min-width: 900px) 33vw, 100vw"}" alt="${alt}"${dims} ${loading} decoding="async">`;
  }
  const set = p.small ? ` srcset="${esc(p.small)} 600w, ${esc(p.src)} ${p.w}w" sizes="${o.sizes || "(min-width: 900px) 33vw, 100vw"}"` : "";
  const pos = p.pos ? ` style="object-position:${p.pos}"` : "";
  return `<img${cls} src="${esc(p.src)}"${set} alt="${alt}" width="${p.w}" height="${p.h}"${pos} ${loading} decoding="async">`;
}

// Background video: lazy, muted, never on save-data or reduced motion.
export function bgVideo(key, { hero = false, mobileKey = null, cls = "" } = {}) {
  const v = typeof key === "string" ? media[key] : key;
  if (!v) return "";
  const m = mobileKey && media[mobileKey];
  return `<video class="bgv${hero ? " bgv-hero" : ""}${cls ? " " + cls : ""}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-src="${esc(v.mp4)}"${m ? ` data-src-mobile="${esc(m.mp4)}"` : ""}></video>`;
}

// Photo with its real clip layered on top (clip fades in when it plays).
export function cover(key, o = {}) {
  const p = photos[key];
  return img(key, o) + (p && p.video ? bgVideo({ mp4: p.video }, { cls: "cover-v" }) : "");
}

// ── buttons ─────────────────────────────────────────────────────────────────
export const btn = {
  book: (label = "Book Now", svc = "") => `<a class="btn btn-p" href="#book"${svc ? ` data-book="${svc}"` : ""}>${icon("calendar")}<span>${label}</span></a>`,
  call: (label = "Call Now") => `<a class="btn btn-o" href="tel:${biz.tel}" data-track="call">${icon("phone")}<span>${label}</span></a>`,
  text: (label = "Text Us") => `<a class="btn btn-o" href="sms:${biz.tel}" data-track="text">${icon("chat")}<span>${label}</span></a>`,
  quote: (label = "Get a Quote", svc = "") => `<a class="btn btn-p" href="#quote"${svc ? ` data-quote="${esc(svc)}"` : ""}>${icon("camera")}<span>${label}</span></a>`,
  dir: (label = "Get Directions") => `<a class="btn btn-o" href="${biz.directionsUrl}" target="_blank" rel="noopener">${icon("map")}<span>${label}</span></a>`,
};

// ── blocks ──────────────────────────────────────────────────────────────────
const sec = (cls, inner, id = "") => `<section class="sec ${cls}"${id ? ` id="${id}"` : ""}><div class="wrap">${inner}</div></section>`;
const head = (eyebrow, h2, sub = "") => `<header class="sh reveal">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}<h2>${h2}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}</header>`;

function hero(page) {
  const h = page.hero || {};
  const ctas = (page.ctas || ["book", "call"]).map((c) =>
    c === "book" ? btn.book("Book Now", page.bookSvc || "")
    : c === "quote" ? btn.quote("Get a Quote", page.quote || "")
    : c === "call" ? btn.call()
    : c === "text" ? btn.text()
    : c === "membership" ? btn.quote("Start Membership", "Membership")
    : "").join("");
  const hp = photos[h.photo || "hero"];
  const video = h.video ? bgVideo(h.video, { hero: true, mobileKey: h.videoMobile })
    : hp && hp.video ? bgVideo({ mp4: hp.video }, { hero: true }) : "";
  return `<section class="hero${page.home ? " hero-home" : ""}">
  <div class="hero-media">${img(h.photo || "hero", { ar: "free", widths: [640, 960, 1400, 1900], sizes: "100vw", eager: true, cls: "hero-img", alt: h.alt })}${video}<div class="hero-shade"></div><div class="hero-sweep" aria-hidden="true"></div></div>
  <div class="wrap hero-in">
    <h1>${page.kicker ? `<span class="kicker">${page.kicker}</span>` : ""}<span class="h1-main">${page.h1}</span></h1>
    <p class="lead">${page.lead}</p>
    <div class="ctas">${ctas}</div>
  </div>
</section>`;
}

function benefits(b) {
  const items = (b.items || b).map(([ic, t, d]) => `<li class="ben reveal">${icon(ic, "i ben-i")}<div><h3>${t}</h3><p>${d}</p></div></li>`).join("");
  return sec("sec-ben", `${b.heading ? head(b.eyebrow || "", b.heading) : ""}<ul class="bens">${items}</ul>`);
}

function serviceCards() {
  const cards = [
    { h: "Detailing", p: "Express, Full and Lux packages.", from: 90, link: "packages", photo: "vWhiteYukon", svc: "full" },
    { h: "Ceramic + Correction", p: "Years of gloss and easy washes.", from: 1100, link: "ceramic", photo: "vCorvette", svc: "ceramic" },
    { h: "PPF / Wraps", p: "Clear armor or a whole new color.", from: 800, link: "ppf", photo: "vMatteBmw", alt: "vehicle-protection" },
  ];
  const html = cards.map((c) => `<a class="scard reveal" href="${href(c.link)}">
    <div class="scard-img">${cover(c.photo, { ar: "4:3", sizes: "(min-width: 900px) 33vw, 100vw" })}</div>
    <div class="scard-b"><h3>${c.h}</h3><p>${c.p}</p><div class="scard-f"><span class="from">from <b>${money(c.from)}</b></span><span class="go">${icon("arrow")}</span></div></div>
  </a>`).join("");
  return sec("sec-cards", `${head("What we do", "Pick your service")}<div class="scards">${html}</div>`);
}

function beforeAfterBlock(heading = "Before &amp; after") {
  if (beforeAfter.length) {
    const s = beforeAfter.map((b) => `<figure class="ba reveal"><div class="ba-frame" style="--pos:50%">
      ${img({ cld: b.after, alt: b.alt + " (after)" }, { ar: "4:3", cls: "ba-after" })}
      <div class="ba-before">${img({ cld: b.before, alt: b.alt + " (before)" }, { ar: "4:3" })}</div>
      <input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after">
      <span class="ba-tag ba-tag-b">Before</span><span class="ba-tag ba-tag-a">After</span></div><figcaption>${esc(b.alt)}</figcaption></figure>`).join("");
    return sec("sec-ba", `${head("Real results", heading, "Drag the slider.")}<div class="bas">${s}</div>`);
  }
  // No before/after pairs yet → show real recent work instead.
  const keys = ["vCorvette", "vWhiteYukon", "vMatteBmw", "vBlackYukon", "hero2", "g2", "g4", "g6"];
  const strip = keys.map((k) => `<li class="work reveal">${cover(k, { ar: "4:5", widths: [400, 700], sizes: "(min-width: 900px) 25vw, 75vw" })}</li>`).join("");
  return sec("sec-ba", `${head("Real results", "Recent work from our shop", "Every photo is a real customer car.")}<ul class="works">${strip}</ul>`);
}

function priceCard(kind, page) {
  const bookBtn = (svc, label = "Book this") => `<a class="btn btn-p btn-s" href="#book" data-book="${svc}">${icon("calendar")}<span>${label}</span></a>`;
  const quoteBtn = (svc, cls = "btn-p") => `<a class="btn ${cls} btn-s" href="#quote" data-quote="${esc(svc)}">${icon("camera")}<span>Get a Quote</span></a>`;
  const rows = (labels, vals) => `<table class="pt"><tbody>${labels.map((l, i) => `<tr><th scope="row">${l}</th><td>${vals[i]}</td></tr>`).join("")}</tbody></table>`;
  const incl = (list) => `<ul class="incl">${list.map((x) => `<li>${icon("check")}${x}</li>`).join("")}</ul>`;
  const card = (title, short, from, body, open = false, badge = "") => `<details class="pc reveal"${open ? " open" : ""}>
    <summary><div class="pc-t"><h3>${title}${badge ? ` <span class="badge">${badge}</span>` : ""}</h3><p>${short}</p></div><div class="pc-from"><small>from</small><b>${from}</b></div>${icon("chevron", "i pc-chev")}</summary>
    <div class="pc-b">${body}</div></details>`;
  const pkgCard = (pkg, open) => card(pkg.name, pkg.short, money(pkg.prices[0]),
    rows(sizes, pkg.prices.map(money)) + incl(pkg.includes) + bookBtn(pkg.key, `Book ${pkg.name}`), open, pkg.popular ? "Most booked" : "");
  switch (kind) {
    case "detail": return detailPackages.map((p) => pkgCard(p, false)).join("");
    case "express": case "full": case "lux": {
      const p = detailPackages.find((x) => x.key === kind);
      return pkgCard(p, true);
    }
    case "ceramic": {
      const tbl = `<table class="pt pt-grid"><thead><tr><th></th>${ceramic.tiers.map((t) => `<th scope="col">${t}</th>`).join("")}</tr></thead><tbody>${ceramicSizes.map((s, i) => `<tr><th scope="row">${s}</th>${ceramic.prices[i].map((v) => `<td>${money(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      return card("Ceramic Coating", "Paint correction included with every package.", money(ceramic.prices[0][0]),
        tbl + incl(ceramic.includes) + `<div class="pc-ctas">${bookBtn("ceramic", "Book Ceramic")}${quoteBtn("Ceramic Coating", "btn-o")}</div>`, true);
    }
    case "correction": {
      const lux = detailPackages.find((x) => x.key === "lux");
      return card("Paint Correction (Lux Package)", "Full detail + one-step correction and sealant.", money(lux.prices[0]),
        rows(sizes, lux.prices.map(money)) + `<p class="pc-note">Two-step correction: <b>+${money(lux.twoStepAdd)}</b>. Want it locked in for years? <a href="/ceramic">Ceramic coating</a> includes correction.</p>` + bookBtn("lux", "Book Paint Correction"), true);
    }
    case "ppf":
      return card("Paint Protection Film", ppf.note, money(ppf.packages[0].range[0]),
        rows(ppf.packages.map((p) => p.name), ppf.packages.map((p) => range(p.range))) + `<p class="pc-note">${ppf.note}</p>` + quoteBtn("Paint Protection Film"), true);
    case "wraps":
      return card("Vehicle Wraps", "Full color change or partial accents.", money(800),
        rows(wraps.rows.map((r) => r.name), wraps.rows.map((r) => (r.custom ? "Custom quote" : range(r.range)))) +
        `<table class="pt pt-extra"><tbody>${wraps.extras.map(([a, b]) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join("")}</tbody></table>` + quoteBtn("Vehicle Wrap"), true);
    case "maintenance":
      return card(maintenance.name, "4 exterior details a month, one every week.", `${money(maintenance.price)}<small>/mo</small>`,
        incl(maintenance.includes) + `<a class="btn btn-p btn-s" href="#quote" data-quote="Exterior Maintenance">${icon("sparkle")}<span>Start Exterior Plan</span></a>`, true);
    case "membership":
      return card("Gloss Membership", "Weekly wash and wax + 4 interior cleans a month.", `${money(membership.price)}<small>/mo</small>`,
        incl(membership.includes) + `<a class="btn btn-p btn-s" href="#quote" data-quote="Membership">${icon("sparkle")}<span>Start Membership</span></a>`, true);
    default: return "";
  }
}
function prices(kinds, opts = {}) {
  const list = [].concat(kinds).map((k) => priceCard(k)).join("");
  return sec("sec-prices", `${head("Prices", opts.heading || "Simple prices. Tap to expand.", opts.sub || "Your exact price shows when you pick your vehicle.")}<div class="pcs">${list}</div>`, "prices");
}

function faqBlock(list, heading = "Questions people ask") {
  const items = (typeof list === "string" ? faqs[list] : list);
  const html = items.map(([q, a]) => `<details class="faq reveal"><summary><h3>${q}</h3>${icon("chevron", "i faq-chev")}</summary><p>${a}</p></details>`).join("");
  return sec("sec-faq", `${head("FAQ", heading)}<div class="faqs">${html}</div>`, "faq");
}

function related(links, heading = "Related services") {
  const html = links.map(([p, t, d]) => `<a class="rel reveal" href="${href(p)}"><div><h3>${t}</h3><p>${d}</p></div>${icon("arrow")}</a>`).join("");
  return sec("sec-rel", `${head("", heading)}<div class="rels">${html}</div>`);
}

function steps() {
  const html = howItWorks.map((s, i) => `<li class="step reveal"><span class="step-n">${i + 1}</span>${icon(s.icon, "i step-i")}<h3>${s.title}</h3><p>${s.text}</p></li>`).join("");
  return `<section class="sec sec-steps">${bgVideo(media.shopFloor ? "shopFloor" : "lightSweep")}<div class="wrap">${head("How it works", "Book. Drop off. Pick up shining.")}<ol class="steps">${html}</ol></div></section>`;
}

function reviewCards(list) {
  return list.map((r) => `<li class="rv reveal"><div class="stars" aria-label="5 out of 5 stars">${icon("star", "i s")}${icon("star", "i s")}${icon("star", "i s")}${icon("star", "i s")}${icon("star", "i s")}</div><blockquote>${esc(r.text)}</blockquote><p class="rv-n">${esc(r.name)} <span>· Google review</span></p></li>`).join("");
}
function reviewsBlock(n = 6, heading = `${biz.reviewCount} five-star Google reviews`) {
  return sec("sec-rev", `${head("Reviews", heading, "Real reviews from the real profile.")}<ul class="rvs">${reviewCards(reviews.slice(0, n))}</ul><p class="center"><a class="btn btn-o btn-s" href="/reviews">Read them all</a> <a class="btn btn-o btn-s" href="${biz.googleReviews}" target="_blank" rel="noopener">See us on Google</a></p>`);
}

function membershipBanner() {
  return `<section class="sec sec-mem">${bgVideo(media.memberCar ? "memberCar" : "beading")}<div class="wrap mem reveal">
    <div><p class="eyebrow">Membership</p><h2>Clean every week. <span class="cy">From ${money(maintenance.price)}/mo.</span></h2>
    <ul class="incl incl-row"><li>${icon("check")}${maintenance.name}: weekly exterior detail, ${money(maintenance.price)}/mo</li><li>${icon("check")}Gloss Membership: + wax and interior cleans, ${money(membership.price)}/mo</li></ul></div>
    <div class="ctas"><a class="btn btn-p" href="/membership">${icon("sparkle")}<span>See Plans</span></a></div>
  </div></section>`;
}

function storyBlock() {
  const pic = photos.brothers
    ? img("brothers", { ar: "4:5", sizes: "(min-width: 900px) 40vw, 100vw" })
    : `<div class="bros-card">${photos.shopBay ? img("shopBay", { sizes: "(min-width: 900px) 40vw, 100vw" }) : ""}${bgVideo("shop")}<div class="bros-tag"><b>Dom &amp; Dylan</b><span>Owners, The Gloss Spot</span></div></div>`;
  return sec("sec-story", `<div class="story">
    <div class="story-pic reveal">${pic}</div>
    <div class="story-t reveal"><p class="eyebrow">Our story</p><h2>${story.heading}</h2>${story.text.map((t) => `<p>${t}</p>`).join("")}
    <p class="sig">When you pull in, you're talking to Dom.</p></div></div>`, "story");
}

function textBlock(t) {
  const paras = (t.paras || []).map((p) => `<p>${p}</p>`).join("");
  const bul = t.bullets ? `<ul class="incl">${t.bullets.map((x) => `<li>${icon("check")}${x}</li>`).join("")}</ul>` : "";
  return sec("sec-text", `<div class="txt reveal">${t.eyebrow ? `<p class="eyebrow">${t.eyebrow}</p>` : ""}<h2>${t.heading}</h2>${paras}${bul}</div>`);
}

function compareBlock(c) {
  const th = c.cols.map((x) => `<th scope="col">${x}</th>`).join("");
  const tr = c.rows.map(([h, ...v]) => `<tr><th scope="row">${h}</th>${v.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("");
  return sec("sec-cmp", `${head(c.eyebrow || "", c.heading)}<div class="cmp-wrap reveal"><table class="cmp"><thead><tr><th></th>${th}</tr></thead><tbody>${tr}</tbody></table></div>`);
}

function citiesBlock() {
  const items = cities.slice().sort((a, b) => a.minutes - b.minutes).map((c) => `<li><a href="/${c.slug}"><span>${c.name}</span><small>~${c.minutes} min</small></a></li>`).join("");
  return sec("sec-cities", `${head("Where our customers drive from", "About how far is the shop?", "Approximate drive times to 606 N. Country Fair Dr.")}<ul class="cities reveal">${items}</ul>`);
}

function galleryBlock(keys) {
  const html = keys.map((k) => `<li class="reveal">${img(k, { ar: "1:1", widths: [360, 600, 900], sizes: "(min-width: 900px) 33vw, 50vw" })}</li>`).join("");
  return sec("sec-gal", `${head("Gallery", "Real cars. Real work.", "Every photo is a customer car from our shop.")}<ul class="gal">${html}</ul>`);
}

// Cars we filmed around the county. Not our work, so the copy never says we detailed them.
function spottedBlock() {
  const html = spotted.map((k) => `<li class="reveal">${img(k, { sizes: "(min-width: 900px) 33vw, 50vw" })}</li>`).join("");
  return sec("sec-gal", `${head("Spotted in Champaign County", "Cars we've caught on camera", `Not our detail work. Just great cars we filmed around town. More on <a href="${instagram.url}" target="_blank" rel="noopener">@${instagram.handle}</a>.`)}<ul class="gal">${html}</ul>`);
}

// Instagram reels, embedded with Instagram's player (loaded only when scrolled near).
function instaBlock() {
  const items = instagram.reels.map((id) => `<li class="ig-item"><blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/${id}/?utm_source=ig_embed" data-instgrm-version="14"><a href="https://www.instagram.com/reel/${id}/" target="_blank" rel="noopener">Watch on Instagram</a></blockquote></li>`).join("");
  return sec("sec-ig", `${head("On Instagram", "Watch us work", `Real reels from <a href="${instagram.url}" target="_blank" rel="noopener">@${instagram.handle}</a>.`)}<ul class="ig-grid" data-ig>${items}</ul><p class="center"><a class="btn btn-o btn-s" href="${instagram.url}" target="_blank" rel="noopener">Follow @${instagram.handle}</a></p>`, "instagram");
}

function shopPhotos() {
  const keys = ["shopDoor", "shopFloor", "shopOffice"].filter((k) => photos[k]);
  const html = keys.map((k) => `<li class="reveal">${img(k)}</li>`).join("");
  return sec("sec-shop", `${head("The shop", "Come see the place", biz.address)}<ul class="shop">${html}</ul>`);
}

function calculatorBlock() {
  const svcOpts = detailPackages.map((p) => `<option value="${p.key}">${p.name}</option>`).join("") +
    ceramic.tiers.map((t, i) => `<option value="ceramic:${i}">Ceramic Coating, ${t}</option>`).join("");
  return sec("sec-calc", `<div class="calc reveal" data-calc>
    <label>Service<select data-calc-svc>${svcOpts}</select></label>
    <label>Vehicle<select data-calc-size>${sizes.map((s, i) => `<option value="${i}">${s}</option>`).join("")}</select></label>
    <label class="chk" data-calc-twostep hidden><input type="checkbox"> Two-step correction (+$100)</label>
    <div class="calc-out"><small>Your price</small><b data-calc-price>—</b></div>
    <a class="btn btn-p" href="#book" data-calc-book>${icon("calendar")}<span>Book this</span></a>
    <p class="muted small">PPF, wraps and membership: <a href="/ppf">PPF</a> · <a href="/car-wraps">Wraps</a> · <a href="/membership">Membership</a></p>
  </div>`, "calc");
}

function postBody(p) {
  return p.body.map(([t, v]) => {
    if (t === "h2") return `<h2>${v}</h2>`;
    if (t === "p") return `<p>${v}</p>`;
    if (t === "ul") return `<ul class="incl">${v.map((x) => `<li>${icon("check")}${x}</li>`).join("")}</ul>`;
    if (t === "table") return `<div class="cmp-wrap"><table class="cmp">${v.map((r, i) => `<tr>${r.map((c, j) => (i === 0 || j === 0 ? `<th${i === 0 ? ' scope="col"' : ' scope="row"'}>${c}</th>` : `<td>${c}</td>`)).join("")}</tr>`).join("")}</table></div>`;
    return "";
  }).join("");
}
function postBlock(p) {
  return sec("sec-post", `<article class="post txt"><p class="muted small">By Dom &amp; Dylan · <time datetime="${p.date}">${new Date(p.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></p>${postBody(p)}</article>`);
}
function postList() {
  const html = posts.map((p) => `<a class="rel reveal" href="/blog/${p.slug}"><div><h3>${p.title}</h3><p>${p.excerpt}</p></div>${icon("arrow")}</a>`).join("");
  return sec("sec-rel", `<div class="rels">${html}</div>`);
}

function contactBlock() {
  return sec("sec-contact", `<div class="contact">
    <div class="reveal"><p class="eyebrow">Visit</p><h2>${esc(biz.name)}</h2>
      <p class="nap">${esc(biz.address)}<br><a href="tel:${biz.tel}">${biz.phone}</a></p>
      <ul class="hours">${biz.hours.map((h) => `<li><span>${h.label}</span><b>${h.text}</b></li>`).join("")}</ul>
      <div class="ctas">${btn.call()}${btn.text()}${btn.dir()}</div></div>
    <div class="reveal map"><iframe title="Map to ${esc(biz.name)}" src="${biz.mapEmbed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  </div>`, "visit");
}

function legalBlock(html) { return sec("sec-text", `<div class="txt legal">${html}</div>`); }

// ── quote form + booking widget ─────────────────────────────────────────────
function quoteForm(defaultSvc) {
  const opts = ["Ceramic Coating", "Paint Protection Film", "Vehicle Wrap", "Exterior Maintenance", "Membership", "Window Tint", "Headlight Restoration", "Engine Bay Detail", "Motorcycle Detail", "Fleet / Business", "Something else"];
  return sec("sec-quote", `${head("Get a quote", "Get a price by text", "Send a photo. We'll text you back.")}
  <form class="qf reveal" data-quote-form novalidate>
    <label>Service<select name="service">${opts.map((o) => `<option${o === defaultSvc ? " selected" : ""}>${o}</option>`).join("")}</select></label>
    <label>Name<input name="name" autocomplete="name" required></label>
    <label>Phone<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required></label>
    <label>Vehicle<input name="vehicle" placeholder="Year, make, model" required></label>
    <label class="file">${icon("camera")}<span data-file-label>Add photos (optional)</span><input name="photos" type="file" accept="image/*" multiple></label>
    <label class="chk"><input type="checkbox" name="textMe" checked> Text me the quote</label>
    <label>Anything else? <small>(optional)</small><textarea name="notes" rows="2"></textarea></label>
    <button class="btn btn-p" type="submit">${icon("chat")}<span>Send for a Quote</span></button>
    <p class="form-msg" role="status" aria-live="polite"></p>
  </form>`, "quote");
}

function bookingWidget() {
  return `<section class="sec sec-book" id="book"><div class="wrap">
  ${head("Book online", "Book in 30 seconds", "Pick a service, your vehicle and a time. That's it.")}
  <form class="bk reveal" data-booking novalidate>
    <div class="bk-step is-open" data-step="1"><button type="button" class="bk-h" data-goto="1"><span class="bk-n">1</span><span class="bk-t">Service</span><span class="bk-s" data-sum="1"></span></button>
      <div class="bk-b">
        <div class="opts" role="radiogroup" aria-label="Service">
          ${detailPackages.map((p) => `<button type="button" class="opt" data-svc="${p.key}" role="radio" aria-checked="false"><b>${p.name}</b><small>${p.short}</small><em>from ${money(p.prices[0])}</em></button>`).join("")}
          <button type="button" class="opt" data-svc="ceramic" role="radio" aria-checked="false"><b>Ceramic Coating</b><small>Paint correction included.</small><em>from ${money(ceramic.prices[0][0])}</em></button>
        </div>
        <div class="tiers" data-tiers hidden><span class="muted small">Coating length:</span>${ceramic.tiers.map((t, i) => `<button type="button" class="chip" data-tier="${i}">${t}</button>`).join("")}</div>
        <p class="muted small">PPF, wraps or membership? <a href="/ppf#quote">Get a quote</a> or call <a href="tel:${biz.tel}">${biz.phone}</a>.</p>
      </div></div>
    <div class="bk-step" data-step="2"><button type="button" class="bk-h" data-goto="2"><span class="bk-n">2</span><span class="bk-t">Vehicle size</span><span class="bk-s" data-sum="2"></span></button>
      <div class="bk-b"><div class="opts opts-size" role="radiogroup" aria-label="Vehicle size" data-sizes></div>
        <label class="chk" data-twostep hidden><input type="checkbox"> Upgrade to two-step correction (+$100)</label>
        <div class="bk-price" data-price hidden></div></div></div>
    <div class="bk-step" data-step="3"><button type="button" class="bk-h" data-goto="3"><span class="bk-n">3</span><span class="bk-t">Day &amp; time</span><span class="bk-s" data-sum="3"></span></button>
      <div class="bk-b"><div class="days" data-days></div><div class="times" data-times></div><p class="muted small" data-slot-msg></p></div></div>
    <div class="bk-step" data-step="4"><button type="button" class="bk-h" data-goto="4"><span class="bk-n">4</span><span class="bk-t">Your info</span><span class="bk-s" data-sum="4"></span></button>
      <div class="bk-b">
        <label>Name<input name="name" autocomplete="name" required></label>
        <label>Phone<input name="phone" type="tel" inputmode="tel" autocomplete="tel" required></label>
        <details class="more"><summary>Add details (optional)</summary>
          <label>Email<input name="email" type="email" autocomplete="email"></label>
          <label>Vehicle<input name="vehicleInfo" placeholder="Year, make, model"></label>
          <label>Notes<textarea name="notes" rows="2" placeholder="Pet hair, stains, anything we should know"></textarea></label>
          <label class="chk"><input type="checkbox" name="textMe" checked> Text me reminders</label>
        </details>
        <div class="bk-sum" data-summary></div>
        <button class="btn btn-p btn-w" type="submit">${icon("check")}<span>Confirm Booking</span></button>
        <p class="form-msg" role="status" aria-live="polite"></p></div></div>
  </form>
  <p class="center muted small">Rather talk? <a href="tel:${biz.tel}">Call</a> or <a href="sms:${biz.tel}">text</a> ${biz.phone}.</p>
</div></section>`;
}

// ── shell ───────────────────────────────────────────────────────────────────
const NAV = [
  ["packages", "Detailing"], ["ceramic", "Ceramic"], ["paint-correction", "Correction"], ["ppf", "PPF"], ["car-wraps", "Wraps"], ["membership", "Membership"], ["reviews", "Reviews"], ["contact", "Contact"],
];
function header(page) {
  const links = NAV.map(([p, t]) => `<a href="/${p}"${page.path === p ? ' aria-current="page"' : ""}>${t}</a>`).join("");
  return `<a class="skip" href="#main">Skip to content</a>
<header class="hdr" data-hdr><div class="wrap hdr-in">
  <a class="logo" href="/" aria-label="${esc(biz.name)} home"><img src="${biz.logo}" alt="${esc(biz.name)} logo" width="150" height="60"></a>
  <nav class="nav" aria-label="Main">${links}</nav>
  <div class="hdr-ctas"><a class="btn btn-o btn-s" href="tel:${biz.tel}" data-track="call">${icon("phone")}<span>${biz.phone}</span></a><a class="btn btn-p btn-s" href="#book">${icon("calendar")}<span>Book Now</span></a></div>
  <button class="menu-b" type="button" aria-label="Open menu" aria-expanded="false" data-menu>${icon("menu")}</button>
</div>
<div class="drawer" data-drawer hidden><nav aria-label="Mobile">${links}<a href="/about-us">About</a><a href="/gallery">Gallery</a><a href="/faq">FAQ</a></nav>
  <div class="drawer-ctas">${btn.text("Text Us")}${btn.dir()}</div></div>
</header>`;
}

function footer() {
  const svc = [["packages", "Detailing"], ["ceramic", "Ceramic Coating"], ["paint-correction", "Paint Correction"], ["ppf", "Paint Protection Film"], ["car-wraps", "Vehicle Wraps"], ["membership", "Membership"], ["headlight-restoration", "Headlight Restoration $100"], ["interior-detailing-champaign-il", "Interior Detailing"], ["vehicle-protection", "Protection Guide"]];
  const info = [["about-us", "About"], ["reviews", "Reviews"], ["gallery", "Gallery"], ["faq", "FAQ"], ["cost-calculator", "Price Calculator"], ["service-area", "Service Area"], ["blog", "Blog"], ["contact", "Contact"]];
  const area = cities.slice().sort((a, b) => a.minutes - b.minutes).slice(0, 8);
  const ul = (l) => `<ul>${l.map(([p, t]) => `<li><a href="/${p}">${t}</a></li>`).join("")}</ul>`;
  return `<footer class="ftr"><div class="wrap">
  <div class="ftr-top">
    <div class="ftr-nap">
      <img src="${biz.logo}" alt="${esc(biz.name)} logo" width="150" height="60" loading="lazy">
      <p><b>${esc(biz.name)}</b><br>${esc(biz.address)}<br><a href="tel:${biz.tel}">${biz.phone}</a></p>
      <ul class="hours">${biz.hours.map((h) => `<li><span>${h.label}</span><b>${h.text}</b></li>`).join("")}</ul>
      <div class="ctas ctas-s">${btn.call("Call")}${btn.text("Text")}${btn.dir()}</div>
      ${biz.referralConfirmed ? `<p class="ref">${icon("heart")} Send a friend. You both get $25 off.</p>` : ""}
    </div>
    <div class="ftr-map"><iframe title="Map to ${esc(biz.name)}" src="${biz.mapEmbed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  </div>
  <div class="ftr-links"><div><h4>Services</h4>${ul(svc)}</div><div><h4>The Gloss Spot</h4>${ul(info)}</div><div><h4>Nearby</h4>${ul(area.map((c) => [c.slug, c.name]))}</div></div>
  <div class="ftr-b"><p>© ${new Date().getFullYear()} ${esc(biz.name)} · ${esc(biz.address)} · ${biz.phone}</p><p><a href="/privacy-policy">Privacy</a> · <a href="/terms-and-conditions">Terms</a> · ${biz.sameAs.slice(0, 2).map((s) => `<a href="${s}" target="_blank" rel="noopener">${s.includes("facebook") ? "Facebook" : "Instagram"}</a>`).join(" · ")}</p></div>
</div></footer>
<div class="sbar" aria-label="Quick actions"><a class="btn btn-o" href="tel:${biz.tel}" data-track="call">${icon("phone")}<span>Call Now</span></a><a class="btn btn-p" href="#book">${icon("calendar")}<span>Book Now</span></a></div>`;
}

// ── schema ──────────────────────────────────────────────────────────────────
export const SERVICES_SCHEMA = [
  { name: "Express Detail", low: 90, high: 145, url: "packages" },
  { name: "Full Detail", low: 225, high: 315, url: "full-service-detailing-champaign-il" },
  { name: "Lux Package (Full Detail + Paint Correction)", low: 325, high: 550, url: "paint-correction" },
  { name: "Ceramic Coating", low: 1100, high: 2550, url: "ceramic" },
  { name: "Paint Protection Film (PPF)", low: 800, high: 5500, url: "ppf" },
  { name: "Vehicle Wraps", low: 800, high: 3600, url: "car-wraps" },
  { name: "Exterior Maintenance (4 exterior details/month)", low: 149, high: 149, url: "membership", unit: "MON" },
  { name: "Gloss Membership", low: 299, high: 299, url: "membership", unit: "MON" },
];
function businessSchema() {
  return {
    "@type": "AutoDetailing", // schema.org: AutoDetailing ⊂ AutomotiveBusiness ⊂ LocalBusiness
    "@id": `${biz.domain}/#business`,
    name: biz.name,
    url: `${biz.domain}/`,
    telephone: biz.tel,
    email: biz.email,
    image: cld(photos.hero.cld, 1200),
    logo: biz.logo,
    priceRange: biz.priceRange,
    address: { "@type": "PostalAddress", streetAddress: biz.street, addressLocality: biz.city, addressRegion: biz.state, postalCode: biz.zip, addressCountry: "US" },
    openingHoursSpecification: biz.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    founder: [{ "@type": "Person", name: "Dominic Pierson" }, { "@type": "Person", name: "Dylan Pierson" }],
    areaServed: ["Champaign", "Urbana", "Savoy", "Mahomet", "Rantoul", "Champaign County"].map((n) => ({ "@type": n === "Champaign County" ? "AdministrativeArea" : "City", name: `${n}, IL` })),
    sameAs: biz.sameAs,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Detailing and protection services",
      itemListElement: SERVICES_SCHEMA.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, url: url(s.url) },
        priceSpecification: s.unit
          ? { "@type": "UnitPriceSpecification", price: s.low, priceCurrency: "USD", unitCode: s.unit }
          : { "@type": "PriceSpecification", minPrice: s.low, maxPrice: s.high, priceCurrency: "USD" },
      })),
    },
  };
}
function pageSchema(page) {
  const graph = [businessSchema()];
  const pageUrl = url(page.path);
  graph.push({ "@type": "WebPage", "@id": pageUrl + "#webpage", url: pageUrl, name: page.title, description: page.description, isPartOf: { "@id": `${biz.domain}/#website` }, about: { "@id": `${biz.domain}/#business` } });
  if (page.home) graph.push({ "@type": "WebSite", "@id": `${biz.domain}/#website`, url: `${biz.domain}/`, name: biz.name });
  if (page.service) {
    const s = page.service;
    graph.push({
      "@type": "Service", name: s.name, serviceType: s.type || s.name, url: pageUrl,
      provider: { "@id": `${biz.domain}/#business` },
      areaServed: { "@type": "City", name: "Champaign, IL" },
      ...(s.low ? { offers: { "@type": "AggregateOffer", lowPrice: s.low, highPrice: s.high, priceCurrency: "USD" } } : {}),
    });
  }
  const fq = page.faqList;
  if (fq && fq.length) graph.push({ "@type": "FAQPage", mainEntity: fq.map(([q, a]) => ({ "@type": "Question", name: strip(q), acceptedAnswer: { "@type": "Answer", text: strip(a) } })) });
  if (!page.home) {
    const crumbs = [{ name: "Home", item: `${biz.domain}/` }];
    if (page.path.startsWith("blog/")) crumbs.push({ name: "Blog", item: url("blog") });
    crumbs.push({ name: page.crumb || strip(page.h1), item: pageUrl });
    graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })) });
  }
  if (page.post) graph.push({ "@type": "BlogPosting", headline: page.post.title, datePublished: page.post.date, dateModified: page.post.date, author: { "@type": "Organization", name: biz.name }, publisher: { "@id": `${biz.domain}/#business` }, mainEntityOfPage: pageUrl, image: cld(photos.hero.cld, 1200) });
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

// ── page render ─────────────────────────────────────────────────────────────
const RENDER = {
  benefits, serviceCards, beforeAfter: beforeAfterBlock, prices, faq: faqBlock, related, steps,
  reviews: reviewsBlock, membershipBanner, story: storyBlock, text: textBlock, compare: compareBlock,
  cities: citiesBlock, gallery: galleryBlock, spotted: spottedBlock, shopPhotos, insta: instaBlock, calculator: calculatorBlock, post: postBlock,
  postList, contact: contactBlock, legal: legalBlock, quote: quoteForm,
  allReviews: () => sec("sec-rev", `<ul class="rvs rvs-all">${reviewCards(reviews)}</ul><p class="center"><a class="btn btn-o btn-s" href="${biz.googleReviews}" target="_blank" rel="noopener">See every review on Google</a></p>`),
};

function render(page, assetV) {
  const blocks = page.blocks.map(([type, arg, opt]) => {
    if (!RENDER[type]) throw new Error(`Unknown block "${type}" on ${page.path || "home"}`);
    return RENDER[type](arg, opt);
  }).join("\n");
  const quote = page.quote && !page.blocks.some(([t]) => t === "quote") ? quoteForm(page.quote) : "";
  const booking = page.noBook ? "" : bookingWidget();
  const canonical = url(page.path);
  const hp = photos[page.hero?.photo || "hero"] || photos.hero;
  const ogImg = hp.cld ? cld(hp.cld, 1200, "1.91:1") : biz.domain + hp.src;
  const preload = hp.cld
    ? `<link rel="preload" as="image" href="${cld(hp.cld, 960)}" imagesrcset="${[640, 960, 1400, 1900].map((w) => `${cld(hp.cld, w)} ${w}w`).join(", ")}" imagesizes="100vw" fetchpriority="high">`
    : `<link rel="preload" as="image" href="${hp.src}" fetchpriority="high">`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="${page.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#060809">
<meta property="og:type" content="${page.post ? "article" : "website"}">
<meta property="og:site_name" content="${esc(biz.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${biz.favicon}">
<link rel="apple-touch-icon" href="${biz.favicon}">
<link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${preload}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${assetV}">
<script type="application/ld+json">${pageSchema(page)}</script>
</head>
<body class="${page.home ? "home" : "inner"}">
${header(page)}
<main id="main">
${hero(page)}
${blocks}
${quote}
${booking}
</main>
${footer()}
<script src="/assets/site.js?v=${assetV}" defer></script>
</body>
</html>
`;
}

// ── build ───────────────────────────────────────────────────────────────────
function wordCount(page) {
  // Body copy only: hero, benefits, text, compare, price card blurbs. Excludes FAQ, booking, footer.
  const html = [page.h1, page.lead, ...page.blocks.filter(([t]) => !["faq", "prices", "reviews", "allReviews", "postList", "legal", "contact", "cities", "related"].includes(t)).map(([t, a, o]) => {
    try { return RENDER[t](a, o); } catch { return ""; }
  })].join(" ");
  return strip(html).replace(/\s+/g, " ").trim().split(" ").length;
}

export function build() {
  const errors = [];
  const seenTitles = new Map();
  const seenDesc = new Map();
  for (const p of pages) {
    const id = p.path || "/";
    if (p.title.length >= 60) errors.push(`${id}: title ${p.title.length} chars (max 59): ${p.title}`);
    if (p.description.length >= 155) errors.push(`${id}: description ${p.description.length} chars (max 154)`);
    if (!/Champaign, IL/.test(strip(p.h1) + " " + strip(p.kicker || ""))) errors.push(`${id}: H1 missing "Champaign, IL"`);
    if (seenTitles.has(p.title)) errors.push(`${id}: duplicate title with ${seenTitles.get(p.title)}`);
    if (seenDesc.has(p.description)) errors.push(`${id}: duplicate description with ${seenDesc.get(p.description)}`);
    seenTitles.set(p.title, id);
    seenDesc.set(p.description, id);
    p.faqList = (() => {
      const f = p.blocks.find(([t]) => t === "faq");
      return f ? (typeof f[1] === "string" ? faqs[f[1]] : f[1]) : null;
    })();
    if (p.service && p.maxWords && wordCount(p) > p.maxWords) errors.push(`${id}: ${wordCount(p)} body words (max ${p.maxWords})`);
  }
  if (errors.length) {
    console.error("Build checks failed:\n  " + errors.join("\n  "));
    process.exit(1);
  }

  fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "blog"), { recursive: true });

  const data = {
    calendarId: biz.ghlCalendarId, phone: biz.phone, tel: biz.tel, chatWidgetId: biz.ghlChatWidgetId,
    sizes, ceramicSizes,
    packages: detailPackages.map(({ key, name, prices, hours, twoStepAdd }) => ({ key, name, prices, hours, twoStepAdd })),
    ceramic: { tiers: ceramic.tiers, prices: ceramic.prices, hours: ceramic.hours },
  };
  const js = clientJS(data);
  const assetV = crypto.createHash("sha1").update(CSS + js).digest("hex").slice(0, 8);
  fs.writeFileSync(path.join(OUT, "assets", "site.css"), CSS);
  fs.writeFileSync(path.join(OUT, "assets", "site.js"), js);

  for (const p of pages) {
    const file = p.file || (p.path ? `${p.path}.html` : "index.html");
    fs.writeFileSync(path.join(OUT, file), render(p, assetV));
  }

  // sitemap
  const today = new Date().toISOString().slice(0, 10);
  const sm = pages.filter((p) => !p.noindex && !p.noSitemap).map((p) => `  <url><loc>${url(p.path)}</loc><lastmod>${today}</lastmod><priority>${p.priority ?? (p.home ? "1.0" : p.service ? "0.9" : "0.6")}</priority></url>`);
  // Keep the untouched funnel pages in the sitemap, as before.
  sm.push(`  <url><loc>${url(HL.path)}</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`);
  ["review", "feedback"].forEach((s) => sm.push(`  <url><loc>${url(s)}</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>`));
  fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sm.join("\n")}\n</urlset>\n`);

  // posts.json (kept for the blog generator / anything that reads it)
  fs.writeFileSync(path.join(OUT, "blog", "posts.json"), JSON.stringify(posts.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, publishedAt: p.date + "T10:00:00Z", url: `/blog/${p.slug}` })), null, 2) + "\n");

  buildHeadlightLanding(OUT);
  writeDeliverables();
  console.log(`Built ${pages.length} pages → output/ (assets v${assetV})`);
}

// ── deliverables doc (REDESIGN.md) ──────────────────────────────────────────
function writeDeliverables() {
  const L = [];
  L.push("# The Gloss Spot: Website Redesign Deliverables", "");
  L.push("_Generated by `npm run build` from `site/content.js` + `site/pages.js`. Edit those files, not this one._", "");
  L.push("## 1. Sitemap: old URL → new URL", "");
  L.push("Every existing URL keeps its page (1:1). Nothing moved, so no new 301s are needed for old pages. All existing redirects in `vercel.json` are unchanged.", "");
  L.push("| Old URL | New URL | Page |", "|---|---|---|");
  for (const p of pages) {
    const u = "/" + p.path;
    L.push(`| ${p.isNew ? "_(new page)_" : u} | ${u} | ${strip(p.crumb || p.h1)} |`);
  }
  ["review", "feedback"].forEach((s) => L.push(`| /${s} | /${s} | Review funnel (unchanged) |`));
  if (redirectsAdded.length) L.push("", "New redirects added: " + redirectsAdded.map(([a, b]) => `\`${a}\` → \`${b}\``).join(", "));
  L.push("", "## 2. Page copy (title, meta description, H1, then body)", "");
  for (const p of pages) {
    L.push(`### /${p.path}`, "");
    L.push(`- **Title** (${p.title.length}): ${p.title}`);
    L.push(`- **Meta** (${p.description.length}): ${p.description}`);
    L.push(`- **H1:** ${strip((p.kicker ? p.kicker + " · " : "") + p.h1)}`);
    L.push(`- **Hero line:** ${strip(p.lead)}`);
    L.push(`- **Buttons:** ${(p.ctas || ["book", "call"]).map((c) => ({ book: "Book Now", call: "Call Now", quote: "Get a Quote", text: "Text Us", membership: "Start Membership" })[c]).join(" · ")}`);
    if (p.service && p.maxWords) L.push(`- **Body words:** ${wordCount(p)} (limit ${p.maxWords}, FAQ excluded)`);
    L.push("");
    for (const [t, a] of p.blocks) {
      if (t === "benefits") (a.items || a).forEach(([, h, d]) => L.push(`- **${strip(h)}**: ${strip(d)}`));
      if (t === "text") { L.push(`**${strip(a.heading)}**`, ""); (a.paras || []).forEach((x) => L.push(strip(x), "")); (a.bullets || []).forEach((x) => L.push(`- ${strip(x)}`)); }
      if (t === "compare") { L.push(`**${strip(a.heading)}**`, "", `| | ${a.cols.join(" | ")} |`, `|---|${a.cols.map(() => "---").join("|")}|`); a.rows.forEach((r) => L.push(`| ${r.map(strip).join(" | ")} |`)); }
      if (t === "prices") L.push(`- _Price cards: ${[].concat(a).join(", ")}_`);
      if (t === "post") { a.body.forEach(([k, v]) => L.push(k === "h2" ? `**${v}**` : k === "p" ? strip(v) : k === "ul" ? v.map((x) => `- ${strip(x)}`).join("\n") : "_(price table)_")); }
    }
    if (p.faqList) { L.push("", "**FAQ** (with FAQPage schema)", ""); p.faqList.forEach(([q, a]) => L.push(`- **${q}** ${a}`)); }
    L.push("");
  }
  L.push("## 3. Booking flow", "", "Embedded at `#book` on every page. No redirect, no pop-up. Book Now buttons scroll to it and preselect the service.", "");
  L.push("1. **Service:** Express · Full · Lux · Ceramic (then pick 3/6/10-year). Link to a quote for PPF, wraps or membership.");
  L.push("2. **Vehicle size:** Coupe · Sedan · SUV/Truck · Large 3-Row SUV (ceramic: Minivan/Large SUV/Truck). Price shows instantly. Lux gets a +$100 two-step toggle.");
  L.push("3. **Day & time:** live open slots from the GHL calendar (`/api/ghl-free-slots`), next 14 days. If slots can't load, it shows call/text.");
  L.push("4. **Name + phone** (required). Optional, collapsed: email, year/make/model, notes, \"Text me reminders\" (on by default).");
  L.push("", "Submit → `/api/ghl-create-booking`: upserts the GHL contact (tags `website-booking`, service, `prefers-text`) and books the appointment.", "");
  L.push("**Quote form** (`#quote` on Ceramic, PPF, Wraps, Membership and quote-only pages): service, name, phone, vehicle, up to 3 photos (compressed in the browser), \"Text me the quote\" (on by default), optional notes → `/api/ghl-quote` (GHL contact + note with photo links).", "");
  L.push("## 4. Schema", "", "Every page carries one JSON-LD `@graph`: `AutoDetailing` (a LocalBusiness/AutomotiveBusiness subtype) with NAP, hours, price range, founders, area served and an `OfferCatalog` of every service with prices; plus `WebPage`, `BreadcrumbList`, `Service` (service pages), `FAQPage` (pages with FAQs) and `BlogPosting` (posts). Homepage example:", "");
  const home = pages.find((p) => p.home);
  L.push("```json", JSON.stringify(JSON.parse(pageSchema(home)), null, 2), "```", "");
  L.push("## 5. Open items for Dylan & Dom", "");
  L.push("- **Confirm ZIP (61821) and hours** match Google Business Profile exactly (`site/content.js` → `biz`).");
  L.push("- **Alt text:** this build couldn't open the photos. Replace the generic alts in `photos` with the real car + service (e.g. \"ceramic coated black F-150 Champaign IL\").");
  L.push("- **Before/after pairs:** add Cloudinary IDs to `beforeAfter`. Until then the slider spot shows recent work.");
  L.push("- **Brothers photo:** set `photos.brothers`. Until then the story shows the shop bay photo.");
  L.push("- **Referral offer:** hidden until confirmed (`biz.referralConfirmed`).");
  L.push("- **Quote-only pages** (window tint, headlight, engine, motorcycle, fleet/B2B): confirm you still offer these. If not, 301 them to the closest page.");
  L.push("- **Videos:** OpenArt loops are hotlinked from OpenArt's CDN (see `site/media.js`). Move them to Cloudinary for long-term hosting.");
  L.push("- **Shop photos** are served from OpenArt originals (~0.8 MB each, lazy-loaded). Upload them to Cloudinary for faster loads.");
  fs.writeFileSync(path.join(ROOT, "REDESIGN.md"), L.join("\n") + "\n");
}

build();
