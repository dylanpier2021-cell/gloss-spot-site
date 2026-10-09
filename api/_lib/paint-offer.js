// The paint correction + ceramic ad page (/paint-protection-offer) posts its
// answers to /api/ghl-quote as `offer`. This file owns that page's answer
// options (site/landing-paint-offer.js builds the page from them), turns the
// answers into tags and writes them to GHL contact custom fields. Tags are
// always worked out here from the answers, never taken from the browser.

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "CLJQbljlapECB2Aiq27f";

// [key, label] in screen order. Keys are what the page sends; labels are what
// Dom sees in GHL. `size` order must match the price rows in site/content.js.
export const OFFER = {
  interest: [["correction", "Paint correction"], ["ceramic", "Ceramic coating"], ["unsure", "Not sure"]],
  size: [["coupe", "Coupe"], ["sedan", "Sedan"], ["suv", "SUV or Truck"], ["large", "Minivan or Large SUV"]],
  paint: [["new", "Brand new"], ["few", "A few swirls"], ["dull", "Dull or lots of swirls"], ["unsure", "Not sure"]],
  keep: [["lt1", "Under 1 year"], ["1-3", "1–3 years"], ["3-6", "3–6 years"], ["6plus", "6+ years"]],
  timeline: [["now", "This month"], ["1-3mo", "Next 1–3 months"], ["looking", "Just looking"]],
  answer: [["yes", "Yes, let's do it"], ["talk", "I'd like to talk options"], ["no", "Not right now"]],
};

// How long they'll keep the car → what we recommend.
export const REC = { lt1: "correction", "1-3": "3yr", "3-6": "6yr", "6plus": "10yr" };
export const REC_LABEL = { correction: "Paint correction (one-step)", "3yr": "Ceramic 3-Year", "6yr": "Ceramic 6-Year", "10yr": "Ceramic 10-Year" };
const SERVICE = { correction: "Paint Correction", ceramic: "Ceramic Coating", unsure: "Paint Correction or Ceramic" };

// Shown next to the SMS checkbox and saved word for word on the contact.
export const SMS_CONSENT = "I agree to receive text messages from The Gloss Spot about my quote at the number above. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";

const TRACKING = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
const label = (group, key) => (OFFER[group].find(([k]) => k === key) || [])[1];
const clip = (v, n = 500) => String(v ?? "").trim().slice(0, n);

// Validates the answers. Returns null if any is missing or unknown.
export function offerLead(o, { vehicle, textMe }) {
  if (!o || typeof o !== "object") return null;
  const a = {};
  for (const g of Object.keys(OFFER)) {
    if (!label(g, o[g])) return null;
    a[g] = o[g];
  }
  const rec = REC[a.keep];
  const qualified = a.answer !== "no";
  const consent = textMe ? `Yes, ${new Date().toISOString()}` : "No";
  const track = Object.fromEntries(TRACKING.map((k) => [k, clip(o[k], 300)]));
  const pageUrl = clip(o.pageUrl, 1000);
  const quoted = clip(o.quoted, 600);

  // Custom field values by GHL field key (the part after "contact.").
  const fields = {
    offer_interest: label("interest", a.interest),
    preferred_size_of_vehicle: label("size", a.size),
    paint_condition: label("paint", a.paint),
    ownership_length: label("keep", a.keep),
    service_timeline: label("timeline", a.timeline),
    recommended_option: REC_LABEL[rec],
    quoted_price: quoted,
    price_response: label("answer", a.answer),
    vehicle_year_make_model: clip(vehicle, 200),
    sms_consent: consent,
    ...track,
    landing_page_url: pageUrl,
  };

  const src = TRACKING.filter((k) => track[k]).map((k) => `${k}=${track[k]}`).join(" ");
  const lines = [
    `Looking for: ${fields.offer_interest}`,
    `Size: ${fields.preferred_size_of_vehicle}`,
    `Paint: ${fields.paint_condition}`,
    `Keeping it: ${fields.ownership_length}`,
    `Wants it done: ${fields.service_timeline}`,
    `Recommended: ${fields.recommended_option}`,
    `Prices shown: ${quoted || "not sent"}`,
    `Price answer: ${fields.price_response}`,
    `SMS consent: ${consent}${textMe ? `\nConsent wording: "${SMS_CONSENT}"` : ""}`,
    `Ad source: ${src || "none"}`,
    pageUrl ? `Page: ${pageUrl}` : null,
  ].filter(Boolean);

  return {
    qualified,
    service: SERVICE[a.interest],
    tags: ["paint-offer-lead", `int-${a.interest}`, `rec-${rec}`, `time-${a.timeline}`, qualified ? "offer-qualified" : "offer-not-ready"],
    fields,
    lines,
  };
}

// The contact API only takes custom fields by ID, so look the IDs up by field
// key (or name). Fields that don't exist in GHL yet are skipped; the note on
// the contact still has every answer. Needs the PIT scope
// locations/customFields.readonly. Never blocks the lead.
const norm = (s) => String(s || "").toLowerCase().replace(/^contact\./, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export async function setOfferFields(token, contactId, values) {
  const headers = { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" };
  try {
    const r = await fetch(`${GHL_BASE}/locations/${LOCATION_ID}/customFields?model=contact`, { headers });
    if (!r.ok) return false;
    const list = (await r.json()).customFields || [];
    const ids = {};
    for (const f of list) ids[norm(f.name)] ??= f.id;
    for (const f of list) ids[norm(f.fieldKey)] = f.id;
    const customFields = Object.entries(values).filter(([k, v]) => ids[k] && v).map(([k, v]) => ({ id: ids[k], field_value: v }));
    if (!customFields.length) return false;
    const u = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ customFields }),
    });
    return u.ok;
  } catch {
    return false;
  }
}
