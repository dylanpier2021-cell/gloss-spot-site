// Headlight restoration landing page ($100 offer) + its thank-you page.
//   /headlight-restoration          → output/headlight-restoration.html
//   /headlight-restoration/booked   → output/headlight-restoration/booked.html
// Standalone and lean on purpose: no main-site nav, CSS or JS. Built by
// `npm run build` (called from site/build.js). Edit the copy here.

import fs from "node:fs";
import path from "node:path";
import { biz } from "./content.js";

// ── Settings you may need to change ─────────────────────────────────────────
export const HL = {
  path: "headlight-restoration",
  bookedPath: "headlight-restoration/booked",
  price: 100,
  pixelId: "1386818502603317",
  name: "The Gloss Spot Auto Detailing",
  // GHL booking widget. Currently the main "The Gloss Spot Auto Detailing"
  // calendar. To use a dedicated headlight calendar, paste its widget URL
  // here (GHL → Calendars → ⋯ → Share → Embed → the iframe `src`).
  calendarSrc: "https://api.leadconnectorhq.com/widget/booking/pR5kB7NNiIu7tnoGPBI5",
  // Swap these files for real photos (same names, ~1200px wide JPGs).
  beforeAfter: [
    { before: "/images/headlights/before-1.jpg", after: "/images/headlights/after-1.jpg", alt: "Foggy yellow headlight before and clear headlight after restoration at The Gloss Spot, Champaign IL" },
  ],
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const PAGE_URL = `${biz.domain}/${HL.path}`;
const BOOKED_URL = `${biz.domain}/${HL.bookedPath}`;
const ADDR = "606 N. Country Fair Dr, Champaign, IL";
const MAPS = biz.directionsUrl;

const FAQ = [
  ["How long does headlight restoration take?", "Usually about an hour for both headlights. Drop your car off and it's done today."],
  ["Does headlight restoration last?", "Yes. After we sand off the oxidized layer and polish them clear, we seal both lenses with UV protection so they stay clear longer than a quick polish."],
  ["Do I need an appointment?", "Booking a time below holds your spot with Dom. Want to check for an opening today? Call 217-600-2108."],
  ["What if my headlights are cracked?", "Restoration clears foggy, yellow lenses. It can't fix cracks or moisture inside the headlight. Dom will look at yours and tell you before he starts."],
];

// Meta Pixel standard base code + PageView. `extra` runs right after init.
function pixelHead(extra = "") {
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${HL.pixelId}');
fbq('track', 'PageView');${extra}
</script>
<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${HL.pixelId}&ev=PageView&noscript=1"></noscript>
<!-- End Meta Pixel Code -->`;
}

const ICON = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  map: '<path d="M12 22s-8-7.6-8-13a8 8 0 0 1 16 0c0 5.4-8 13-8 13z"/><circle cx="12" cy="9" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  spark: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

const CSS = `
:root{--bg:#060809;--bg2:#0d1215;--card:#11171a;--line:rgba(255,255,255,.1);--text:#f3f6f7;--muted:#a5b0b5;--cy:#62DBDD;--ink:#041516}
*,*::before,*::after{box-sizing:border-box}[hidden]{display:none!important}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:400 17px/1.55 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding-bottom:84px}
img{display:block;max-width:100%;height:auto}a{color:var(--cy)}
.w{max-width:760px;margin:0 auto;padding:0 18px}
.i{width:20px;height:20px;flex:none}
h1,h2{font-family:"Bebas Neue",Impact,"Arial Narrow",sans-serif;font-weight:400;line-height:.95;margin:0;letter-spacing:.01em}
h2{font-size:clamp(2.1rem,7vw,3rem);margin-bottom:18px}
.top{padding:14px 0}.top img{height:40px;width:auto}
.hero{padding:28px 0 40px;background:radial-gradient(120% 80% at 80% 0%,rgba(98,219,221,.18),transparent 60%)}
.hero h1{font-size:clamp(2.9rem,12vw,5rem);margin:6px 0 14px}.hero h1 b{color:var(--cy);font-weight:400}
.hero p{font-size:1.15rem;color:#dbe4e7;margin:0 0 24px;max-width:30ch}
.btns{display:grid;gap:12px}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:0 22px;border-radius:999px;font:700 1.05rem/1 Inter,system-ui,sans-serif;text-decoration:none;border:1.5px solid transparent;cursor:pointer}
.btn-p{background:var(--cy);color:var(--ink);box-shadow:0 10px 30px -10px rgba(98,219,221,.6)}
.btn-o{background:transparent;color:var(--text);border-color:rgba(255,255,255,.25)}
@media(min-width:620px){.btns{grid-template-columns:1fr 1fr;max-width:520px}}
.badges{display:flex;flex-wrap:wrap;gap:8px 16px;margin:20px 0 0;padding:0;list-style:none;color:var(--muted);font-size:.93rem}
.badges li{display:flex;gap:6px;align-items:center}.badges .i{color:var(--cy);width:17px;height:17px}
section{padding:44px 0}.alt{background:var(--bg2)}
.ba{position:relative;aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:var(--card);--pos:50%;margin-bottom:16px}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ba .b{clip-path:inset(0 calc(100% - var(--pos)) 0 0)}
.ba::after{content:"";position:absolute;top:0;bottom:0;left:var(--pos);width:3px;margin-left:-1.5px;background:var(--cy);box-shadow:0 0 16px rgba(98,219,221,.7)}
.ba input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize}
.tag{position:absolute;top:10px;padding:5px 10px;border-radius:999px;background:rgba(0,0,0,.65);font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;z-index:1}
.tag.l{left:10px}.tag.r{right:10px;color:var(--cy)}
.list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.list li{display:flex;gap:14px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.list .i{width:40px;height:40px;padding:9px;border-radius:10px;background:rgba(98,219,221,.12);color:var(--cy)}
.list b{display:block;font-size:1.05rem}.list span{color:var(--muted);font-size:.95rem}
.steps{counter-reset:s}.steps li::before{counter-increment:s;content:counter(s);flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--cy);color:var(--ink);font-weight:800}
.cal-wrap{background:#fff;border-radius:18px;overflow:hidden;min-height:640px}
.cal-wrap iframe{display:block;width:100%;min-height:900px;border:0}
.note{color:var(--muted);font-size:.93rem;margin-top:12px}
details{background:var(--card);border:1px solid var(--line);border-radius:14px;margin-bottom:10px}
summary{cursor:pointer;list-style:none;padding:16px 18px;font-weight:600;min-height:56px;display:flex;align-items:center}
summary::-webkit-details-marker{display:none}details p{margin:0;padding:0 18px 16px;color:var(--muted)}
footer{padding:36px 0 24px;border-top:1px solid var(--line);color:var(--muted);font-size:.95rem}
footer b{color:var(--text)}footer .btns{margin:16px 0}
.hours{list-style:none;padding:0;margin:10px 0}
.sbar{position:fixed;left:0;right:0;bottom:0;z-index:20;display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(6,8,9,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--line)}
.sbar .btn{min-height:52px}
@media(min-width:900px){.sbar{display:none}body{padding-bottom:0}}
.done{text-align:center}.done .big{font-size:clamp(3rem,13vw,5.4rem);color:var(--cy)}
.when{display:inline-block;margin:6px 0 20px;padding:14px 18px;border:1px solid rgba(98,219,221,.4);border-radius:14px;background:rgba(98,219,221,.08);font-weight:600}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

const head = (title, desc, canonical, extraHead) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#060809">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${biz.domain}${HL.beforeAfter[0].after}">
<link rel="icon" href="${biz.favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800&display=swap">
<style>${CSS}</style>
${extraHead}
</head>`;

const top = `<header class="top"><div class="w"><a href="/" aria-label="${esc(HL.name)} home"><img src="${biz.logo}" alt="${esc(HL.name)} logo" width="150" height="60"></a></div></header>`;

const footer = `<footer><div class="w">
  <p><b>${esc(HL.name)}</b><br>${ADDR}<br><a href="tel:${biz.tel}" data-ev="Contact">${biz.phone}</a></p>
  <ul class="hours">${biz.hours.map((h) => `<li>${h.label}: <b>${h.text}</b></li>`).join("")}</ul>
  <div class="btns"><a class="btn btn-o" href="${MAPS}" target="_blank" rel="noopener">${ic("map")}Open in Google Maps</a><a class="btn btn-o" href="tel:${biz.tel}" data-ev="Contact">${ic("phone")}Call ${biz.phone}</a></div>
  <p><a href="/">More services at The Gloss Spot</a> · <a href="/privacy-policy">Privacy</a></p>
</div></footer>`;

function schema() {
  const g = [
    {
      "@type": "AutoDetailing", // ⊂ AutomotiveBusiness ⊂ LocalBusiness
      "@id": `${biz.domain}/#business`,
      name: HL.name,
      url: `${biz.domain}/`,
      telephone: biz.tel,
      image: biz.logo,
      address: { "@type": "PostalAddress", streetAddress: biz.street, addressLocality: biz.city, addressRegion: biz.state, postalCode: biz.zip, addressCountry: "US" },
      openingHoursSpecification: biz.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
      priceRange: biz.priceRange,
    },
    {
      "@type": "Service",
      name: "Headlight Restoration",
      serviceType: "Headlight restoration",
      description: "Both headlights sanded to remove oxidation, polished clear and sealed with UV protection. Done today.",
      url: PAGE_URL,
      provider: { "@id": `${biz.domain}/#business` },
      areaServed: { "@type": "City", name: "Champaign, IL" },
      offers: { "@type": "Offer", price: HL.price, priceCurrency: "USD", url: PAGE_URL, availability: "https://schema.org/InStock", description: "Headlight restoration, both headlights" },
    },
    { "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": g });
}

// Shared tracking helpers (both pages). Schedule fires at most once per
// booking: an eventID is made when the visitor taps Book and reused for the
// iframe message, the thank-you page and the server (CAPI) copy, so Meta
// deduplicates, and a sessionStorage flag stops a second browser fire.
const TRACK_JS = `
var GS_HL={price:${HL.price},name:"Headlight Restoration"};
function gsStore(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
function gsEventId(){var id=gsStore("hl_event_id");if(!id){id="hl-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);gsStore("hl_event_id",id)}return id}
function gsCookie(n){var m=document.cookie.match("(^|;)\\\\s*"+n+"=([^;]+)");return m?decodeURIComponent(m[2]):""}
function gsSchedule(source,value){
  var v=+value||GS_HL.price;
  if(gsStore("hl_schedule_fired")==="1")return;
  var id=gsEventId();gsStore("hl_schedule_fired","1");
  if(window.fbq)fbq("track","Schedule",{value:v,currency:"USD",content_name:GS_HL.name},{eventID:id});
  try{fetch("/api/meta-capi",{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:JSON.stringify({eventName:"Schedule",eventId:id,value:v,currency:"USD",contentName:GS_HL.name,url:location.href,fbp:gsCookie("_fbp"),fbc:gsCookie("_fbc"),source:source})})}catch(e){}
}
document.addEventListener("click",function(e){
  var a=e.target.closest("[data-ev]");if(!a||!window.fbq)return;
  if(a.dataset.ev==="Lead")fbq("track","Lead",{value:GS_HL.price,currency:"USD",content_name:GS_HL.name},{eventID:gsEventId()+"-lead"});
  if(a.dataset.ev==="Contact")fbq("track","Contact",{content_name:GS_HL.name});
});
`;

function landing() {
  const [ba] = HL.beforeAfter;
  const book = (label = "Book My Spot") => `<a class="btn btn-p" href="#book" data-ev="Lead">${ic("cal")}${label}</a>`;
  const call = (label = `Call ${biz.phone}`) => `<a class="btn btn-o" href="tel:${biz.tel}" data-ev="Contact">${ic("phone")}${label}</a>`;
  const sliders = HL.beforeAfter.map((p, i) => `<div class="ba">
      <img src="${p.after}" alt="${esc(p.alt)} (after)" width="1200" height="900" loading="lazy" decoding="async">
      <img class="b" src="${p.before}" alt="${esc(p.alt)} (before)" width="1200" height="900" loading="lazy" decoding="async">
      <span class="tag l">Before</span><span class="tag r">After</span>
      <input type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after, photo ${i + 1}">
    </div>`).join("");
  return `${head("Headlight Restoration Champaign IL | $100 | The Gloss Spot",
    "Foggy or yellow headlights? We restore both headlights to clear for $100 at our shop on Country Fair Dr in Champaign. Book online today.",
    PAGE_URL,
    `<script type="application/ld+json">${schema()}</script>\n${pixelHead()}`)}
<body>
${top}
<main>
<section class="hero"><div class="w">
  <h1>Headlight Restoration in Champaign · <b>$100</b></h1>
  <p>Foggy, yellow headlights restored to clear. Both headlights. Done today.</p>
  <div class="btns">${book()}${call()}</div>
  <ul class="badges"><li>${ic("check")}Both headlights</li><li>${ic("check")}UV sealed</li><li>${ic("check")}Dom does every car himself</li></ul>
</div></section>

<section><div class="w">
  <h2>Before &amp; after</h2>
  ${sliders}
  <p class="note">Drag the line to compare.</p>
</div></section>

<section class="alt"><div class="w">
  <h2>Why it matters</h2>
  <ul class="list">
    <li>${ic("spark")}<div><b>Makes your car look newer</b><span>Cloudy lenses age a car fast. Clear ones take years off.</span></div></li>
    <li>${ic("sun")}<div><b>Brighter, safer night driving</b><span>More light gets through, so you see more of the road.</span></div></li>
    <li>${ic("shield")}<div><b>UV sealed so it stays clear</b><span>We sand off the oxidized layer, polish to clear, then seal.</span></div></li>
  </ul>
</div></section>

<section><div class="w">
  <h2>How it works</h2>
  <ol class="list steps">
    <li><div><b>Book online</b><span>Pick a time below. Takes 30 seconds.</span></div></li>
    <li><div><b>Drop off</b><span>${ADDR}. You'll talk to Dom.</span></div></li>
    <li><div><b>Pick up with clear headlights</b><span>Both headlights, done today.</span></div></li>
  </ol>
</div></section>

<section class="alt" id="book"><div class="w">
  <h2>Pick a time. $100, both headlights.</h2>
  <div class="cal-wrap">
    <!-- GHL CALENDAR EMBED: the iframe below is built from HL.calendarSrc in
         site/landing-headlight.js. To use a different calendar, change that
         URL and run npm run build. UTM params are appended by script below. -->
    <iframe id="${HL.calendarSrc.split("/").pop()}_hl" data-hl-cal title="Book headlight restoration" data-src="${HL.calendarSrc}" scrolling="no" style="width:100%;border:none;overflow:hidden"></iframe>
  </div>
  <p class="note">Rather call? <a href="tel:${biz.tel}" data-ev="Contact">${biz.phone}</a>. Dom does every car himself.</p>
</div></section>

<section><div class="w">
  <h2>Questions</h2>
  ${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
</div></section>
</main>
${footer}
<div class="sbar">${book("Book")}${call("Call")}</div>
<script>
${TRACK_JS}
// Before/after sliders
document.querySelectorAll(".ba input").forEach(function(r){r.addEventListener("input",function(){r.parentNode.style.setProperty("--pos",r.value+"%")})});
// Calendar iframe: pass UTMs / click IDs through so bookings keep their source.
(function(){
  var f=document.querySelector("[data-hl-cal]");if(!f)return;
  var src=new URL(f.dataset.src),q=new URLSearchParams(location.search);
  ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","fbclid","gclid"].forEach(function(k){if(q.get(k))src.searchParams.set(k,q.get(k))});
  if(!q.get("utm_source"))src.searchParams.set("utm_source","website");
  if(!q.get("utm_campaign"))src.searchParams.set("utm_campaign","headlight-restoration");
  // Remember UTMs for the thank-you page.
  gsStore("hl_utm",src.search);
  var load=function(){if(f.src)return;f.src=src.toString();
    // GHL's helper: auto-height + lets the booking redirect open the full page.
    var s=document.createElement("script");s.src="https://link.msgsndr.com/js/form_embed.js";s.async=true;document.body.appendChild(s)};
  if("IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();load()}},{rootMargin:"800px"});io.observe(f)}else load();
  document.querySelectorAll('a[href="#book"]').forEach(function(a){a.addEventListener("click",load)});
})();
// GHL iframe messages: resize, and fire Schedule if it reports a finished booking.
window.addEventListener("message",function(e){
  if(!/leadconnectorhq\\.com|msgsndr\\.com|gohighlevel\\.com/.test(e.origin||""))return;
  var d=e.data,s="";try{s=typeof d==="string"?d:JSON.stringify(d)}catch(x){}
  var f=document.querySelector("[data-hl-cal]");
  if(Array.isArray(d)&&d[0]==="highlevel.setHeight"&&d[1]&&d[1].height&&f)f.style.minHeight=Math.max(640,+d[1].height)+"px";
  if(/booking[-_ ]?(complete|success|confirmed|booked)|appointment[-_ ]?(booked|created|scheduled)|msgsndr-booking-complete/i.test(s))gsSchedule("iframe");
});
</script>
</body>
</html>
`;
}

function booked() {
  return `${head("You're Booked | Headlight Restoration | The Gloss Spot",
    "Your headlight restoration at The Gloss Spot in Champaign is booked.",
    BOOKED_URL,
    `<meta name="robots" content="noindex, nofollow">\n${pixelHead()}`)}
<body>
${top}
<main>
<section class="hero done"><div class="w">
  <h1 class="big">You're booked!</h1>
  <p style="margin:0 auto 10px" id="what">Headlight restoration · both headlights · $100</p>
  <div class="when" id="when">Your time is in your confirmation text and email.</div>
  <p style="margin:0 auto 20px;max-width:34ch">Drop off at <b>${ADDR}</b>. Dom will take it from there.</p>
  <div class="btns" style="margin:0 auto 14px">
    <a class="btn btn-p" href="${MAPS}" target="_blank" rel="noopener">${ic("map")}Get Directions</a>
    <a class="btn btn-o" href="tel:${biz.tel}" data-ev="Contact">${ic("phone")}Call ${biz.phone}</a>
  </div>
  <div class="btns" id="addcal" hidden style="margin:0 auto">
    <a class="btn btn-o" id="gcal" target="_blank" rel="noopener">${ic("cal")}Add to Google Calendar</a>
    <a class="btn btn-o" id="ical" download="gloss-spot-headlights.ics">${ic("cal")}Add to Apple / Outlook</a>
  </div>
</div></section>
</main>
${footer}
<script>
${TRACK_JS}
// Fire Schedule once (shares the eventID from the landing page if this is the same visit).
(function(){var q=new URLSearchParams(location.search),n=q.get("n"),v=+q.get("value")||GS_HL.price;
  if(n==="1")document.getElementById("what").textContent="Headlight restoration · 1 headlight · $"+v;
  gsSchedule("thank-you",v);})();
// Show the appointment time if GHL passed it in the redirect URL.
(function(){
  var q=new URLSearchParams(location.search),raw="";
  ["appointment_start_time","start_time","startTime","appointment_date","date","time","datetime"].some(function(k){raw=q.get(k)||"";return !!raw});
  if(!raw)return;
  var d=/^\\d+$/.test(raw)?new Date(+raw):new Date(raw.indexOf("T")>-1?raw:raw.replace(" ","T"));
  if(isNaN(d))return;
  document.getElementById("when").textContent=d.toLocaleString("en-US",{weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit",timeZone:"America/Chicago"});
  var end=new Date(d.getTime()+60*60*1000),z=function(x){return x.toISOString().replace(/[-:]/g,"").replace(/\\.\\d{3}/,"")};
  var title="Headlight restoration at The Gloss Spot",loc="${ADDR}";
  document.getElementById("gcal").href="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(title)+"&dates="+z(d)+"/"+z(end)+"&location="+encodeURIComponent(loc)+"&details="+encodeURIComponent("Both headlights, $100. Questions? ${biz.phone}");
  var ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//The Gloss Spot//EN","BEGIN:VEVENT","UID:"+gsEventId()+"@theglossspotil.com","DTSTAMP:"+z(new Date()),"DTSTART:"+z(d),"DTEND:"+z(end),"SUMMARY:"+title,"LOCATION:"+loc.replace(/,/g,"\\\\,"),"DESCRIPTION:Both headlights\\\\, $100. Questions? ${biz.phone}","END:VEVENT","END:VCALENDAR"].join("\\r\\n");
  document.getElementById("ical").href="data:text/calendar;charset=utf-8,"+encodeURIComponent(ics);
  document.getElementById("addcal").hidden=false;
})();
</script>
</body>
</html>
`;
}

// ── /book-headlights: straight-to-booking page ─────────────────────────────
// One screen: how many headlights (price shows) → day → time → name + phone →
// Book. Uses the site's own GHL booking API (same calendar as the main site),
// then sends the visitor to the thank-you page, which fires Schedule.
export const BOOK = {
  path: "book-headlights",
  options: [
    { n: 2, label: "Both headlights", price: 100 },
    { n: 1, label: "1 headlight", price: 50 },
  ],
  hours: 1, // appointment length used to find open times
  calendarId: biz.ghlCalendarId,
};

function bookPage() {
  const opts = BOOK.options.map((o, i) => `<button type="button" class="opt" data-n="${o.n}" data-price="${o.price}" aria-pressed="${i === 0}"><b>${o.label}</b><em>$${o.price}</em></button>`).join("");
  return `${head("Book Headlight Restoration | Champaign IL | The Gloss Spot",
    "Book headlight restoration in Champaign, IL: 1 headlight $50, both $100. Pick a time and you're booked.",
    `${biz.domain}/${BOOK.path}`,
    `<meta name="robots" content="noindex, follow">\n<style>
.bk{display:grid;gap:22px;margin-top:6px}
.bk>*{min-width:0}
.lbl{font-weight:700;margin:0 0 10px;display:flex;align-items:center;gap:10px}
.lbl span{width:28px;height:28px;border-radius:50%;background:var(--cy);color:var(--ink);display:grid;place-items:center;font-size:.9rem}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opt,.chip{font:inherit;color:var(--text);background:var(--card);border:1.5px solid rgba(255,255,255,.18);border-radius:14px;cursor:pointer}
.opt{display:grid;gap:4px;justify-items:start;padding:16px;min-height:76px;text-align:left}
.opt em{font-style:normal;font-weight:800;font-size:1.5rem;color:var(--cy)}
.opt[aria-pressed=true],.chip[aria-pressed=true]{border-color:var(--cy);background:rgba(98,219,221,.12)}
.days{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.chip{min-height:52px;padding:0 16px;font-weight:600;flex:none}
.day{display:grid;place-items:center;min-width:68px;min-height:62px;line-height:1.1}.day small{font-size:.72rem;opacity:.75;text-transform:uppercase;letter-spacing:.08em}
.times{display:flex;flex-wrap:wrap;gap:8px}
.inp{display:grid;gap:10px}
.inp input{width:100%;min-height:54px;padding:12px 14px;border-radius:12px;border:1.5px solid rgba(255,255,255,.2);background:#0a0e10;color:var(--text);font:500 16px Inter,system-ui,sans-serif}
.inp input:focus{outline:none;border-color:var(--cy)}
.total{display:flex;justify-content:space-between;align-items:center;font-weight:700}.total b{font-size:1.6rem;color:var(--cy)}
.msg{min-height:1.3em;margin:0;font-weight:600}.msg.err{color:#ff9b8a}
.btn[disabled]{opacity:.6}
</style>
${pixelHead()}`)}
<body style="padding-bottom:24px">
${top}
<main><section class="hero" style="padding-top:12px"><div class="w">
  <h1 style="font-size:clamp(2.4rem,10vw,3.6rem)">Book Headlight Restoration</h1>
  <p style="margin:0 0 10px">Foggy to clear, done today at ${ADDR}.</p>
  <form class="bk" id="bk" novalidate>
    <div><p class="lbl"><span>1</span>How many headlights?</p><div class="opts">${opts}</div></div>
    <div><p class="lbl"><span>2</span>Pick a day</p><div class="days" id="days"><p class="note">Loading open times…</p></div></div>
    <div><p class="lbl"><span>3</span>Pick a time</p><div class="times" id="times"></div></div>
    <div class="inp"><p class="lbl" style="margin:0"><span>4</span>Your info</p>
      <input name="name" autocomplete="name" placeholder="Name" aria-label="Name" required>
      <input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Phone" aria-label="Phone" required></div>
    <div class="total"><span id="sum">Both headlights</span><b id="price">$100</b></div>
    <button class="btn btn-p" type="submit" id="go">${ic("check")}Book Now</button>
    <p class="msg" id="msg" role="status" aria-live="polite"></p>
  </form>
  <p class="note">Rather call? <a href="tel:${biz.tel}" data-ev="Contact">${biz.phone}</a>. Dom does every car himself.</p>
</div></section></main>
<script>
${TRACK_JS}
(function(){
  var CAL="${BOOK.calendarId}",HRS=${BOOK.hours},TEL="${biz.tel}",PHONE="${biz.phone}";
  var S={n:2,price:100,day:null,slot:null,slots:{}};
  var $=function(id){return document.getElementById(id)};
  var tz={timeZone:"America/Chicago"};
  function todayCT(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
  function fmtT(iso){return new Date(iso).toLocaleTimeString("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"})}
  function wd(k){return new Date(k+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"})}
  function upd(){var o=document.querySelector(".opt[aria-pressed=true]");$("sum").textContent=o.querySelector("b").textContent+(S.slot?" · "+wd(S.day)+" "+fmtT(S.slot):"");$("price").textContent="$"+S.price;$("go").lastChild.textContent="Book Now · $"+S.price}
  document.querySelectorAll(".opt").forEach(function(b){b.addEventListener("click",function(){
    document.querySelectorAll(".opt").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});S.n=+b.dataset.n;S.price=+b.dataset.price;upd()})});
  function times(){var t=$("times"),l=S.slots[S.day]||[];t.innerHTML=l.map(function(iso){return '<button type="button" class="chip" data-slot="'+iso+'" aria-pressed="'+(S.slot===iso)+'">'+fmtT(iso)+"</button>"}).join("")}
  $("days").addEventListener("click",function(e){var b=e.target.closest("[data-day]");if(!b)return;S.day=b.dataset.day;S.slot=null;
    document.querySelectorAll("[data-day]").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});times();upd()});
  $("times").addEventListener("click",function(e){var b=e.target.closest("[data-slot]");if(!b)return;S.slot=b.dataset.slot;
    document.querySelectorAll("[data-slot]").forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});upd();
    var n=document.querySelector('#bk input[name=name]');if(!n.value)n.focus({preventScroll:false})});
  fetch("/api/ghl-free-slots",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({calendarId:CAL,dateISO:todayCT(),durationHours:HRS})})
    .then(function(r){if(!r.ok)throw r;return r.json()}).then(function(d){
      Object.keys(d).filter(function(k){return /^\\d{4}-\\d{2}-\\d{2}$/.test(k)&&d[k]&&d[k].slots&&d[k].slots.length}).sort().slice(0,14).forEach(function(k){S.slots[k]=d[k].slots});
      var keys=Object.keys(S.slots);
      if(!keys.length){$("days").innerHTML='<p class="note">No open times online right now. Call <a href="tel:'+TEL+'">'+PHONE+'</a>.</p>';return}
      S.day=keys[0];
      $("days").innerHTML=keys.map(function(k){return '<button type="button" class="chip day" data-day="'+k+'" aria-pressed="'+(k===S.day)+'"><small>'+wd(k)+"</small>"+(+k.slice(8))+"</button>"}).join("");
      times();
    }).catch(function(){$("days").innerHTML='<p class="note">Couldn\\'t load times. Call <a href="tel:'+TEL+'">'+PHONE+'</a> and we\\'ll get you in.</p>'});
  $("bk").addEventListener("submit",function(e){
    e.preventDefault();var f=e.target,m=$("msg"),name=f.name.value.trim(),phone=f.phone.value.trim();
    if(!S.slot){m.className="msg err";m.textContent="Pick a day and time.";return}
    if(!name||phone.replace(/\\D/g,"").length<10){m.className="msg err";m.textContent="Add your name and a 10-digit phone number.";(name?f.phone:f.name).focus();return}
    if(window.fbq)fbq("track","Lead",{value:S.price,currency:"USD",content_name:GS_HL.name},{eventID:gsEventId()+"-lead"});
    var q=new URLSearchParams(location.search),src=["utm_source","utm_medium","utm_campaign","utm_content","fbclid"].filter(function(k){return q.get(k)}).map(function(k){return k+"="+q.get(k)}).join(" ");
    $("go").disabled=true;m.className="msg";m.textContent="Booking…";
    fetch("/api/ghl-create-booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      calendarId:CAL,startISO:S.slot,durationHours:HRS,name:name,phone:phone,service:"Headlight Restoration",
      packageName:(S.n===2?"Both headlights":"1 headlight"),vehicle:"",price:S.price,textMe:true,page:location.pathname,
      notes:"Headlight restoration, "+(S.n===2?"both headlights":"1 headlight")+", $"+S.price+(src?"\\nSource: "+src:"")})})
    .then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j})})
    .then(function(){location.href="/headlight-restoration/booked?appointment_start_time="+encodeURIComponent(S.slot)+"&n="+S.n+"&value="+S.price})
    .catch(function(){$("go").disabled=false;m.className="msg err";m.innerHTML='That didn\\'t go through. Call or text <a href="tel:'+TEL+'">'+PHONE+"</a> and we'll book you."});
  });
  upd();
})();
</script>
</body>
</html>
`;
}

export function buildHeadlightLanding(OUT) {
  fs.mkdirSync(path.join(OUT, "headlight-restoration"), { recursive: true });
  fs.writeFileSync(path.join(OUT, `${HL.path}.html`), landing());
  fs.writeFileSync(path.join(OUT, `${HL.bookedPath}.html`), booked());
  fs.writeFileSync(path.join(OUT, `${BOOK.path}.html`), bookPage());
}
