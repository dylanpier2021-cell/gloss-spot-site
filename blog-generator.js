import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { client } from "./client-config.js";
import { blogPostHTML } from "./generate-landing-page.js";

// ── Required posts (slugs that must exist per indexed URL list) ──────────────
const POSTS = [
  {
    slug: "ceramic-vs-wax",
    title: "Ceramic Coating vs Wax: Which One Is Actually Worth It?",
    excerpt: "Wax buys you weeks. Ceramic buys you years. Here's the honest tradeoff between the two — and how to know which is right for your car.",
    city: "Champaign",
    service: "ceramic coating",
    intent: "comparison",
    publishedAt: "2026-04-12T10:00:00Z",
    contentHtml: `<p>Almost every detailing customer eventually asks the same question: <em>"What's the actual difference between a wax and a ceramic coating, and which one do I really need?"</em></p>
<p>The short answer: wax is a temporary boost. Ceramic coating is a years-long protective shell. Both make your car look great. They just last very different amounts of time and protect very different things.</p>
<p>Here's the honest comparison from a detail crew that does both — and which one actually makes sense to spend money on.</p>

<h2>What wax actually does</h2>
<p>Carnauba wax (the kind most car wash combos use) is a soft, plant-based polish that fills in light surface imperfections and adds a warm, glossy shine. It bonds loosely to your clearcoat. It feels great. It looks great <em>that day</em>.</p>
<p>The catch: wax dies fast. In Illinois winter conditions — road salt, freeze-thaw cycles, frequent washes — most carnauba waxes are gone within 6 to 12 weeks. Even synthetic sealants (a step up from carnauba) usually tap out at 4–6 months. After that, you're back to bare clearcoat.</p>
<p>Wax is a maintenance product. It's something you reapply quarterly if you really love how it looks. It's not protection in any meaningful sense.</p>

<h2>What ceramic coating actually does</h2>
<p>Ceramic coating is a liquid polymer that bonds <em>chemically</em> to your clearcoat. Once cured, it forms a hardened layer measured in nanometers. It's not a wax. It's a fundamentally different product.</p>
<p>That hardened layer does three things wax can't:</p>
<ul>
  <li><strong>Hydrophobic.</strong> Water beads up and rolls off, taking dirt with it. Washes go from 40 minutes to 15.</li>
  <li><strong>UV protection.</strong> Real protection against fade and oxidation, especially on dark colors that bake in summer sun.</li>
  <li><strong>Chemical resistance.</strong> Bird droppings, road salt, brake dust, tree sap — they sit on top of the coating instead of etching the paint underneath.</li>
</ul>
<p>A 1-year coating lasts a year. A 3-year coating lasts about 3 years. A 5-year coating, properly maintained, lasts 5+ years. We won't quote ceramic without a paint correction or at least a thorough decon — there's no point coating dirty paint, because the coating just locks in the swirls.</p>

<h2>Which one should you actually buy?</h2>
<p>If you trade or sell your car every 1–2 years, wax is fine. You'll never see the long-term tax of skipping ceramic.</p>
<p>If you keep cars 3+ years, plan to drive a lot of Illinois winter miles, or just want washing to take less time and the car to actually look the same year three as year one — ceramic is the better spend. The math works out almost every time.</p>
<p>Want a real-life cost breakdown? See our <a href="/blog/detailing-cost">detailing cost guide</a> or run our <a href="/cost-calculator">cost calculator</a> for an instant estimate on your specific vehicle.</p>

<blockquote>"The ceramic coating makes it shine like no other." — Kenny Nguyen, ${client.city} customer</blockquote>

<h2>How we'd quote it</h2>
<p>For most ${client.city}-area cars in good condition: a 3-year ceramic with a light polish prep is the sweet spot. Around $700-$900 depending on size, and you're fully protected for 36+ months.</p>
<p>If your paint has visible swirls or scratches under the lights, we'd recommend a multi-stage <a href="/paint-correction">paint correction</a> first — otherwise you're locking in those imperfections under the coating.</p>`,
  },
  {
    slug: "detailing-cost",
    title: "How Much Does Auto Detailing Actually Cost in 2026?",
    excerpt: "Real pricing breakdowns by vehicle size and package — from a $110 express interior to a $1,500 ceramic coating job. No vague 'starting at' numbers.",
    city: "Champaign",
    service: "full service detailing",
    intent: "cost-guide",
    publishedAt: "2026-04-08T10:00:00Z",
    contentHtml: `<p>Detailing pricing is famously confusing. Every shop quotes "from $99" or "starting at $149" — but nobody ever actually pays the starting price. Vehicle size, condition, and add-ons can double or triple the bill before you blink.</p>
<p>Here's how ${client.businessName} actually prices our work in ${client.city}, broken down honestly. No "starting at." Real prices for real cars.</p>

<h2>Interior-only details ($110-$400)</h2>
<p>This is what most people actually book. The interior is where 90% of "my car feels gross" comes from — pet hair, fast-food crumbs, water stains on the carpet, the smell.</p>
<table>
  <tr><th>Package</th><th>Coupe</th><th>Sedan</th><th>Mid SUV</th><th>Large SUV</th><th>Minivan</th></tr>
  <tr><td>Express Interior</td><td>$110</td><td>$135</td><td>$165</td><td>$210</td><td>$250</td></tr>
  <tr><td>Interior Refresh</td><td>$150</td><td>$175</td><td>$225</td><td>$275</td><td>$285</td></tr>
  <tr><td>Full Interior Detail</td><td>$220</td><td>$250</td><td>$300</td><td>$340</td><td>$400</td></tr>
</table>
<p>Express is a vacuum + wipe-down. Refresh adds spot shampoo and UV protectant. Full Interior is the complete reset — steam, extraction, leather conditioning, headliner. If your car has pet hair or a smell, you want Full Interior.</p>

<h2>Full details — inside and out ($300-$500)</h2>
<p>Most retail customers in ${client.city} land here. Decon foam wash on the outside, full interior reset, sealant on the paint, tire dressing.</p>
<table>
  <tr><th>Package</th><th>Coupe</th><th>Sedan</th><th>Mid SUV</th><th>Large SUV</th><th>Minivan</th></tr>
  <tr><td>Express In &amp; Out</td><td>$200</td><td>$235</td><td>$285</td><td>$335</td><td>$350</td></tr>
  <tr><td>Full Detail</td><td>$300</td><td>$350</td><td>$400</td><td>$450</td><td>$500</td></tr>
</table>
<p>Express In &amp; Out is the budget combo. Full Detail is what we'd actually book a friend for — the complete reset, takes 3.5–6 hours depending on size.</p>

<h2>Ceramic coatings, PPF, and tint (it scales)</h2>
<p>Protection products price by vehicle size <em>and</em> tier. Here are the starting numbers in ${client.city}:</p>
<ul>
  <li><strong>Ceramic Coating:</strong> 1yr from $200, 3yr from $700, 5yr from $1,000. Add $0–$200 for vehicle size.</li>
  <li><strong>Window Tint:</strong> Obsidian from $350, Ceramic IR from $475, Crystalline from $890. Add $250 for windshield, $75 for brow.</li>
  <li><strong>Paint Protection Film:</strong> City coverage from $300; Track Pack from $3,000.</li>
  <li><strong>Car Wraps:</strong> $500 (misc), $750 (black), $950 (white).</li>
  <li><strong>Paint Correction:</strong> From $500. Pairs with ceramic.</li>
</ul>

<h2>Why ${client.city} pricing varies</h2>
<p>Three honest factors push prices up:</p>
<ol>
  <li><strong>Vehicle size.</strong> A Tahoe takes 50% more product and time than a Civic.</li>
  <li><strong>Condition.</strong> A daily driver with two kids and a dog takes longer than a garage-queen.</li>
  <li><strong>German vehicles.</strong> Audi/BMW/Mercedes/Porsche/VW add $100 on ceramic, PPF, wrap, and paint correction work because the prep and trim handling are more involved.</li>
</ol>

<h2>Get an exact quote in 60 seconds</h2>
<p>Tired of starting-at numbers? Use our <a href="/cost-calculator">cost calculator</a> — pick your service, package, and vehicle size for the exact price. Or <a href="/book-an-appointment-1696">book online</a> and the price is shown before you confirm.</p>
<p>Still unsure which package fits your car? <a href="${client.phone ? `tel:+1${client.phone.replace(/[^0-9]/g, "")}` : "/contact"}">Call ${client.phone}</a> or <a href="/contact">text us a few photos</a>. We'll tell you straight.</p>`,
  },
  {
    slug: "how-often",
    title: "How Often Should You Detail Your Car?",
    excerpt: "Once a year? Quarterly? Every six months? Honest guidance on detailing frequency based on how you actually use your car — and the salt-belt reality of central Illinois.",
    city: "Champaign",
    service: "full service detailing",
    intent: "guide",
    publishedAt: "2026-04-04T10:00:00Z",
    contentHtml: `<p>Most ${client.city}-area drivers ask the same question: <em>"How often should I actually be getting my car detailed?"</em> The honest answer depends on three things — how you use the car, where you park it, and what you want it to look like five years from now.</p>
<p>Here's a real frequency guide from a detail crew that runs ${client.city}'s salt-belt winters every year.</p>

<h2>Daily drivers — twice a year minimum</h2>
<p>If your car is your main daily — kids in the back, occasional fast food, gym bag in the trunk — you should plan on a full detail at least <strong>twice a year</strong>. Spring and fall are the natural windows.</p>
<p>A spring detail strips off the salt, sand, and grime that accumulated over Illinois winter. The fall detail sets you up for that next round — clean carpet, sealed paint, fresh leather conditioning. Twice a year keeps the car ahead of decay instead of constantly playing catch-up.</p>

<h2>Pet owners and family cars — every 3 months</h2>
<p>Pet hair is the unsung killer of car interiors. So is dropped milk. So are car-seat crumbs. If you have any of those — pets, kids, or both — you'll see real benefit from a quarterly interior detail.</p>
<p>You don't need a full detail every time. The Interior Refresh package is enough between bigger jobs. Save the full reset (extraction + steam + leather conditioning) for once or twice a year.</p>

<h2>Garage queens and weekend cars — once a year</h2>
<p>If your car lives in a garage and only sees Saturday road-trip miles, you can stretch to <strong>annual</strong>. The car isn't accumulating much, so a comprehensive once-a-year detail keeps it pristine.</p>
<p>The exception: if you've got <a href="/ceramic">ceramic coating</a>, you should still book an annual maintenance polish. The coating is doing 90% of the work but a refresh keeps it performing at full strength.</p>

<h2>The salt-belt reality</h2>
<p>One thing nobody tells you when you buy a car in central Illinois: salt is brutal. By February, road salt has worked its way into door jambs, undercarriage seams, and any rubber gasket it can find. It eats clearcoat. It rusts metal. It gets into carpet and stays there.</p>
<p>This is the single biggest reason we recommend a spring detail in ${client.city} no matter what. Even if you're stretching budget, a $200 Express In &amp; Out in late March is the most valuable detail of the year here — full decon foam, jambs, full interior vacuum, salt remediation on the carpet.</p>

<blockquote>"This is the cleanest I have EVER seen this car. Dom got years of use and grime to just disappear." — Macy Ruple, ${client.city} customer</blockquote>

<h2>What we recommend most ${client.city} customers</h2>
<p>Here's our actual default recommendation when someone asks us point-blank:</p>
<ul>
  <li>Daily driver, no pets/kids: <strong>Full Detail</strong> in March/April, then again in October.</li>
  <li>Daily driver, pets or kids: <strong>Interior Refresh</strong> every 3 months, <strong>Full Detail</strong> in March.</li>
  <li>Coated car: <strong>Maintenance polish</strong> annually.</li>
  <li>Show car: book what you need; just keep up with the bug splatter.</li>
</ul>
<p>Need help picking? <a href="/cost-calculator">Run the cost calculator</a> for your car or <a href="/book-an-appointment-1696">book online</a> in 4 quick steps.</p>`,
  },
  {
    slug: "mobile-vs-shop",
    title: "Mobile Detailing vs Shop Detailing: Which Is Actually Better?",
    excerpt: "Drop-off detailers want you to think their concrete bay is superior. Here's why we run a 100% mobile operation — and when a shop genuinely makes more sense.",
    city: "Champaign",
    service: "mobile detailing",
    intent: "comparison",
    publishedAt: "2026-04-02T10:00:00Z",
    contentHtml: `<p>Half of every detailing decision is logistics. You can have the best detailer in ${client.city}, but if booking with them means a full Saturday of dropping off, ubering home, ubering back, and waiting in a lobby — most people just won't bother.</p>
<p>That's the problem mobile detailing solves. We started ${client.businessName} as a 100% mobile operation for one reason: it's how the customer actually wants the work done.</p>
<p>Here's the honest comparison.</p>

<h2>What mobile detailing actually means</h2>
<p>"Mobile" doesn't mean we show up with a bucket and a sponge. We arrive in a fully-kitted truck with our own water tank, generator, vacuum, polishers, steam machines, hot water extractor, and pro-grade products. The detail bay comes to your driveway.</p>
<p>You don't have to drop off, leave the car all day, or arrange a ride home. You hand off the keys (or you don't even need to be there) — we work, we walk you through the result, you pay easy.</p>

<h2>Three real benefits over shop detailing</h2>
<ol>
  <li><strong>Time.</strong> A shop detail takes a full day of your time even if the actual work is 4 hours — you're factoring in transport, waiting, picking up. Mobile is just 4 hours, none of which is your problem.</li>
  <li><strong>Privacy.</strong> Some people want the detail done while they're at work, while they're sleeping, or while they're at brunch. We can do all three.</li>
  <li><strong>Owner-operator.</strong> Most ${client.city} mobile detailers are the owner. Shop detailers are usually the cheapest employee in the back. The skill gap is real.</li>
</ol>

<h2>When a shop is actually better</h2>
<p>We'll be honest. Shops have one real advantage: dust-free environments for ceramic coating cure. Coatings need 12-24 hours of clean cure time. In a controlled bay with filtered air, that's perfect. In a windy ${client.city} driveway, it's harder to guarantee.</p>
<p>This is why for premium ceramic jobs we'll occasionally bring the car indoors after application — typically a partner space or your own garage. For everything else, mobile is just better.</p>

<h2>What "mobile" doesn't fix</h2>
<p>Mobile doesn't make pet hair magically easier. Doesn't shorten the time it takes to do a real correction. Doesn't make a 6-hour PPF install into a 2-hour one. It just changes <em>where</em> the work happens.</p>
<p>If a mobile detailer quotes you 90 minutes for a full detail, that's not a "mobile efficiency" — that's a corner-cut. Real work takes real time, mobile or not.</p>

<blockquote>"Him coming to your own house is the icing on the cake — worth every penny and then some." — Macy Ruple, ${client.city} customer</blockquote>

<h2>What we recommend</h2>
<p>For 90% of ${client.city}-area customers, mobile is straight better. The only times we'd nudge you toward a shop are:</p>
<ul>
  <li>You need an enclosed space for ceramic cure on a multi-day forecast of rain.</li>
  <li>You're getting full-vehicle PPF and want a guaranteed dust-free install (we can usually arrange this).</li>
  <li>You don't have any reasonable parking space at home or work.</li>
</ul>
<p>For everything else — interior detail, full detail, paint correction, single-panel PPF, window tint, ceramic on a clear-weather day — book mobile and skip the shuttle ride. <a href="/book-an-appointment-1696">Book online here</a> or <a href="/cost-calculator">run the cost calculator</a> for your car.</p>`,
  },
];

// ── Topic matrix (kept for compatibility with run.js) ────────────────────────
export function generateTopicMatrix() {
  return POSTS.map((p) => ({
    slug: p.slug, title: p.title,
    city: p.city, service: p.service,
    intent: p.intent,
    priority: 1,
    focusKeyword: `${p.service} ${p.city.toLowerCase()}`,
  }));
}

// ── Build all blog posts + posts.json ────────────────────────────────────────
export async function generateAllPosts() {
  const dir = join("output", "blog");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const meta = POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    city: p.city,
    service: p.service,
    intent: p.intent,
    excerpt: p.excerpt,
    publishedAt: p.publishedAt,
    url: `/blog/${p.slug}`,
  }));

  for (const p of POSTS) {
    const html = blogPostHTML(p, meta);
    writeFileSync(join(dir, `${p.slug}.html`), html, "utf8");
    console.log(`  ✓ blog post → output/blog/${p.slug}.html`);
  }

  writeFileSync(join(dir, "posts.json"), JSON.stringify(meta, null, 2), "utf8");
  console.log(`  ✓ posts.json with ${meta.length} entries`);

  return POSTS.map((p) => ({ file: `blog/${p.slug}.html` }));
}

// CLI entry
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") || "")) {
  generateAllPosts();
}
