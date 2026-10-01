// Every page on the site: URL, title, meta, H1, hero line, buttons, blocks.
// Titles must stay under 60 characters and descriptions under 155; the build
// refuses to run otherwise. Every URL from the old site is still here (1:1).
import { biz, cities, posts, faqs, reviews } from "./content.js";

const CALL = "Call 217-600-2108.";
export const redirectsAdded = [["/members", "/membership"]];

// Related-service cards. [path, title, line]
const R = {
  packages: ["packages", "Detailing packages", "Express, Full and Lux. Prices by vehicle size."],
  full: ["full-service-detailing-champaign-il", "Full Detail", "Complete interior and exterior, from $225."],
  interior: ["interior-detailing-champaign-il", "Interior detailing", "Seats, carpet, dash and glass, reset."],
  exterior: ["exterior-detailing-champaign-il", "Exterior detailing", "Foam wash, wheels, jambs and sealant."],
  ceramic: ["ceramic", "Ceramic coating", "Years of gloss. Paint correction included."],
  correction: ["paint-correction", "Paint correction", "Swirls out, depth back. From $325."],
  ppf: ["ppf", "Paint protection film", "Clear film that takes the rock chips."],
  wraps: ["car-wraps", "Vehicle wraps", "A new color, fully reversible. From $2,400."],
  membership: ["membership", "Weekly plans", "Exterior $149/mo, or full membership $299/mo."],
  protection: ["vehicle-protection", "Ceramic vs. PPF vs. wrap", "Which protection fits your car."],
  area: ["service-area", "Where our customers drive from", "Drive times from Champaign County towns."],
  reviews: ["reviews", "Reviews", `${biz.reviewCount} five-star Google reviews.`],
  contact: ["contact", "Contact & directions", "606 N. Country Fair Dr, Champaign, IL."],
  calc: ["cost-calculator", "Price calculator", "Your exact price in two taps."],
};

// ── Core service pages (headline, 3 benefits, before/after, price card, FAQ, book) ──
const core = [
  {
    path: "packages", crumb: "Detailing",
    title: "Auto Detailing Champaign, IL – Book Now | The Gloss Spot",
    description: "Auto detailing in Champaign, IL: Express from $90, Full Detail from $225, Lux with paint correction from $325. Book online in 30 seconds.",
    h1: "Auto Detailing in <em>Champaign, IL</em>",
    lead: "Three packages, priced by vehicle size. Book in 30 seconds.",
    hero: { photo: "hero2" },
    service: { name: "Auto Detailing", type: "Car detailing", low: 90, high: 450 },
    blocks: [
      ["benefits", [["sparkle", "Three clear packages", "Express, Full or Lux. You see your price before you book."], ["shield", "Checked before it leaves", "Dom or Dylan inspects every car at pickup."], ["clock", "Drop off, pick up", "Leave it on the way to work. Grab it on the way home."]]],
      ["beforeAfter"],
      ["prices", "detail"],
      ["faq", "detailing"],
      ["related", [R.ceramic, R.interior, R.membership, R.correction]],
    ],
  },
  {
    path: "ceramic", crumb: "Ceramic Coating", quote: "Ceramic Coating", bookSvc: "ceramic",
    title: "Ceramic Coating Champaign, IL – Book Now | The Gloss Spot",
    description: "Ceramic coating in Champaign, IL with paint correction included. 3, 6 and 10-year coatings from $1,100. Book online or get a quote by text.",
    h1: "Ceramic Coating in <em>Champaign, IL</em>",
    lead: "Years of gloss and easy washes. Paint correction included.",
    hero: { photo: "hero3", video: "heroDesktop", videoMobile: "heroMobile" },
    ctas: ["book", "quote"],
    service: { name: "Ceramic Coating", low: 1100, high: 2550 },
    blocks: [
      ["benefits", [["drop", "Water beads right off", "Rain and road grime rinse away with less scrubbing."], ["sparkle", "Correction included", "We polish your paint first, so the coating locks in a clean finish."], ["shield", "3, 6 or 10 years", "Pick the protection that fits how long you'll keep the car."]]],
      ["beforeAfter"],
      ["prices", "ceramic"],
      ["faq", "ceramic"],
      ["related", [R.correction, R.ppf, R.protection, R.membership]],
    ],
  },
  {
    path: "paint-correction", crumb: "Paint Correction", bookSvc: "lux",
    title: "Paint Correction Champaign, IL – Book Now | The Gloss Spot",
    description: "Paint correction in Champaign, IL: remove swirls and haze with our Lux Package, from $325 with a full detail and sealant. Book online today.",
    h1: "Paint Correction in <em>Champaign, IL</em>",
    lead: "Swirls out, depth back. From $325 with a full detail.",
    hero: { photo: "value" },
    service: { name: "Paint Correction", type: "Automotive paint correction", low: 325, high: 550 },
    blocks: [
      ["benefits", [["sparkle", "Swirls and haze removed", "Machine polishing levels the clear coat so light reflects clean."], ["layers", "One-step or two-step", "One-step clears light swirls. Two-step cuts deeper for +$100."], ["shield", "Ready to protect", "The perfect base for <a href=\"/ceramic\">ceramic coating</a> or <a href=\"/ppf\">PPF</a>."]]],
      ["beforeAfter"],
      ["prices", "correction"],
      ["faq", "correction"],
      ["related", [R.ceramic, R.ppf, R.packages, R.protection]],
    ],
  },
  {
    path: "ppf", crumb: "Paint Protection Film", quote: "Paint Protection Film",
    title: "PPF Champaign, IL – Paint Protection Film | The Gloss Spot",
    description: "Paint protection film (PPF) in Champaign, IL. Essentials from $800, Track Pack and Full Body. Send a photo and get a quote by text today.",
    h1: "Paint Protection Film (PPF) in <em>Champaign, IL</em>",
    lead: "Clear film that takes the rock chips, so your paint doesn't.",
    hero: { photo: "hero4" },
    ctas: ["quote", "call"],
    service: { name: "Paint Protection Film", type: "Paint protection film installation", low: 800, high: 5500 },
    blocks: [
      ["benefits", [["shield", "Stops rock chips", "A tough clear layer over the panels that take the most hits."], ["sun", "Keeps paint like new", "Protects against bug and bird etching and light scratches."], ["layers", "Pairs with ceramic", "Film up front, <a href=\"/ceramic\">ceramic coating</a> everywhere for gloss."]]],
      ["beforeAfter"],
      ["prices", "ppf"],
      ["faq", "ppf"],
      ["related", [R.ceramic, R.protection, R.wraps, R.correction]],
    ],
  },
  {
    path: "car-wraps", crumb: "Vehicle Wraps", quote: "Vehicle Wrap",
    title: "Vehicle Wraps Champaign, IL – Get a Quote | The Gloss Spot",
    description: "Vehicle wraps in Champaign, IL. Full color change from $2,400, partial wraps from $800. Send a photo and get a wrap quote by text today.",
    h1: "Vehicle Wraps in <em>Champaign, IL</em>",
    lead: "A whole new color, or just the accents. Fully reversible.",
    hero: { photo: "hero5" },
    ctas: ["quote", "call"],
    service: { name: "Vehicle Wraps", type: "Vehicle vinyl wrap", low: 800, high: 3600 },
    blocks: [
      ["benefits", [["brush", "Any color, any finish", "Gloss, satin, matte or specialty. Change your look without paint."], ["shield", "Factory paint underneath", "The wrap covers your paint while it's on."], ["truck", "Cars, trucks and vans", "Coupes to full-size trucks. Sprinters get a custom quote."]]],
      ["beforeAfter"],
      ["prices", "wraps"],
      ["faq", "wraps"],
      ["related", [R.ppf, R.ceramic, R.protection, R.packages]],
    ],
  },
  {
    path: "membership", crumb: "Membership", quote: "Membership", isNew: true,
    title: "Car Wash Membership Champaign, IL – From $149/mo",
    description: "Car wash membership in Champaign, IL: weekly exterior details for $149/mo, or add wax and interior cleans for $299/mo. Start your plan today.",
    h1: "Car Wash Membership in <em>Champaign, IL</em>",
    lead: "A clean car every week, on autopilot. From $149 a month.",
    hero: { photo: "bigCta" },
    ctas: ["membership", "call"],
    service: { name: "Car Wash Membership", type: "Car wash and detailing membership", low: 149, high: 299 },
    blocks: [
      ["benefits", [["calendar", "Same time every week", "We set a regular slot with you. No booking each time."], ["drop", "Exterior every week", "$149/mo gets you 4 exterior details a month."], ["car", "Add the inside", "$299/mo adds weekly wax and 4 interior cleans."]]],
      ["beforeAfter"],
      ["prices", ["maintenance", "membership"], { heading: "Two weekly plans", sub: "Outside only, or inside and out." }],
      ["faq", "membership"],
      ["related", [R.packages, R.ceramic, R.exterior, R.interior]],
    ],
  },
];
core.forEach((p) => { p.maxWords = 300; });

// ── Secondary service pages (kept 1:1 from the old site, each with its own angle) ──
const secondary = [
  {
    path: "full-service-detailing-champaign-il", crumb: "Full Detail", bookSvc: "full",
    title: "Full Detail Champaign, IL – From $225 | The Gloss Spot",
    description: "Full service detailing in Champaign, IL: foam wash, wheels, jambs, full interior, windows and sealant. From $225. Book online in 30 seconds.",
    h1: "Full Service Detailing in <em>Champaign, IL</em>",
    lead: "Inside and out, done right. From $225.",
    hero: { photo: "hero" },
    service: { name: "Full Detail", type: "Full service car detailing", low: 225, high: 315 },
    blocks: [
      ["benefits", [["car", "Inside and out", "Foam wash, wheels, jambs, full vacuum, dash, windows and sealant."], ["users", "Talk to the owner", "When you pull in, you're talking to Dom."], ["shield", "Checked before pickup", "Dom or Dylan walks every car before it leaves."]]],
      ["beforeAfter"],
      ["prices", "full"],
      ["faq", [faqs.detailing[0], faqs.detailing[1], ["What's included in a full detail?", "Foam pre-soak and hand wash, wheels, tires and jambs, a full interior vacuum, dash and panels, windows inside and out, tire dressing and a quick sealant."], ["Can I upgrade to paint correction?", "Yes. The Lux Package adds one-step correction and sealant, from $325."]]],
      ["related", [R.packages, R.correction, R.ceramic, R.membership]],
    ],
  },
  {
    path: "full-service", crumb: "Full-Service Car Care",
    title: "Full-Service Car Care Champaign, IL – Book | The Gloss Spot",
    description: "Full-service car care in Champaign, IL: detailing, paint correction, ceramic, PPF, wraps and a weekly membership under one roof. Book today.",
    h1: "Full-Service Car Care in <em>Champaign, IL</em>",
    lead: "Detailing to wraps, under one roof. One shop, one call.",
    hero: { photo: "bigCta" },
    blocks: [
      ["compare", { eyebrow: "Everything we do", heading: "Pick what your car needs", cols: ["What it does", "From"], rows: [
        ["<a href=\"/packages\">Detailing</a>", "Cleans inside and out", "$90"],
        ["<a href=\"/paint-correction\">Paint correction</a>", "Removes swirls and haze", "$325"],
        ["<a href=\"/ceramic\">Ceramic coating</a>", "Years of gloss, easy washes", "$1,100"],
        ["<a href=\"/ppf\">PPF</a>", "Stops rock chips", "$800"],
        ["<a href=\"/car-wraps\">Wraps</a>", "Changes the color", "$800"],
        ["<a href=\"/membership\">Membership</a>", "Keeps it clean weekly", "$149/mo"],
      ] }],
      ["serviceCards"],
      ["reviews", 3],
      ["related", [R.packages, R.protection, R.membership, R.calc]],
    ],
  },
  {
    path: "interior-detailing-champaign-il", crumb: "Interior Detailing", bookSvc: "full",
    title: "Interior Detailing Champaign, IL – Book | The Gloss Spot",
    description: "Interior detailing in Champaign, IL: seats, carpet, mats, dash, vents and glass. Pet hair and kid messes welcome. Book online or call today.",
    h1: "Interior Detailing in <em>Champaign, IL</em>",
    lead: "Seats, carpet, dash and glass, reset. From $90.",
    hero: { photo: "g6" },
    service: { name: "Interior Detailing", type: "Car interior detailing", low: 90, high: 315 },
    blocks: [
      ["benefits", [["users", "Kids, pets, work trucks", "Crumbs, dog hair and jobsite dust are everyday work for us."], ["drop", "Every surface", "Vacuum, seats and mats, dash, panels, vents and glass."], ["shield", "Checked before pickup", "Dom or Dylan looks it over before you get your keys."]]],
      ["beforeAfter"],
      ["prices", ["express", "full"]],
      ["faq", [["How much is interior detailing in Champaign?", "A quick interior refresh comes in the Express, from $90. The Full Detail covers the complete interior and exterior, from $225."], ["Can you remove pet hair?", "Yes. Tell us about it in your booking notes so we plan the time."], ["How long does an interior detail take?", "About an hour for an Express and about three for a Full Detail."], ["Do you clean seats and floor mats?", "Yes. Seats and mats are part of every Full Detail."]]],
      ["related", [R.packages, R.full, R.membership, R.ceramic]],
    ],
  },
  {
    path: "interior", crumb: "Interior Car Cleaning", bookSvc: "express",
    title: "Interior Car Cleaning Champaign, IL – Book | The Gloss Spot",
    description: "Interior car cleaning in Champaign, IL for busy families, pet owners and commuters. Express from $90, Full Detail from $225. Book online now.",
    h1: "Interior Car Cleaning in <em>Champaign, IL</em>",
    lead: "For the crumbs, the dog hair and the daily mess.",
    hero: { photo: "g1" },
    blocks: [
      ["benefits", [["clock", "Express or Full", "A quick vacuum and wipe-down, or the complete interior."], ["heart", "Family-car friendly", "Car seats, snacks and sports gear: we've seen it all."], ["calendar", "Book in 30 seconds", "Pick a time online, drop off, pick up clean."]]],
      ["reviews", 3, "Families love a clean car"],
      ["prices", ["express", "full"]],
      ["faq", [["Can you get rid of car smells?", "We clean the usual sources: carpets, seats, vents and trash spots. Tell us about the smell when you book."], ["Do I need to empty my car first?", "Just take out valuables. We handle the rest."], ["How often should I clean my car's interior?", "Every month or two with kids or pets. The <a href=\"/membership\">membership</a> covers 4 interior cleans a month."]]],
      ["related", [R.interior, R.membership, R.packages, R.reviews]],
    ],
  },
  {
    path: "exterior-detailing-champaign-il", crumb: "Exterior Detailing", bookSvc: "full",
    title: "Exterior Detailing Champaign, IL – Book | The Gloss Spot",
    description: "Exterior detailing in Champaign, IL: foam wash, wheels, jambs, tire dressing and sealant, plus paint correction upgrades. Book online today.",
    h1: "Exterior Detailing in <em>Champaign, IL</em>",
    lead: "Foam wash, wheels, jambs and sealant. Gloss you can see.",
    hero: { photo: "hero4" },
    service: { name: "Exterior Detailing", type: "Car exterior detailing", low: 90, high: 450 },
    blocks: [
      ["benefits", [["drop", "Hand wash, not a tunnel", "Foam pre-soak and a careful hand wash protect your paint."], ["car", "Wheels and jambs too", "Wheels, tires and door jambs get cleaned, not skipped."], ["sparkle", "Upgrade to correction", "Add one-step paint correction with the Lux Package."]]],
      ["beforeAfter"],
      ["prices", ["express", "lux"]],
      ["faq", [["How much is exterior detailing in Champaign?", "An exterior wash comes with the Express, from $90. The Full Detail adds sealant and the full interior, from $225."], ["Will a hand wash scratch my paint?", "We use a foam pre-soak and careful hand wash to lift grit before we touch the paint."], ["How do I keep the shine longer?", "A sealant lasts months. <a href=\"/ceramic\">Ceramic coating</a> lasts years."]]],
      ["related", [R.correction, R.ceramic, R.packages, R.ppf]],
    ],
  },
  {
    path: "exterior", crumb: "Hand Car Wash & Wax", bookSvc: "express",
    title: "Hand Car Wash & Wax Champaign, IL – Book | The Gloss Spot",
    description: "Hand car wash and wax in Champaign, IL. Express Detail from $90 or weekly exterior details for $149/mo. Book online in 30 seconds.",
    h1: "Hand Car Wash &amp; Wax in <em>Champaign, IL</em>",
    lead: "Clean and glossy, by hand. From $90.",
    hero: { photo: "hero5" },
    blocks: [
      ["benefits", [["drop", "By hand, start to finish", "Foam, hand wash and dry. No brushes slapping your paint."], ["calendar", "Once or every week", "Book an Express, or go weekly with the membership."], ["sparkle", "Wax that shows", "A slick, glossy finish that helps water run off."]]],
      ["prices", ["express", "maintenance"]],
      ["related", [R.membership, R.exterior, R.ceramic, R.packages]],
    ],
  },
  {
    path: "mobile-detailing-champaign-il", crumb: "Mobile Detailing Alternative",
    title: "Mobile Detailing Alternative Champaign, IL | The Gloss Spot",
    description: "Looking for mobile detailing in Champaign, IL? Drop off at our shop instead: better light, clean water, no rain-outs. Book in 30 seconds.",
    h1: "A Mobile Detailing Alternative in <em>Champaign, IL</em>",
    lead: "Drop off at our shop. Same brothers, better light, no rain-outs.",
    hero: { photo: "hero2" },
    blocks: [
      ["compare", { eyebrow: "Driveway vs. shop", heading: "Why we moved into a shop", cols: ["Driveway", "Our shop"], rows: [
        ["Lighting", "Sun and shade", "Steady shop lights"],
        ["Water and power", "Tanks and generators", "Clean, controlled"],
        ["Weather", "Rain-outs and wind", "Never cancelled"],
        ["Ceramic, PPF, wraps", "Limited", "Every service"],
        ["Who works on it", "Dom", "Dom and Dylan"],
      ] }],
      ["steps"],
      ["prices", "detail"],
      ["faq", [faqs.detailing[3], ["Is dropping off a hassle?", "Most people drop off on the way to work and pick up on the way home. We'll text you when it's ready."], ["Where is the shop?", "606 N. Country Fair Dr, Champaign, IL. Tap Get Directions at the bottom of the page."]]],
      ["related", [R.packages, R.membership, R.contact, R.reviews]],
    ],
  },
  {
    path: "mobile-detailing", crumb: "Mobile Car Detailing",
    title: "Mobile Car Detailing Champaign, IL – Now In-Shop",
    description: "The Gloss Spot started as mobile car detailing in Champaign, IL. Now we're in our own shop on Country Fair Dr. Same team. Book online today.",
    h1: "Mobile Car Detailing, Now at Our <em>Champaign, IL</em> Shop",
    lead: "We started in driveways. Now we have a shop. You still talk to Dom.",
    hero: { photo: "hero" },
    blocks: [
      ["text", { eyebrow: "What changed", heading: "Same team. Better setup.", paras: ["For years, Dom detailed in driveways and parking lots across Champaign County.", "Now every car comes to 606 N. Country Fair Dr, where we have the light, water and room to do our best work."], bullets: ["Same packages, online booking", "Ceramic, PPF and wraps under one roof", "Every car checked by Dom or Dylan"] }],
      ["reviews", 3, "From our driveway days"],
      ["prices", "detail"],
      ["related", [R.packages, R.contact, R.membership, R.area]],
    ],
  },
  {
    path: "vehicle-protection", crumb: "Paint Protection Guide",
    title: "Paint Protection Champaign, IL: Ceramic vs PPF | Gloss Spot",
    description: "Ceramic coating, PPF or a wrap? Compare paint protection in Champaign, IL by cost, lifespan and what each stops. Get a quote by text today.",
    h1: "Paint Protection in <em>Champaign, IL</em>",
    lead: "Ceramic, PPF or a wrap? Here's the 10-second version.",
    hero: { photo: "value" },
    quote: "Ceramic Coating",
    ctas: ["quote", "call"],
    blocks: [
      ["compare", { eyebrow: "Compare", heading: "Ceramic vs. PPF vs. wrap", cols: ["Ceramic", "PPF", "Wrap"], rows: [
        ["Best for", "Gloss, easy washes", "Rock chips", "New color"],
        ["Stops rock chips", "No", "Yes", "Some"],
        ["Lasts", "3, 6 or 10 years", "Years", "Years"],
        ["From", "$1,100", "$800", "$2,400 (partials $800)"],
        ["Learn more", "<a href=\"/ceramic\">Ceramic</a>", "<a href=\"/ppf\">PPF</a>", "<a href=\"/car-wraps\">Wraps</a>"],
      ] }],
      ["related", [R.ceramic, R.ppf, R.wraps, R.correction]],
    ],
  },
];

// ── Quote-only pages (services not on the main price list) ──
const quoteOnly = [
  ["window-tint", "Window Tint", "Window Tint Champaign, IL – Get a Quote | The Gloss Spot", "Window tint in Champaign, IL for heat, UV and privacy. Send your vehicle and a photo and get a window tint quote by text. Call 217-600-2108.", "Cooler cabin, more privacy. Get a price by text.", "Window Tint",
    [["sun", "Less heat and glare", "Tint cuts heat and UV through the glass."], ["shield", "More privacy", "Keep what's in your car out of sight."], ["chat", "Quote by text", "Send your vehicle and a photo. We'll text a price."]]],
  ["headlight", "Headlight Restoration", "Headlight Restoration Champaign, IL – Quote | Gloss Spot", "Headlight restoration in Champaign, IL. Clear up yellow, foggy headlights. Send a photo and get a quote by text, or call 217-600-2108.", "Yellow, foggy lenses, cleared up. Get a price by text.", "Headlight Restoration",
    [["sun", "Clearer at night", "Restored lenses let more light through."], ["sparkle", "Looks newer", "Cloudy headlights age a car fast."], ["camera", "Photo quote", "Send a photo of your headlights for a price."]]],
  ["engine", "Engine Bay Detailing", "Engine Bay Detailing Champaign, IL – Quote | Gloss Spot", "Engine bay detailing in Champaign, IL. A clean, dressed engine bay for selling, showing or peace of mind. Get a quote by text or call today.", "A clean bay for selling, showing or peace of mind.", "Engine Bay Detail",
    [["sparkle", "Clean and dressed", "Grime off, plastics dressed."], ["car", "Great before a sale", "Buyers notice a clean engine bay."], ["chat", "Quote by text", "Tell us the vehicle and we'll text a price."]]],
  ["motorcycle-detailing", "Motorcycle Detailing", "Motorcycle Detailing Champaign, IL – Quote | Gloss Spot", "Motorcycle detailing in Champaign, IL. Paint, chrome and wheels cleaned and protected. Send a photo and get a quote by text today.", "Paint, chrome and wheels, done by hand.", "Motorcycle Detail",
    [["sparkle", "Paint and chrome", "Hand-cleaned and polished."], ["shield", "Ceramic for bikes", "Ask about coating your tank and fenders."], ["camera", "Photo quote", "Send a photo of your bike for a price."]]],
];
const quotePages = quoteOnly.map(([path, crumb, title, description, lead, svc, bens]) => ({
  path, crumb, title, description, quote: svc,
  h1: `${crumb} in <em>Champaign, IL</em>`, lead, hero: { photo: path === "headlight" ? "g4" : "g7" },
  ctas: ["quote", "call"],
  service: { name: crumb },
  blocks: [
    ["benefits", bens],
    ...(path === "headlight" ? [["reviews", 1, "What a customer said"]] : []),
    ["related", [R.packages, R.ceramic, R.contact, R.reviews]],
  ],
}));
// Put Robert's headlight review first on that page.
const hp = quotePages.find((p) => p.path === "headlight");
hp.blocks[1] = ["text", { eyebrow: "Google review", heading: "“Gloss Spot cleared them right up.”", paras: [`“${reviews.find((r) => r.name === "Robert Wengert").text}”`, "Robert Wengert"] }];

// ── Business pages ──
const b2b = [
  ["b2b-detailing", "B2B Detailing", "B2B Car Detailing Champaign, IL – Get a Quote | Gloss Spot", "B2B car detailing in Champaign, IL for companies with vehicles. One point of contact and simple invoicing. Get a quote by text or call today.", "One shop for every company vehicle.",
    [["users", "One point of contact", "You deal with Dom, not a call center."], ["calendar", "Scheduled for you", "Regular drop-offs on a set day."], ["chat", "Simple quotes", "Tell us your vehicles and how often."]]],
  ["commercial-detailing", "Commercial Detailing", "Commercial Detailing Champaign, IL – Quote | The Gloss Spot", "Commercial vehicle detailing in Champaign, IL for work trucks, vans and service vehicles. Get a quote by text or call 217-600-2108.", "Work trucks, vans and service vehicles, cleaned up.",
    [["truck", "Work vehicles welcome", "Trucks, vans and jobsite rigs."], ["sparkle", "Look professional", "A clean vehicle is a rolling business card."], ["chat", "Quote by text", "Tell us your fleet and we'll text a price."]]],
  ["fleet-detailing", "Fleet Detailing", "Fleet Detailing Champaign, IL – Quote | The Gloss Spot", "Fleet detailing in Champaign, IL. Recurring washes and details for company cars, trucks and vans. Get a fleet quote by text or call today.", "Recurring care for company cars, trucks and vans.",
    [["calendar", "Recurring schedule", "Weekly, monthly or quarterly."], ["truck", "Any mix of vehicles", "Sedans to full-size trucks."], ["users", "Owner-run", "Dom or Dylan checks every vehicle."]]],
  ["dealership-detailing", "Dealership Detailing", "Dealership Detailing Champaign, IL – Quote | The Gloss Spot", "Dealership detailing in Champaign, IL: lot-ready details and paint correction for used inventory. Get a quote by text or call 217-600-2108.", "Lot-ready inventory, without tying up your team.",
    [["sparkle", "Lot-ready finish", "Interior, exterior and paint correction."], ["clock", "Steady turnaround", "Drop off batches on a schedule."], ["chat", "Volume pricing", "Tell us your monthly volume."]]],
  ["rental-car-detailing", "Rental Car Detailing", "Rental Car Detailing Champaign, IL – Quote | The Gloss Spot", "Rental and Turo car detailing in Champaign, IL. Fast, consistent turnovers between guests. Get a quote by text or call 217-600-2108.", "Consistent turnovers between guests.",
    [["clock", "Between-guest resets", "Interior and exterior, ready for the next booking."], ["star", "Better guest reviews", "A clean car shows up in your ratings."], ["calendar", "Recurring slots", "Set times that match your calendar."]]],
  ["body-shop-detailing", "Body Shop Detailing", "Body Shop Detailing Champaign, IL – Quote | The Gloss Spot", "Body shop detailing in Champaign, IL: post-repair cleanup, polish and interior detail before your customer picks up. Get a quote today.", "The final step before your customer picks up.",
    [["sparkle", "Post-repair polish", "Compound dust, overspray haze and fingerprints, gone."], ["car", "Inside and out", "Interior detail so the whole car feels new."], ["chat", "Quote by text", "Tell us your volume and we'll text a price."]]],
];
const b2bPages = b2b.map(([path, crumb, title, description, lead, bens]) => ({
  path, crumb, title, description, quote: "Fleet / Business",
  h1: `${crumb} in <em>Champaign, IL</em>`, lead, hero: { photo: "bigCta" },
  ctas: ["quote", "call"],
  service: { name: crumb },
  blocks: [["benefits", bens], ["related", [R.packages, R.membership, R.correction, R.contact]]],
}));

// ── City pages ──
const byMin = cities.slice().sort((a, b) => a.minutes - b.minutes);
const cityPages = cities.map((c) => {
  const near = byMin.filter((x) => x.slug !== c.slug).sort((a, b) => Math.abs(a.minutes - c.minutes) - Math.abs(b.minutes - c.minutes)).slice(0, 2);
  const local = reviews.filter((r) => r.text.includes(c.name));
  const far = c.minutes >= 40;
  return {
    path: c.slug, crumb: `${c.name} car detailing`,
    title: `Car Detailing near ${c.name}, IL – Book | The Gloss Spot`,
    description: `${c.name} drivers: car detailing, ceramic coating and PPF at our Champaign, IL shop, about ${c.minutes} min away. Book online or ${CALL.toLowerCase()}`,
    h1: `${c.name} Car Detailing at Our <em>Champaign, IL</em> Shop`,
    lead: `About ${c.minutes} minutes${c.route ? ` via ${c.route}` : ""}. Book in 30 seconds.`,
    hero: { photo: ["hero", "hero2", "hero3", "hero4", "hero5"][c.minutes % 5] },
    blocks: [
      ["benefits", [["map", `~${c.minutes} min from ${c.name}`, c.note], [far ? "shield" : "clock", far ? "One trip, done right" : "Drop off, pick up", far ? "Ceramic, PPF and wraps are one drop-off. We'll text you when it's ready." : "Leave it on the way to work. We'll text you when it's ready."], ["users", "Talk to the owner", "When you pull in, you're talking to Dom."]]],
      ["serviceCards"],
      ...(local.length ? [["text", { eyebrow: "Google review", heading: `From a ${c.name} customer`, paras: local.slice(0, 2).map((r) => `“${r.text}” <br><small class="muted">${r.name}</small>`) }]] : [["reviews", 3]]),
      ["related", [R.area, ...near.map((n) => [n.slug, `${n.name} car detailing`, `About ${n.minutes} min from the shop.`]), R.packages]],
    ],
  };
});

// ── Info pages ──
const info = [
  {
    path: "about-us", crumb: "About",
    title: "About Us – Car Detailing Champaign, IL | The Gloss Spot",
    description: "Meet Dom and Dylan, the brothers behind The Gloss Spot. About 7 years of detailing, now in our own Champaign, IL shop. Book online today.",
    h1: "About Our Car Detailing Shop in <em>Champaign, IL</em>",
    lead: "Two brothers. About seven years of detailing. One shop.",
    hero: { photo: "hero3" },
    blocks: [
      ["story"],
      ["benefits", { heading: "How we work", items: [["users", "Owner-run", "You'll talk to Dom. Dom or Dylan checks every car."], ["clock", "About 7 years in", "From a trunk full of supplies to our own shop."], ["star", `${biz.reviewCount} Google reviews`, "All five stars, all from real customers."]] }],
      ["shopPhotos"],
      ["reviews", 3],
    ],
  },
  {
    path: "contact", crumb: "Contact",
    title: "Contact – Car Detailing Champaign, IL | The Gloss Spot",
    description: "Call or text The Gloss Spot at 217-600-2108, or visit 606 N. Country Fair Dr, Champaign, IL. Book car detailing online in 30 seconds.",
    h1: "Contact Our Car Detailing Shop in <em>Champaign, IL</em>",
    lead: "Call, text or just book. You'll talk to Dom.",
    hero: { photo: "bigCta" },
    ctas: ["call", "text"],
    quote: "Something else",
    blocks: [["contact"]],
  },
  {
    path: "faq", crumb: "FAQ",
    title: "Car Detailing FAQ – Champaign, IL | The Gloss Spot",
    description: "Answers about car detailing, ceramic coating, PPF, wraps and membership at our Champaign, IL shop. Prices, timing and booking. Book online.",
    h1: "Car Detailing FAQ, <em>Champaign, IL</em>",
    lead: "Quick answers. Still curious? Call or text Dom.",
    hero: { photo: "g2" },
    blocks: [
      ["faq", [faqs.home[0], faqs.home[1], faqs.home[2], faqs.home[4], faqs.detailing[1], faqs.ceramic[0], faqs.ceramic[2], faqs.ppf[2], faqs.wraps[0], faqs.membership[0], ["What payment do you take?", "Cash, cards, Apple Pay and Google Pay. Payment is due at pickup."], ["What's your cancellation policy?", "Reschedule or cancel with 24 hours' notice at no charge."]], "Everything people ask us"],
      ["related", [R.packages, R.ceramic, R.ppf, R.membership]],
    ],
  },
  {
    path: "gallery", crumb: "Gallery",
    title: "Car Detailing Photos – Champaign, IL | The Gloss Spot",
    description: "Real car detailing, ceramic coating and paint correction photos from our Champaign, IL shop. No stock photos. Book your detail online today.",
    h1: "Car Detailing Photos from <em>Champaign, IL</em>",
    lead: "Real customer cars. No stock photos, ever.",
    hero: { photo: "g5" },
    blocks: [["gallery", ["hero", "hero2", "hero3", "hero4", "hero5", "value", "bigCta", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9"]], ["shopPhotos"]],
  },
  {
    path: "reviews", crumb: "Reviews",
    title: "Car Detailing Reviews – Champaign, IL | The Gloss Spot",
    description: `Read ${biz.reviewCount} five-star Google reviews for The Gloss Spot, car detailing in Champaign, IL. Real customers, real words. Book online today.`,
    h1: "Car Detailing Reviews in <em>Champaign, IL</em>",
    lead: `${biz.reviewCount} five-star Google reviews. Here's what people said.`,
    hero: { photo: "hero5" },
    blocks: [["allReviews"]],
  },
  {
    path: "why-choose-us", crumb: "Why Us",
    title: "Why Choose Us – Car Detailing Champaign, IL | Gloss Spot",
    description: "Why drivers choose The Gloss Spot for car detailing in Champaign, IL: owner-run, every car checked by Dom or Dylan, clear prices. Book today.",
    h1: "Why Drivers Choose Our <em>Champaign, IL</em> Detail Shop",
    lead: "No big promises. Just specifics.",
    hero: { photo: "hero4" },
    blocks: [
      ["benefits", { items: [
        ["shield", "Checked by an owner", "Every car gets checked by Dom or Dylan before it leaves."],
        ["users", "You talk to Dom", "Not a call center, not a front desk."],
        ["calendar", "Prices up front", "Pick your vehicle and see the price before you book."],
        ["clock", "About 7 years in", "Started in a driveway, now in our own shop."],
        ["star", `${biz.reviewCount} Google reviews`, "Every one of them five stars."],
        ["sparkle", "Real photos only", "Every photo on this site is a customer car."],
      ] }],
      ["reviews", 6],
    ],
  },
  {
    path: "our-process", crumb: "Our Process",
    title: "How It Works – Car Detailing Champaign, IL | Gloss Spot",
    description: "How car detailing works at our Champaign, IL shop: book online in 30 seconds, drop off on Country Fair Dr, pick up shining. Book today.",
    h1: "How Car Detailing Works in <em>Champaign, IL</em>",
    lead: "Book. Drop off. Pick up shining.",
    hero: { photo: "hero" },
    blocks: [
      ["steps"],
      ["text", { eyebrow: "At drop-off", heading: "What to expect", bullets: ["Dom walks the car with you and notes anything to watch", "Take out valuables, leave the rest to us", "We text you when it's ready", "Dom or Dylan checks it before you get your keys"] }],
    ],
  },
  {
    path: "cost-calculator", crumb: "Price Calculator",
    title: "Car Detailing Cost Calculator – Champaign, IL | Gloss Spot",
    description: "Car detailing cost calculator for Champaign, IL. Pick a service and your vehicle size to see your exact price, then book in 30 seconds.",
    h1: "Car Detailing Price Calculator, <em>Champaign, IL</em>",
    lead: "Two taps to your exact price.",
    hero: { photo: "g3" },
    blocks: [["calculator"], ["related", [R.ppf, R.wraps, R.membership, R.packages]]],
  },
  {
    path: "book-an-appointment-1696", crumb: "Book",
    title: "Book Car Detailing Champaign, IL – 30 Sec | The Gloss Spot",
    description: "Book car detailing in Champaign, IL in 30 seconds: pick a service, your vehicle and a time. Or call or text 217-600-2108 and talk to Dom.",
    h1: "Book Car Detailing in <em>Champaign, IL</em>",
    lead: "Pick a service, your vehicle and a time. Done.",
    hero: { photo: "bigCta" },
    blocks: [],
  },
  {
    path: "service-area", crumb: "Service Area",
    title: "Car Detailing Near Me – Champaign County, IL | Gloss Spot",
    description: "Car detailing for Urbana, Savoy, Mahomet, Rantoul and all of Champaign County at our Champaign, IL shop. See drive times and book online.",
    h1: "Car Detailing for Champaign County at Our <em>Champaign, IL</em> Shop",
    lead: "One shop, central to all of Champaign County.",
    hero: { photo: "hero2" },
    blocks: [["cities"], ["shopPhotos"]],
  },
];

// ── Home ──
const home = {
  path: "", home: true, crumb: "Home",
  title: "Car Detailing Champaign, IL – Book Now | The Gloss Spot",
  description: "Car detailing in Champaign, IL by brothers Dom and Dylan. Detailing, ceramic coating, PPF and wraps. Book online in 30 seconds or call today.",
  kicker: "Car Detailing · Champaign, IL",
  h1: "Champaign's Detail Shop. Run by Two Brothers.",
  lead: "Book in 30 seconds, or call and talk to Dom.",
  hero: { photo: "hero", video: "heroDesktop", videoMobile: "heroMobile" },
  priority: "1.0",
  blocks: [
    ["serviceCards"],
    ["beforeAfter"],
    ["steps"],
    ["reviews", 6],
    ["membershipBanner"],
    ["story"],
    ["faq", [[faqs.home[0][0], faqs.home[0][1].replace("Tap Get Directions", "Drivers come in from Urbana, Savoy, Mahomet, Rantoul and all over Champaign County. Tap Get Directions")], ...faqs.home.slice(1)]],
  ],
};

// ── Blog ──
const blogIndex = {
  path: "blog", file: "blog/index.html", crumb: "Blog",
  title: "Car Care Blog – Champaign, IL | The Gloss Spot",
  description: "Short, honest car care guides from a Champaign, IL detail shop: costs, ceramic vs. wax, how often to detail. Book your detail online today.",
  h1: "Car Care Blog from <em>Champaign, IL</em>",
  lead: "Short answers from the guys doing the work.",
  hero: { photo: "g8" },
  blocks: [["postList"]],
};
const postPages = posts.map((p) => ({
  path: `blog/${p.slug}`, post: p, crumb: p.title,
  title: p.metaTitle, description: p.description,
  h1: p.h1.replace("Champaign, IL", "<em>Champaign, IL</em>"),
  lead: p.excerpt,
  hero: { photo: "g9" },
  blocks: [["post", p], ["related", [R.packages, R.ceramic, R.membership, ["blog", "More from the blog", "Short car care guides."]]]],
}));

// ── Legal + 404 ──
const legal = [
  {
    path: "privacy-policy", crumb: "Privacy Policy", kicker: "The Gloss Spot · Champaign, IL",
    title: "Privacy Policy | The Gloss Spot, Champaign, IL",
    description: "How The Gloss Spot in Champaign, IL collects, uses and protects your information when you book, request a quote or contact us.",
    h1: "Privacy Policy", lead: "Short version: we use your info to serve your car, and that's it.", hero: { photo: "g2" },
    blocks: [["legal", `<h2>What we collect</h2><p>When you book, request a quote or contact us, we collect your name, phone number and, if you share them, your email, vehicle details, photos and notes.</p>
<h2>How we use it</h2><p>To schedule your service, send quotes, confirmations and reminders, and answer your questions. If you check "Text me," we'll text you about your quote or booking.</p>
<h2>Who we share it with</h2><p>We store bookings and contact info in our scheduling system (GoHighLevel). We never sell your information.</p>
<h2>Cookies and analytics</h2><p>On desktop, our chat widget may set cookies to remember your conversation. Embedded Google Maps may set Google cookies.</p>
<h2>Your choices</h2><p>Reply STOP to any text to opt out. To see or delete your info, call or text ${biz.phone} or email <a href="mailto:${biz.email}">${biz.email}</a>.</p>`]],
  },
  {
    path: "terms-and-conditions", crumb: "Terms", kicker: "The Gloss Spot · Champaign, IL",
    title: "Terms & Conditions | The Gloss Spot, Champaign, IL",
    description: "Booking, cancellation, payment and service terms for The Gloss Spot, car detailing at 606 N. Country Fair Dr, Champaign, IL.",
    h1: "Terms and Conditions", lead: "The fine print, kept short.", hero: { photo: "g2" },
    blocks: [["legal", `<h2>Bookings</h2><p>Your appointment is confirmed when you book online or we confirm by text or phone. We may ask for a deposit on jobs over $500.</p>
<h2>Cancellations</h2><p>Reschedule or cancel with 24 hours' notice at no charge. Late cancellations may carry a 25% fee.</p>
<h2>Drop-off and pickup</h2><p>Drop off at ${biz.address}. Please remove valuables. We'll text you when your car is ready.</p>
<h2>Vehicle condition</h2><p>We note your car's condition at drop-off. Pre-existing damage, deep scratches and heavy stains may only improve, and we'll tell you what to expect before we start.</p>
<h2>Quotes</h2><p>Online prices are for typical condition. Heavily soiled vehicles or extra requests may change the price, and we'll confirm with you first.</p>
<h2>Payment</h2><p>Payment is due at pickup. We take cash, cards, Apple Pay and Google Pay.</p>
<h2>Questions</h2><p>Call or text ${biz.phone} or email <a href="mailto:${biz.email}">${biz.email}</a>.</p>`]],
  },
  {
    path: "404", file: "404.html", crumb: "Not found", kicker: "Car Detailing · Champaign, IL", noindex: true, noSitemap: true,
    title: "Page Not Found | The Gloss Spot",
    description: "That page doesn't exist. Book car detailing in Champaign, IL online, or call or text 217-600-2108.",
    h1: "That page took a wrong turn.", lead: "Let's get you back on the road.", hero: { photo: "g8" },
    blocks: [["serviceCards"]],
  },
];

export const pages = [home, ...core, ...secondary, ...quotePages, ...b2bPages, ...info, ...cityPages, blogIndex, ...postPages, ...legal];
