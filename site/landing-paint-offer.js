// Paint correction + ceramic coating ad page (Meta ads). Lead qualification,
// not booking.
//   /paint-protection-offer → output/paint-protection-offer.html
// Standalone on purpose: no site header, nav, footer or links out. noindex,
// not in the sitemap, not linked from the site. One question per screen; the
// answers go to /api/ghl-quote (same GHL pipeline as the site's quote form).
// Answer options and tags live in api/_lib/paint-offer.js; prices come from
// site/content.js. Built by `npm run build` (called from site/build.js).

import fs from "node:fs";
import path from "node:path";
import { biz, detailPackages, ceramic } from "./content.js";
import { pages } from "./pages.js";
import { pixelHead } from "./landing-headlight.js";
import { OFFER, REC, REC_LABEL, SMS_CONSENT } from "../api/_lib/paint-offer.js";

// ── Settings you may need to change ─────────────────────────────────────────
export const PO = {
  path: "paint-protection-offer",
  // ⚠ PLACEHOLDER. Finishes the qualified thank-you line:
  //   "Dom will call you from 217-600-2108 [RESPONSE TIME]."
  // e.g. "within 15 minutes" or "today". Replace, then npm run build.
  responseTime: "[RESPONSE TIME]",
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lux = detailPackages.find((p) => p.key === "lux");

const ICON = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

// Tap-to-answer screens, in order. Each auto-advances on tap.
const STEPS = [
  ["interest", "What are you looking for?"],
  ["size", "What size is your vehicle?"],
  ["paint", "How's your paint right now?"],
  ["keep", "How long will you keep it?"],
  ["timeline", "When do you want it done?"],
];
const SUB = { interest: { correction: "Remove swirls", ceramic: "Correction included", unsure: "Help me pick" } };
const TOTAL = STEPS.length + 2; // + price screen + contact

// Privacy + Terms, shown in the on-page modal. Same copy as /privacy-policy and
// /terms-and-conditions, with links turned into plain text (no exits).
function legal(p) {
  const page = pages.find((x) => x.path === p);
  const html = page.blocks.find(([t]) => t === "legal")[1];
  return html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, "$1");
}

const CSS = `
:root{--bg:#060809;--card:#101518;--field:#0a0e10;--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.16);--text:#f3f6f7;--muted:#a5b0b5;--dim:#76838a;--cy:#5cd9db;--ink:#031516;--glow:rgba(92,217,219,.35);--err:#ff9b8a;
--hf:"Bebas Neue",Impact,"Arial Narrow",sans-serif;--bf:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
*,*::before,*::after{box-sizing:border-box}[hidden]{display:none!important}
html{-webkit-text-size-adjust:100%;background:var(--bg)}
body{margin:0;min-height:100vh;min-height:100svh;background:radial-gradient(120% 55% at 85% 0%,rgba(92,217,219,.16),transparent 60%),var(--bg);color:var(--text);font:400 17px/1.5 var(--bf);-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}
img{display:block;max-width:100%;height:auto}
button{font:inherit;color:inherit}
.i{width:20px;height:20px;flex:none}
.app{max-width:560px;margin:0 auto;padding:14px 16px calc(28px + env(safe-area-inset-bottom))}
.logo{height:40px;width:auto;margin:0 auto 18px}
h1{font:400 clamp(2.4rem,10.5vw,3.5rem)/.95 var(--hf);letter-spacing:.01em;margin:0 0 10px;text-wrap:balance}
h1 em{font-style:normal;color:var(--cy)}
.trust{display:flex;gap:8px;align-items:flex-start;margin:0 0 18px;color:var(--muted);font-size:.9rem;line-height:1.4}
.trust .i{color:var(--cy);width:18px;height:18px;margin-top:1px}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:12px 16px 20px}
.bar{display:flex;align-items:center;justify-content:space-between;min-height:44px}
.back{display:inline-flex;align-items:center;gap:4px;min-height:44px;padding:0 12px 0 0;background:none;border:0;color:var(--muted);font-weight:600;font-size:.95rem;cursor:pointer}
.back .i{width:18px;height:18px}
.count{margin-left:auto;color:var(--dim);font-size:.85rem;font-variant-numeric:tabular-nums}
.prog{height:6px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin:2px 0 20px}
.prog i{display:block;height:100%;width:0;border-radius:99px;background:var(--cy);box-shadow:0 0 12px var(--glow);transition:width .35s ease}
.q h2{font:400 2.15rem/1 var(--hf);letter-spacing:.01em;margin:0 0 16px;outline:none}
.opts{display:grid;gap:10px}
.opt{display:flex;align-items:center;gap:12px;width:100%;min-height:68px;padding:12px 16px 12px 18px;border-radius:16px;border:1.5px solid var(--line2);background:var(--field);font-weight:600;font-size:1.08rem;line-height:1.25;text-align:left;cursor:pointer;touch-action:manipulation;transition:border-color .15s,background .15s,transform .1s}
.opt span{flex:1;display:grid;gap:2px}
.opt small{font-weight:400;font-size:.9rem;color:var(--muted)}
.opt .i{color:var(--dim)}
.opt:active{transform:scale(.98)}
.opt[aria-pressed=true]{border-color:var(--cy);background:rgba(92,217,219,.12)}
.opt[aria-pressed=true] .i{color:var(--cy)}
@media(hover:hover){.opt:hover{border-color:rgba(92,217,219,.6)}}
.for{margin:-8px 0 14px;color:var(--muted);font-size:.93rem}
.pcs{display:grid;gap:10px;margin:0 0 10px}
.pc{padding:14px 16px;border-radius:16px;border:1.5px solid var(--line2);background:var(--field)}
.pc.rec{border-color:var(--cy);background:rgba(92,217,219,.08);box-shadow:0 12px 30px -16px var(--glow)}
.badge{display:inline-block;margin:0 0 8px;padding:5px 9px;border-radius:99px;background:var(--cy);color:var(--ink);font:700 .66rem/1 var(--bf);letter-spacing:.14em;text-transform:uppercase}
.pc-r{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pc-r b{font-weight:600}
.nw{white-space:nowrap}
.pc-r small{display:block;color:var(--muted);font-size:.88rem;line-height:1.35;margin-top:2px}
.pr{font:400 2.3rem/1 var(--hf);letter-spacing:.01em;white-space:nowrap}
.rec .pr{color:var(--cy)}
.pc-n{margin:8px 0 0;color:var(--muted);font-size:.86rem}
.duo{grid-template-columns:1fr 1fr}
.duo .pc{padding:14px 12px}
.duo .pc-r{flex-direction:column;align-items:flex-start;gap:8px}
.fine{margin:0 0 18px;color:var(--dim);font-size:.86rem}
.ask{font:600 1.15rem/1.3 var(--bf);margin:0 0 12px}
label.f{display:grid;gap:6px;margin:0 0 14px;font-weight:600;font-size:.93rem}
.f input{width:100%;min-height:56px;padding:12px 14px;border-radius:14px;border:1.5px solid var(--line2);background:var(--field);color:var(--text);font:500 17px/1.3 var(--bf)}
.f input::placeholder{color:var(--dim)}
.f input:focus{outline:none;border-color:var(--cy);box-shadow:0 0 0 4px rgba(92,217,219,.15)}
.f input[aria-invalid=true]{border-color:var(--err)}
.consent{margin:4px 0 18px;padding:14px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.025)}
.chk{display:flex;gap:12px;align-items:flex-start;margin:0;color:var(--muted);font-size:.86rem;line-height:1.45;cursor:pointer}
.chk input{width:24px;height:24px;flex:none;margin:1px 0 0;accent-color:var(--cy)}
.docs{margin:6px 0 0 36px;color:var(--dim);font-size:.86rem}
.lnk{min-height:40px;padding:0 4px;background:none;border:0;color:var(--cy);font-weight:600;font-size:.86rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.lnk:first-child{padding-left:0}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:60px;padding:0 22px;border-radius:99px;border:1.5px solid transparent;background:var(--cy);color:var(--ink);font:700 1.08rem/1 var(--bf);text-decoration:none;cursor:pointer;touch-action:manipulation;box-shadow:0 10px 30px -10px var(--glow)}
.btn:active{transform:scale(.98)}
.btn[disabled]{opacity:.6;cursor:default}
.btn-o{background:transparent;color:var(--text);border-color:var(--line2);box-shadow:none}
.msg{min-height:1.4em;margin:12px 0 0;font-weight:600;font-size:.93rem}
.msg.err{color:var(--err)}
.done{text-align:center;padding:28px 18px}
.done h2{font:400 clamp(2.8rem,13vw,4rem)/.95 var(--hf);color:var(--cy);margin:0 0 12px;outline:none}
.done p{margin:0 auto 22px;max-width:30ch;font-size:1.12rem;color:#dbe4e7}
.btns{display:grid;gap:10px}
:focus-visible{outline:3px solid var(--cy);outline-offset:3px}
dialog{display:none;width:min(560px,calc(100% - 24px));max-height:min(80vh,720px);margin:auto;padding:0;overflow:auto;border:1px solid var(--line2);border-radius:20px;background:var(--card);color:var(--text);overscroll-behavior:contain}
dialog[open]{display:block;position:fixed;inset:0;z-index:20}
dialog::backdrop{background:rgba(0,0,0,.72)}
.dlg-h{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 20px;background:var(--card);border-bottom:1px solid var(--line)}
.dlg-h h2{font:400 1.9rem/1 var(--hf);letter-spacing:.01em;margin:0}
.x{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;border:1px solid var(--line2);background:none;cursor:pointer}
.dlg-b{padding:2px 20px 22px;color:var(--muted);font-size:.95rem}
.dlg-b h2{font:600 1rem/1.3 var(--bf);color:var(--text);margin:18px 0 4px}
.dlg-b p{margin:0}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}}
`;

// Browser code. Serialized into the page with Function#toString, so it must
// only use `D` and browser globals.
function client(D) {
  var form = document.getElementById("f"), qs = [].slice.call(form.querySelectorAll(".q"));
  var back = document.getElementById("back"), count = document.getElementById("count"), prog = document.getElementById("prog");
  var ORDER = ["interest", "size", "paint", "keep", "timeline", "answer"];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var A = {}, S = {}, cur = 0, done = false, busy = false;
  var money = function (n) { return "$" + Number(n).toLocaleString("en-US"); };

  // Hidden fields: UTMs, fbclid and the page URL.
  var q = new URLSearchParams(location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(function (k) { form.elements[k].value = q.get(k) || ""; });
  form.elements.page_url.value = location.href;

  function firstMissing() { for (var i = 0; i < ORDER.length; i++) if (!A[ORDER[i]]) return i; return ORDER.length; }
  function show(i) {
    cur = i; busy = false;
    qs.forEach(function (el, k) { el.hidden = k !== i; });
    back.hidden = i === 0;
    count.textContent = (i + 1) + " of " + qs.length;
    prog.firstChild.style.width = ((i + 1) / qs.length * 100) + "%";
    prog.setAttribute("aria-valuenow", i + 1);
    if (i === 5) prices();
    if (form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    var h = qs[i].querySelector("h2"); if (h && i) h.focus({ preventScroll: true });
  }
  // Each screen is a history entry, so the phone's back button goes back one
  // question instead of leaving the page. Entry n always holds screen n.
  function go(i) { try { history.pushState({ q: i }, ""); } catch (e) {} show(i); }
  try { history.replaceState({ q: 0 }, ""); } catch (e) {}
  window.addEventListener("popstate", function (e) {
    if (done) return;
    show(Math.min(e.state && e.state.q || 0, firstMissing()));
  });
  back.addEventListener("click", function () {
    if (history.state && history.state.q === cur) history.back(); else show(Math.max(0, cur - 1));
  });

  // Tap an answer → save it → next screen.
  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-k]");
    if (!b || busy) return;
    busy = true;
    A[b.dataset.k] = b.dataset.v;
    [].forEach.call(b.parentNode.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    setTimeout(function () { go(cur + 1); }, reduce ? 0 : 170);
  });

  // Price screen: their pick for their size, recommended option highlighted.
  function prices() {
    var si = D.sizes.indexOf(A.size), rec = D.rec[A.keep], ti = { "3yr": 0, "6yr": 1, "10yr": 2 };
    var corr = { id: "correction", name: "Paint correction", sub: "One-step. Includes a full detail + sealant.", price: D.corr[si], note: "Two-step for heavier swirls: +" + money(D.twoStep) };
    var cer = function (t) { return { id: ["3yr", "6yr", "10yr"][t], name: "Ceramic coating · " + D.tiers[t], tier: D.tiers[t], sub: "Paint correction included.", price: D.cer[si][t] }; };
    var cards = A.interest === "ceramic" ? [cer(0), cer(1), cer(2)]
      : A.interest === "correction" ? [corr]
      : [corr, cer(rec === "correction" ? 0 : ti[rec])];
    if (A.interest === "correction" && rec !== "correction") cards.push(cer(ti[rec]));
    if (A.interest === "ceramic" && rec === "correction") cards.unshift(corr);
    var r = cards.filter(function (c) { return c.id === rec; })[0];
    S.value = r.price; S.recName = D.recLabel[rec];
    S.quoted = cards.map(function (c) { return c.name + " " + money(c.price) + (c.id === rec ? " (recommended)" : "") + (c.note ? " [" + c.note + "]" : ""); }).join(" | ");
    document.getElementById("for").textContent = D.sizeLabel[si] + " · keeping it " + D.keepLabel[A.keep];
    var box = document.getElementById("cards");
    box.textContent = "";
    box.className = "pcs" + (cards.length === 2 ? " duo" : ""); // two options: side by side
    cards.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "pc" + (c.id === rec ? " rec" : "");
      el.innerHTML = (c.id === rec ? '<span class="badge">Recommended</span>' : "") +
        '<div class="pc-r"><div><b></b><small></small></div><span class="pr"></span></div>' + (c.note ? '<p class="pc-n"></p>' : "");
      var b = el.querySelector("b");
      b.textContent = c.tier ? "Ceramic coating · " : c.name;
      if (c.tier) { var t = document.createElement("span"); t.className = "nw"; t.textContent = c.tier; b.appendChild(t); } // "10-Year" never splits
      el.querySelector("small").textContent = c.sub;
      el.querySelector(".pr").textContent = money(c.price);
      if (c.note) el.querySelector(".pc-n").textContent = c.note;
      box.appendChild(el);
    });
  }

  // Privacy / Terms modal.
  var dlg = document.getElementById("dlg");
  function closeDoc() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-doc]");
    if (b) {
      dlg.querySelector("h2").textContent = b.textContent;
      var body = dlg.querySelector(".dlg-b");
      body.textContent = "";
      body.appendChild(document.getElementById("doc-" + b.dataset.doc).content.cloneNode(true));
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      dlg.scrollTop = 0;
    } else if (e.target === dlg || e.target.closest("[data-close]")) closeDoc();
  });

  function cookie(n) { var m = document.cookie.match("(^|;)\\s*" + n + "=([^;]+)"); return m ? decodeURIComponent(m[2]) : ""; }
  // Meta Lead (qualified only): browser pixel + Conversions API with one eventID.
  function lead() {
    var id = "po-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    if (window.fbq) fbq("track", "Lead", { value: S.value, currency: "USD", content_name: S.recName }, { eventID: id });
    var fbclid = form.elements.fbclid.value;
    try {
      fetch("/api/meta-capi", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({
        eventName: "Lead", eventId: id, value: S.value, currency: "USD", contentName: S.recName, url: location.href,
        fbp: cookie("_fbp"), fbc: cookie("_fbc") || (fbclid ? "fb.1." + Date.now() + "." + fbclid : "") }) });
    } catch (e) {}
  }

  function thanks(first, qualified, sms) {
    done = true;
    form.hidden = true;
    var d = document.getElementById("done");
    d.querySelector("h2").textContent = (qualified ? "Got it, " : "Thanks, ") + first + ".";
    d.querySelector("p").textContent = qualified ? "Dom will call you from " + D.phone + " " + D.responseTime + "."
      : sms ? "We saved your quote and we'll text it to you." : "We saved your quote. Dom will reach out with it.";
    // Call/text buttons exist only here, only for qualified leads.
    if (qualified) d.querySelector(".btns").appendChild(document.getElementById("contact-btns").content.cloneNode(true));
    d.hidden = false;
    d.scrollIntoView({ block: "start" });
    d.querySelector("h2").focus({ preventScroll: true });
    // Collapse this page's screens in history: one tap of back leaves.
    try { if (cur > 0) history.go(-cur); } catch (e) {}
  }
  document.getElementById("done").addEventListener("click", function (e) {
    if (e.target.closest("a[href]") && window.fbq) fbq("track", "Contact", { content_name: S.recName });
  });

  form.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true") { e.target.setAttribute("aria-invalid", "false"); document.getElementById("msg").textContent = ""; }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var m = firstMissing();
    if (m < ORDER.length) { try { history.go(m - cur); } catch (x) { show(m); } return; }
    var f = form.elements, msg = document.getElementById("msg"), btn = document.getElementById("go");
    var first = f.firstName.value.trim(), phone = f.phone.value.trim(), vehicle = f.vehicle.value.trim();
    var digits = phone.replace(/\D/g, "");
    var bad = [[f.firstName, !first], [f.phone, !(digits.length === 10 || (digits.length === 11 && digits[0] === "1"))], [f.vehicle, !vehicle]];
    bad.forEach(function (x) { x[0].setAttribute("aria-invalid", String(x[1])); });
    var wrong = bad.filter(function (x) { return x[1]; })[0];
    if (wrong) {
      msg.className = "msg err";
      msg.textContent = wrong[0] === f.phone ? "Add a 10-digit phone number." : wrong[0] === f.vehicle ? "Add your vehicle's year, make and model." : "Add your first name.";
      wrong[0].focus();
      return;
    }
    var qualified = A.answer !== "no", sms = f.sms.checked;
    btn.disabled = true; msg.className = "msg"; msg.textContent = "Sending…";
    fetch("/api/ghl-quote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: first, phone: phone, vehicle: vehicle, textMe: sms, page: location.pathname,
        offer: {
          interest: A.interest, size: A.size, paint: A.paint, keep: A.keep, timeline: A.timeline, answer: A.answer, quoted: S.quoted,
          utm_source: f.utm_source.value, utm_medium: f.utm_medium.value, utm_campaign: f.utm_campaign.value,
          utm_content: f.utm_content.value, utm_term: f.utm_term.value, fbclid: f.fbclid.value, pageUrl: f.page_url.value,
        },
      }),
    }).then(function (r) { if (!r.ok) throw r; return r.json(); })
      .then(function () { if (qualified) lead(); thanks(first, qualified, sms); })
      .catch(function () {
        btn.disabled = false; msg.className = "msg err";
        msg.textContent = "That didn't send. Check your signal and tap Get my exact quote again.";
      });
  });

  show(0);
}

function page() {
  const opt = (k, [v, l]) => `<button type="button" class="opt" data-k="${k}" data-v="${esc(v)}" aria-pressed="false"><span>${esc(l)}${SUB[k]?.[v] ? `<small>${esc(SUB[k][v])}</small>` : ""}</span>${ic("next")}</button>`;
  const screen = (i, k, h) => `<section class="q" data-q="${i}"${i ? " hidden" : ""} aria-labelledby="q${i}"><h2 id="q${i}" tabindex="-1">${h}</h2>
    <div class="opts">${OFFER[k].map((o) => opt(k, o)).join("")}</div></section>`;
  const data = {
    sizes: OFFER.size.map(([k]) => k),
    sizeLabel: OFFER.size.map(([, l]) => l),
    keepLabel: Object.fromEntries(OFFER.keep.map(([k, l]) => [k, l.replace(/^Under/, "under")])),
    rec: REC, recLabel: REC_LABEL,
    corr: lux.prices, twoStep: lux.twoStepAdd, cer: ceramic.prices, tiers: ceramic.tiers,
    phone: biz.phone, responseTime: PO.responseTime,
  };
  const fonts = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700&display=swap";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Paint Correction &amp; Ceramic Coating Quote | The Gloss Spot</title>
<meta name="description" content="Get your price for paint correction or ceramic coating at The Gloss Spot, 606 N. Country Fair Dr, Champaign.">
<meta name="robots" content="noindex, nofollow">
<meta name="format-detection" content="telephone=no, address=no, email=no, date=no">
<meta name="theme-color" content="#060809">
<link rel="icon" href="${biz.favicon}">
<link rel="preconnect" href="https://res.cloudinary.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${fonts}"></noscript>
<style>${CSS}</style>
${pixelHead()}
</head>
<body>
<div class="app">
<img class="logo" src="${biz.logo}" alt="The Gloss Spot" width="100" height="40" fetchpriority="high">
<main>
<h1>Get the swirls out. <em>Keep the shine for years.</em></h1>
<p class="trust">${ic("check")}<span>Dom does and checks every car · 606 N. Country Fair Dr, Champaign</span></p>
<form class="card" id="f" novalidate>
  <div class="bar"><button type="button" class="back" id="back" hidden>${ic("back")}Back</button><span class="count" id="count">1 of ${TOTAL}</span></div>
  <div class="prog" id="prog" role="progressbar" aria-label="Progress" aria-valuemin="1" aria-valuemax="${TOTAL}" aria-valuenow="1"><i></i></div>
  ${STEPS.map(([k, h], i) => screen(i, k, h)).join("\n  ")}
  <section class="q" data-q="5" hidden aria-labelledby="q5"><h2 id="q5" tabindex="-1">Your price</h2>
    <p class="for" id="for"></p>
    <div class="pcs" id="cards"></div>
    <p class="fine">Dom confirms the exact price when he sees your paint.</p>
    <p class="ask">Does this work for you?</p>
    <div class="opts">${OFFER.answer.map((o) => opt("answer", o)).join("")}</div></section>
  <section class="q" data-q="6" hidden aria-labelledby="q6"><h2 id="q6" tabindex="-1">Last step. Who's this quote for?</h2>
    <label class="f">First name<input name="firstName" autocomplete="given-name" autocapitalize="words" enterkeyhint="next" required></label>
    <label class="f">Mobile phone<input name="phone" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="next" required></label>
    <label class="f">Vehicle<input name="vehicle" placeholder="Year, make, model" autocapitalize="words" enterkeyhint="done" required></label>
    <div class="consent">
      <label class="chk"><input type="checkbox" name="sms"><span>${esc(SMS_CONSENT)}</span></label>
      <p class="docs"><button type="button" class="lnk" data-doc="privacy">Privacy Policy</button> · <button type="button" class="lnk" data-doc="terms">Terms</button></p>
    </div>
    <button class="btn" type="submit" id="go">Get my exact quote</button>
    <p class="msg" id="msg" role="status" aria-live="polite"></p>
  </section>
  ${["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "page_url"].map((n) => `<input type="hidden" name="${n}">`).join("")}
</form>
<section class="card done" id="done" hidden aria-live="polite"><h2 tabindex="-1"></h2><p></p><div class="btns"></div></section>
</main>
</div>
<dialog id="dlg" aria-labelledby="dlg-t"><div class="dlg-h"><h2 id="dlg-t"></h2><button type="button" class="x" data-close aria-label="Close">${ic("x")}</button></div><div class="dlg-b"></div></dialog>
<template id="doc-privacy">${legal("privacy-policy")}</template>
<template id="doc-terms">${legal("terms-and-conditions")}</template>
<template id="contact-btns"><a class="btn" href="tel:${biz.tel}">${ic("phone")}Call ${biz.phone}</a><a class="btn btn-o" href="sms:${biz.tel}">${ic("chat")}Text ${biz.phone}</a></template>
<script>(${client.toString()})(${JSON.stringify(data).replace(/</g, "\\u003c")});</script>
</body>
</html>
`;
}

export function buildPaintOffer(OUT) {
  fs.writeFileSync(path.join(OUT, `${PO.path}.html`), page());
  if (PO.responseTime.includes("[")) console.warn(`⚠ /${PO.path}: response time is still a placeholder (PO.responseTime in site/landing-paint-offer.js)`);
}
