// Vercel serverless function: one website booking → GoHighLevel.
//   1. upsert the contact (deduped by phone), tags + service custom fields
//   2. create the appointment on the main calendar
//   3. create the opportunity in the right pipeline
//   4. note + task for Dom; ceramic: hold for the 20% deposit
// Prices are recomputed here from api/_lib/pricing.js; the browser's numbers
// are only trusted for old clients that don't send a `selection`.
// If any GHL step fails the customer still gets "Got it! We'll text you to
// confirm" and the whole submission goes to alertFailure (no lead is lost).

import { priceSelection, CLOSE_HOUR } from "./_lib/pricing.js";
import {
  readJsonBody, ghl, upsertContact, createAppointment, createOpportunity, addNote,
  setServiceFields, taskForDom, alertFailure, splitName, money,
  LOCATION_ID, SHOP_ADDRESS, DOM_USER_ID,
} from "./_lib/ghl.js";

// Wall-clock time in Chicago on the same day as `iso`, as an ISO string.
function chicagoSameDayAt(iso, hour) {
  const d = new Date(iso);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  for (const off of ["-05:00", "-06:00"]) {
    const t = new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00${off}`);
    const h = +new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hour12: false }).format(t);
    if (h % 24 === hour) return t.toISOString();
  }
  return new Date(d.getTime() + 8 * 3600e3).toISOString();
}

// Old clients (/book-headlights, cached pages) send service/packageName/price.
function legacyPick(b) {
  const svc = /headlight/i.test(b.service || "") ? "headlight" : /ceramic/i.test(b.service || "") ? "ceramic" : "detailing";
  const price = Number(b.price) || 0;
  return {
    svc, service: b.service || "Car Detailing", level: b.packageName || "", sizeLabel: b.vehicle || "",
    price, total: price, hours: Number(b.durationHours) || 2, legacy: true,
    sideTag: svc === "headlight" ? "headlight" : svc === "ceramic" ? "ceramic" : /interior/i.test(b.packageName || "") ? "interior" : /exterior/i.test(b.packageName || "") ? "exterior" : "full-detail",
    lines: [], notes: [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.GHL_PIT_TOKEN;
  if (!token) {
    console.error("[LEAD-FALLBACK] GHL_PIT_TOKEN missing; booking not saved", JSON.stringify(req.body || {}));
    return res.status(500).json({ error: "GHL_PIT_TOKEN not configured on server" });
  }
  let b;
  try { b = await readJsonBody(req); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  b = b || {};

  const name = String(b.name || [b.firstName, b.lastName].filter(Boolean).join(" ")).trim();
  const phone = String(b.phone || "").trim();
  const email = String(b.email || "").trim();
  const startISO = b.startISO;
  if (!name || phone.replace(/\D/g, "").length < 10 || !startISO || isNaN(new Date(startISO))) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const p = b.selection ? priceSelection(b.selection) : legacyPick(b);
  if (p.error) return res.status(400).json({ error: p.error });
  if (p.quote) return res.status(400).json({ error: "This one needs a custom quote", quote: true });

  const consent = !!(b.smsConsent ?? b.textMe);
  const ceramic = p.svc === "ceramic" && !p.legacy;
  const endISO = p.wholeDay ? chicagoSameDayAt(startISO, CLOSE_HOUR) : new Date(new Date(startISO).getTime() + Number(p.hours) * 3600e3).toISOString();
  const when = new Date(startISO).toLocaleString("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const vehicleInfo = String(b.vehicleInfo || "").trim();
  const priceTag = p.price ? ` (${money(p.price)})` : "";
  const serviceLabel = (p.level && !p.level.startsWith(p.service) ? `${p.service} – ${p.level}` : p.level || p.service) + priceTag;
  const vehicle = p.sizeLabel ? p.sizeLabel + (vehicleInfo ? ` (${vehicleInfo})` : "") : vehicleInfo;
  // <Service> – <Level> ($price) — <Vehicle size>
  const title = [serviceLabel, vehicle].filter(Boolean).join(" — ") + (ceramic ? " · PENDING DEPOSIT" : "");

  const summary = [
    `Service: ${p.service}`,
    p.side ? `Type: ${p.side}` : null,
    `Package: ${p.level || "-"}`,
    `Vehicle: ${vehicle || "-"}`,
    ...(p.lines || []).map(([l, v]) => `  ${l}: ${money(v)}`),
    p.price ? `${ceramic ? "Total" : "Price"}: ${money(p.price)}` : null,
    ceramic ? `Deposit (20%): ${money(p.deposit)} – PENDING. Balance at pickup: ${money(p.balance)}` : null,
    ...(p.notes || []),
    `When: ${when}${p.wholeDay ? " drop-off (whole day)" : ""}`,
    `Drop-off: ${SHOP_ADDRESS}`,
    `SMS consent: ${consent ? "yes" : "no"}`,
    b.page ? `Booked from: ${b.page}` : null,
    b.utm ? `Source: ${b.utm}` : null,
    b.notes ? `\nNotes from customer:\n${b.notes}` : null,
  ].filter(Boolean).join("\n");
  const lead = { name, phone, email, service: serviceLabel, vehicle, when, startISO, price: p.price, page: b.page, notes: b.notes };
  const failures = [];

  // 1. Contact.
  const tags = ["website-lead", "website-booking", p.service, consent ? "prefers-text" : null, p.sideTag, ceramic ? "deposit-pending" : null];
  const c = await upsertContact(token, { name, phone, email, source: "Website Booking", tags });
  if (!c.ok) {
    failures.push(c.error || "contact upsert failed");
    await alertFailure(token, { contactId: null, what: "booking", failures, lead });
    return res.status(200).json({ ok: true, confirmed: false, status: "received" });
  }
  const contactId = c.id;

  // 2. Appointment + service fields (in parallel).
  const [appt] = await Promise.all([
    createAppointment(token, { startISO, endISO, contactId, title, notes: summary, status: ceramic ? "new" : "confirmed" }),
    setServiceFields(token, contactId, serviceLabel, [serviceLabel, vehicle ? `Vehicle: ${vehicle}` : null, `Booked online for ${when}`, ceramic ? `Deposit ${money(p.deposit)} pending` : null].filter(Boolean).join("\n")),
  ]);
  if (!appt.ok) failures.push(appt.error);

  // 3. Opportunity. Not on the calendar → it's still a lead, not a booking.
  const { firstName, lastName } = splitName(name);
  const opp = await createOpportunity(token, {
    pipeline: p.svc === "ceramic" ? "ceramic" : "detailing",
    stage: appt.ok ? "booking" : "lead",
    contactId,
    name: `${firstName}${lastName !== "-" ? " " + lastName : ""} – ${serviceLabel}`,
    value: p.price,
    source: "Website Booking",
  });
  if (opp.repeatClosed) {
    // Repeat customer whose last job is closed out: don't overwrite that sale.
    await taskForDom(token, contactId, `Repeat customer ${name}: add this booking to their opportunity by hand`, `GHL wouldn't create a second opportunity (Allow duplicate opportunities is off) and their existing one (${opp.id}) is ${opp.status}. Turn on "Allow duplicate opportunities" in GHL settings to stop this.`);
  } else if (!opp.ok) failures.push(opp.error);

  // 4. Ceramic deposit: 20% due now; booking counts once it's paid.
  let payUrl = null;
  if (ceramic) {
    if (process.env.GHL_DEPOSIT_INVOICES === "1") {
      const today = new Date().toISOString().slice(0, 10);
      const inv = await ghl(token, "POST", "/invoices/text2pay", {
        altId: LOCATION_ID, altType: "location", name: `Ceramic deposit – ${name}`, title: "DEPOSIT", currency: "USD",
        items: [{ name: "Ceramic coating deposit (20%)", description: `${serviceLabel}, ${vehicle}. Balance of ${money(p.balance)} due at pickup.`, currency: "USD", amount: p.deposit, qty: 1, type: "one_time" }],
        contactDetails: { id: contactId, name, phoneNo: phone, email: email || "" },
        issueDate: today, dueDate: today,
        sentTo: { email: email ? [email] : [], phoneNo: [phone] },
        liveMode: true, action: "send", userId: DOM_USER_ID,
        termsNotes: `<p>20% deposit to hold your ceramic coating appointment on ${when} at ${SHOP_ADDRESS}. Final price is confirmed when we inspect your paint in person.</p>`,
      });
      if (inv.ok) payUrl = inv.data.invoiceUrl || null;
      else failures.push(inv.error);
    }
    if (!payUrl) {
      await taskForDom(token, contactId, `Send ${money(p.deposit)} ceramic deposit link to ${name} ${phone} (booking pending deposit)`, summary);
    }
  }

  // 5. Note with the full booking + consent record, and the usual task for Dom.
  const extra = await Promise.all([
    addNote(token, contactId, `WEBSITE BOOKING\n${summary}`),
    taskForDom(token, contactId, `New website booking: ${name} – ${serviceLabel} – ${when}`, summary),
  ]);
  if (!extra[0].ok) failures.push(extra[0].error);

  if (failures.length) {
    await alertFailure(token, { contactId, what: "booking", failures, lead });
    return res.status(200).json({ ok: true, confirmed: false, status: "received", contactId });
  }
  if (ceramic) {
    return res.status(200).json({ ok: true, confirmed: false, status: "pending-deposit", contactId, appointmentId: appt.id, deposit: p.deposit, balance: p.balance, total: p.price, payUrl });
  }
  return res.status(200).json({ ok: true, confirmed: true, status: "booked", contactId, appointmentId: appt.id, opportunityId: opp.id || null, price: p.price });
}

