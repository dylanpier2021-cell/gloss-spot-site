// Vercel serverless function — upserts a contact, then creates an appointment
// in the GHL calendar. PIT token + location ID stored as env vars.

import { DOM_USER_ID, taskForDom, setServiceFields } from "./_lib/notify-dom.js";

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "CLJQbljlapECB2Aiq27f";
const SHOP_ADDRESS = "606 N. Country Fair Dr, Champaign, IL";

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const token = process.env.GHL_PIT_TOKEN;
  if (!token) {
    res.status(500).json({ error: "GHL_PIT_TOKEN not configured on server" });
    return;
  }

  let body;
  try { body = await readJsonBody(req); } catch {
    res.status(400).json({ error: "Invalid JSON body" }); return;
  }

  const {
    calendarId, startISO, durationHours,
    name, email, phone,
    service, packageName, vehicle, vehicleInfo,
    notes, price, isGerman, addons, textMe, page,
  } = body || {};

  // The site's booking form only requires name + phone. `firstName`/`lastName`
  // and `address` are still accepted for older clients; the address defaults
  // to the shop now that every job is a drop-off.
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = body?.firstName || parts[0] || "";
  const lastName = body?.lastName || parts.slice(1).join(" ") || "-";
  const address = body?.address || SHOP_ADDRESS;

  // Which service this booking is for, e.g. "Headlight Restoration – 1 headlight ($50)".
  const serviceLabel = (packageName && service && packageName.startsWith(service) ? packageName
    : [service, packageName].filter(Boolean).join(" – ")) + (price ? ` ($${price})` : "");

  if (!calendarId || !startISO || !durationHours || !firstName || !phone) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: "2021-04-15",
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Step 1: upsert contact.
  let contactJson;
  try {
    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId: LOCATION_ID,
        firstName, lastName, phone,
        ...(email ? { email } : {}),
        ...(body?.address ? { address1: body.address } : {}),
        source: "Website Booking",
        assignedTo: DOM_USER_ID,
        tags: ["website-lead", "website-booking", service, textMe ? "prefers-text" : null].filter(Boolean),
      }),
    });
    contactJson = await contactRes.json();
    if (!contactRes.ok) {
      res.status(contactRes.status).json({ error: "Contact upsert failed", details: contactJson });
      return;
    }
  } catch (e) {
    res.status(502).json({ error: "GHL contact upsert error", details: String(e.message || e) });
    return;
  }

  const contactId = contactJson.contact?.id || contactJson.id || contactJson.contactId;
  if (!contactId) {
    res.status(500).json({ error: "Contact upsert returned no ID", details: contactJson });
    return;
  }

  // Tell GHL which service this is for (Preferred Service / Service Requested).
  await setServiceFields(token, contactId, serviceLabel, [serviceLabel, vehicle ? `Vehicle: ${vehicle}${vehicleInfo ? ` (${vehicleInfo})` : ""}` : null, `Booked online for ${new Date(startISO).toLocaleString("en-US", { timeZone: "America/Chicago" })}`].filter(Boolean).join("\n"));

  // Step 2: create appointment.
  const startTime = startISO;
  const endTime = new Date(new Date(startISO).getTime() + Number(durationHours) * 60 * 60 * 1000).toISOString();

  const title = [serviceLabel || "Detail", vehicle ? vehicle + (vehicleInfo ? ` (${vehicleInfo})` : "") : vehicleInfo, isGerman ? "German" : null].filter(Boolean).join(" — ");

  const addonStr = Object.entries(addons || {}).filter(([, v]) => v).map(([k]) => k).join(", ");
  const fullNotes = [
    `Service: ${service || ""}`,
    `Package: ${packageName || ""}`,
    `Vehicle: ${vehicle || ""}${vehicleInfo ? ` — ${vehicleInfo}` : ""}`,
    isGerman ? "German vehicle upcharge applied (+$100)" : null,
    addonStr ? `Add-ons: ${addonStr}` : null,
    `Estimated total: $${price || 0}`,
    `Drop-off: ${address}`,
    textMe ? "Prefers text messages" : null,
    page ? `Booked from: ${page}` : null,
    notes ? `\nNotes from customer:\n${notes}` : null,
  ].filter(Boolean).join("\n");

  let apptJson;
  try {
    const apptRes = await fetch(`${GHL_BASE}/calendars/events/appointments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        calendarId,
        locationId: LOCATION_ID,
        contactId,
        startTime,
        endTime,
        title,
        appointmentStatus: "confirmed",
        address,
        notes: fullNotes,
      }),
    });
    apptJson = await apptRes.json();
    if (!apptRes.ok) {
      res.status(apptRes.status).json({ error: "Appointment creation failed", details: apptJson, contactId });
      return;
    }
  } catch (e) {
    res.status(502).json({ error: "GHL appointment error", details: String(e.message || e) });
    return;
  }

  // Make sure Dom sees it (task assigned to him; GHL notifies him).
  const when = new Date(startTime).toLocaleString("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  await taskForDom(token, contactId, `New website booking: ${firstName} ${lastName === "-" ? "" : lastName} – ${packageName || service || "Detail"} – ${when}`.replace(/\s+/g, " "), fullNotes);

  res.status(200).json({
    ok: true,
    contactId,
    appointmentId: apptJson.id || apptJson.event?.id || null,
  });
}
