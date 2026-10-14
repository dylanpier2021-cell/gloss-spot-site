// The Gloss Spot price list: the ONE place prices live.
// Used by the site build (booking widget, calculator, price cards, schema)
// and by the booking API, which recomputes every price server-side.
// Edit here, then `npm run build`.

// ── Car Detailing ───────────────────────────────────────────────────────────
// Every price list below follows DETAIL_SIZES. "Something else" is a custom
// quote (no instant booking).
export const DETAIL_SIZES = ["Coupe", "Sedan / small truck", "SUV / regular truck", "Large SUV / large truck", "Minivan"];

export const DETAILING = {
  sides: {
    interior: { name: "Interior Only", short: "Seats, carpet, mats, dash and glass.", tag: "interior" },
    exterior: { name: "Exterior Only", short: "Hand wash, wheels, tires and glass.", tag: "exterior" },
    both: { name: "Inside & Out", short: "The whole car, inside and out.", tag: "full-detail" },
  },
  // Interior Only and Exterior Only are one level each.
  interior: {
    name: "Interior Detail", prices: [165, 185, 210, 235, 275], hours: [1.75, 2, 2.25, 2.5, 3.25],
    includes: ["Full vacuum: floors, mats and seats", "Dash, panels and vents wiped down", "Interior windows cleaned", "UV protectant on plastics", "Air freshener of your choice"],
  },
  exterior: {
    name: "Exterior Detail", prices: [85, 95, 105, 115, 125], hours: [1, 1, 1.25, 1.25, 1.5],
    includes: ["Foam pre-soak and hand wash", "Wheels, tires and door jambs", "Exterior windows cleaned", "Tire dressing"],
  },
  // Inside & Out levels.
  levels: {
    express: {
      name: "Express Detail", short: "Light clean, maintenance level.", prices: [90, 100, 120, 145, 160], hours: [1, 1, 1.25, 1.5, 1.5],
      includes: ["Interior vacuum", "Dash and panel wipe-down", "Hand wash and dry", "Wheels and tires cleaned", "Windows cleaned"],
    },
    full: {
      name: "Full Detail", short: "Deep clean, inside and out.", prices: [225, 250, 285, 315, 375], hours: [2.5, 2.75, 3, 3.5, 4],
      includes: ["Foam pre-soak and hand wash", "Wheels, tires and door jambs", "Full interior vacuum, seats and mats", "Dash, panels and vents detailed", "Windows inside and out", "Tire dressing and quick sealant"],
    },
    lux: {
      name: "Lux Package", short: "Full detail + 1-step paint correction + sealant.", prices: [325, 350, 400, 450, 510], hours: [5, 5.5, 6, 6.5, 7],
      twoStepAdd: 100,
      includes: ["Everything in the Full Detail", "One-step machine paint correction", "Paint sealant for lasting gloss", "Two-step correction: +$100"],
    },
  },
  // Add-ons are confirmed at drop-off, so they never change the online price.
  addons: {
    pet: { name: "Pet hair", range: [50, 150] },
    stains: { name: "Heavy stains", range: [50, 250] },
  },
};

// ── Ceramic Coating ─────────────────────────────────────────────────────────
// Base price includes 1-step paint correction. Rows follow CERAMIC_SIZES,
// columns follow tiers. "Oversized" is a custom quote.
export const CERAMIC_SIZES = ["Coupe", "Sedan / small truck", "Small SUV / medium truck", "Large SUV / truck / minivan"];

export const CERAMIC = {
  tiers: ["3-Year", "6-Year", "10-Year"],
  prices: [
    [1100, 1450, 1800],
    [1350, 1700, 2050],
    [1600, 1950, 2300],
    [1850, 2200, 2550],
  ],
  correction: {
    1: { name: "1-Step", add: 0, short: "Included. Removes about 60–75% of swirls and light scratches.", time: "about 4–5 hours" },
    2: { name: "2-Step", add: 250, short: "Removes about 80–90% of swirls and light scratches.", time: "about 6–8 hours" },
  },
  colors: { black: { name: "Black", add: 150 }, white: { name: "White", add: 100 }, other: { name: "Other", add: 0 } },
  germanAdd: 100,
  germanMakes: "BMW, Mercedes, Audi, VW, Porsche",
  depositRate: 0.2,
  // Whole-day job: the customer drops off in the morning and the calendar is
  // blocked until close.
  latestDropOff: "09:00",
  includes: ["Paint correction included with every package", "Decon wash and panel prep", "Ceramic coating on all painted surfaces", "Hydrophobic, slick, easy-wash finish"],
};

// ── Headlight Restoration ───────────────────────────────────────────────────
export const HEADLIGHT = { name: "Headlight Restoration", level: "Both headlights", price: 100, hours: 1 };

// ── Shop hours used for booking (America/Chicago) ───────────────────────────
export const CLOSE_HOUR = 20;

const money = (n) => "$" + Number(n).toLocaleString("en-US");
const int = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));

// Price one selection. Returns { error } for an invalid pick, { quote: true }
// when it must be a custom quote, otherwise the full priced booking.
//   detailing: { svc, side: interior|exterior|both, level?: express|full|lux,
//                size: 0-4 | "other", twoStep?, addons?: { pet, stains, mold } }
//   ceramic:   { svc, tier: 0-2, correction: 1|2, color: black|white|other,
//                german: bool, size: 0-3 | "oversized" }
//   headlight: { svc, size? }
export function priceSelection(sel = {}) {
  if (sel.svc === "detailing") {
    const side = DETAILING.sides[sel.side];
    if (!side) return { error: "Pick interior, exterior or inside & out." };
    const pkg = sel.side === "both" ? DETAILING.levels[sel.level] : DETAILING[sel.side];
    if (!pkg) return { error: "Pick a level." };
    const levelName = pkg.name;
    const addons = sel.side === "exterior" ? [] : ["pet", "stains"].filter((k) => sel.addons && sel.addons[k]).map((k) => DETAILING.addons[k]);
    const base = { svc: "detailing", service: "Car Detailing", sideTag: side.tag, side: side.name, level: levelName, addons };
    if (sel.size === "other") return { ...base, quote: true, reason: "Vehicle size: something else", sizeLabel: "Something else" };
    if (sel.addons && sel.addons.mold && sel.side !== "exterior") return { ...base, quote: true, reason: "Mold", sizeLabel: DETAIL_SIZES[int(sel.size)] || "" };
    const i = int(sel.size);
    if (!(i >= 0 && i < DETAIL_SIZES.length)) return { error: "Pick a vehicle size." };
    const twoStep = sel.side === "both" && sel.level === "lux" && !!sel.twoStep;
    const price = pkg.prices[i] + (twoStep ? pkg.twoStepAdd : 0);
    const level = levelName + (twoStep ? " + 2-step correction" : "");
    return {
      ...base, level, sizeLabel: DETAIL_SIZES[i], price, total: price, hours: pkg.hours[i], twoStep,
      lines: [[`${levelName}, ${DETAIL_SIZES[i]}`, pkg.prices[i]], ...(twoStep ? [["2-step correction", pkg.twoStepAdd]] : [])],
      notes: addons.map((a) => `${a.name}: +${money(a.range[0])}–${a.range[1]}, final price confirmed at drop-off`),
    };
  }
  if (sel.svc === "ceramic") {
    const t = int(sel.tier);
    if (!(t >= 0 && t < CERAMIC.tiers.length)) return { error: "Pick a coating length." };
    const corr = CERAMIC.correction[int(sel.correction) || 1];
    if (!corr) return { error: "Pick a correction level." };
    const color = CERAMIC.colors[sel.color] || CERAMIC.colors.other;
    const german = !!sel.german;
    const level = `${CERAMIC.tiers[t]}, ${corr.name} correction`;
    const base = { svc: "ceramic", service: "Ceramic Coating", sideTag: "ceramic", level };
    if (sel.size === "oversized") return { ...base, quote: true, reason: "Oversized vehicle", sizeLabel: "Oversized (dually, long-bed HD, full-size van)" };
    const i = int(sel.size);
    if (!(i >= 0 && i < CERAMIC_SIZES.length)) return { error: "Pick a vehicle size." };
    const lines = [[`${CERAMIC.tiers[t]} coating, ${CERAMIC_SIZES[i]} (1-step correction included)`, CERAMIC.prices[i][t]]];
    if (corr.add) lines.push(["2-step correction upgrade", corr.add]);
    if (color.add) lines.push([`${color.name} paint`, color.add]);
    if (german) lines.push(["German make", CERAMIC.germanAdd]);
    const total = lines.reduce((s, [, v]) => s + v, 0);
    const deposit = Math.round(total * CERAMIC.depositRate * 100) / 100;
    return {
      ...base, sizeLabel: CERAMIC_SIZES[i], price: total, total, lines, wholeDay: true,
      deposit, balance: Math.round((total - deposit) * 100) / 100,
      paint: color.name, german,
      notes: ["Final price is confirmed when we inspect your paint in person."],
    };
  }
  if (sel.svc === "headlight") {
    const i = int(sel.size);
    const sizeLabel = i >= 0 && i < DETAIL_SIZES.length ? DETAIL_SIZES[i] : sel.size === "other" ? "Other" : "";
    return { svc: "headlight", service: HEADLIGHT.name, sideTag: "headlight", level: HEADLIGHT.level, sizeLabel, price: HEADLIGHT.price, total: HEADLIGHT.price, hours: HEADLIGHT.hours, lines: [[HEADLIGHT.level, HEADLIGHT.price]] };
  }
  return { error: "Pick a service." };
}

// Lowest price per service, for "from $" labels.
export const FROM = {
  detailing: Math.min(...DETAILING.exterior.prices, ...DETAILING.interior.prices, ...Object.values(DETAILING.levels).flatMap((l) => l.prices)),
  ceramic: Math.min(...CERAMIC.prices.flat()),
  headlight: HEADLIGHT.price,
};
