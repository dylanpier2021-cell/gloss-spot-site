// Vercel serverless function: website quote requests → GoHighLevel.
// PPF, ceramic for oversized vehicles, custom detailing (odd size, mold),
// wraps, memberships and the rest. Upserts the contact, uploads photos to the
// GHL media library, adds a note, creates the opportunity, tasks Dom.
// Photos arrive as JPEG data URLs already shrunk in the browser (~1600px).

import { priceSelection } from "./_lib/pricing.js";
import {
  readJsonBody, upsertContact, createOpportunity, addNote, setServiceFields, taskForDom,
  alertFailure, splitName, LOCATION_ID, GHL_BASE,
} from "./_lib/ghl.js";

const MAX_PHOTOS = 3;
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Which pipeline + service tag a quote belongs to.
function route(service, sel) {
  if (/protection film|ppf/i.test(service)) return { pipeline: "detailing", tag: "ppf-quote" };
  if (/ceramic/i.test(service) || sel?.svc === "ceramic") return { pipeline: "ceramic", tag: "ceramic" };
  if (/headlight/i.test(service)) return { pipeline: "detailing", tag: "headlight" };
  if (sel?.svc === "detailing") {
    const p = priceSelection(sel);
    return { pipeline: "detailing", tag: p.sideTag || "full-detail" };
  }
  return { pipeline: "detailing", tag: null };
}

// Upload one data-URL image to the GHL media library. Returns its URL or null;
// a failed photo never blocks the lead from being saved.
async function uploadPhoto(token, dataUrl, filename) {
  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!m) return null;
  try {
    const form = new FormData();
    form.append("file", new Blob([Buffer.from(m[2], "base64")], { type: m[1] }), filename);
    form.append("hosted", "false");
    form.append("name", filename);
    const r = await fetch(`${GHL_BASE}/medias/upload-file?altId=${LOCATION_ID}&altType=location`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", Accept: "application/json" },
      body: form,
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => ({}));
    return j.url || j.fileUrl || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.GHL_PIT_TOKEN;
  if (!token) {
    console.error("[LEAD-FALLBACK] GHL_PIT_TOKEN missing; quote not saved", JSON.stringify({ ...(req.body || {}), photos: undefined }));
    return res.status(500).json({ error: "GHL_PIT_TOKEN not configured on server" });
  }
  let b;
  try { b = await readJsonBody(req); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  b = b || {};

  const name = String(b.name || "").trim();
  const phone = String(b.phone || "").trim();
  if (!name || phone.replace(/\D/g, "").length < 10) return res.status(400).json({ error: "Missing required fields" });
  const email = String(b.email || "").trim();
  const service = String(b.service || "General").trim();
  const sel = b.selection && typeof b.selection === "object" ? b.selection : null;
  const priced = sel ? priceSelection(sel) : null;
  const consent = !!(b.smsConsent ?? b.textMe);
  const { pipeline, tag } = route(service, sel);
  const detail = [
    priced && priced.level ? `Package: ${priced.side ? priced.side + ", " : ""}${priced.level}` : null,
    priced && priced.sizeLabel ? `Size: ${priced.sizeLabel}` : null,
    priced && priced.reason ? `Why a quote: ${priced.reason}` : null,
    b.coverage ? `Coverage: ${b.coverage}` : null,
  ].filter(Boolean);
  const label = `${service}${b.coverage ? ` – ${b.coverage}` : ""} (quote)`;
  const lead = { name, phone, email, service: label, vehicle: b.vehicle, coverage: b.coverage, notes: b.notes, page: b.page };
  const failures = [];

  // 1. Contact.
  const c = await upsertContact(token, {
    name, phone, email, source: "Website Quote",
    tags: ["website-lead", "website-quote", `quote-${slug(service)}`, consent ? "prefers-text" : "prefers-call", tag],
  });
  if (!c.ok) {
    failures.push(c.error || "contact upsert failed");
    await alertFailure(token, { contactId: null, what: "quote request", failures, lead });
    return res.status(200).json({ ok: true, confirmed: false, status: "received" });
  }
  const contactId = c.id;

  // 2. Service fields + photos (in parallel).
  const list = Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS) : [];
  const stamp = Date.now();
  const [, ...urls] = await Promise.all([
    setServiceFields(token, contactId, label, [`${service} – quote request`, ...detail, b.vehicle ? `Vehicle: ${b.vehicle}` : null, b.notes ? `Notes: ${b.notes}` : null].filter(Boolean).join("\n")),
    ...list.map((p, i) => uploadPhoto(token, p, `quote-${slug(splitName(name).firstName)}-${stamp}-${i + 1}.jpg`)),
  ]);
  const uploaded = urls.filter(Boolean);

  // 3. Note with everything Dom needs to quote.
  const noteBody = [
    `QUOTE REQUEST: ${service}`,
    ...detail,
    `Name: ${name}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : null,
    `Vehicle: ${b.vehicle || "not given"}`,
    `Reply by: ${consent ? "TEXT (SMS consent given)" : "call"}`,
    b.page ? `Sent from: ${b.page}` : null,
    b.notes ? `\nNotes:\n${b.notes}` : null,
    uploaded.length ? `\nPhotos:\n${uploaded.join("\n")}` : null,
    list.length > uploaded.length ? `(${list.length - uploaded.length} photo(s) failed to upload; ask them to text it)` : null,
  ].filter(Boolean).join("\n");
  const note = await addNote(token, contactId, noteBody);
  if (!note.ok) failures.push(note.error);

  // 4. Opportunity: a quote is a new lead.
  const { firstName, lastName } = splitName(name);
  const opp = await createOpportunity(token, {
    pipeline, stage: "lead", contactId,
    name: `${firstName}${lastName !== "-" ? " " + lastName : ""} – ${label}`,
    source: "Website Quote",
  });
  if (opp.repeatClosed) {
    // Repeat customer whose last job is closed out: don't overwrite that sale.
    await taskForDom(token, contactId, `Repeat customer ${name}: add this quote to their opportunity by hand`, `GHL wouldn't create a second opportunity (Allow duplicate opportunities is off) and their existing one (${opp.id}) is ${opp.status}. Turn on "Allow duplicate opportunities" in GHL settings to stop this.`);
  } else if (!opp.ok) failures.push(opp.error);

  // 5. Make sure Dom sees it.
  await taskForDom(token, contactId, `New website quote: ${name} – ${label} – ${consent ? "TEXT back" : "CALL back"} ${phone}`, noteBody);

  if (failures.length) await alertFailure(token, { contactId, what: "quote request", failures, lead });
  res.status(200).json({ ok: true, confirmed: !failures.length, status: "received", contactId, photos: uploaded.length });
}
