// Vercel serverless function — upserts a contact, then creates an appointment
// in the GHL calendar. PIT token + location ID stored as env vars.

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "CLJQbljlapECB2Aiq27f";

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
    firstName, lastName, email, phone, address,
    service, packageName, vehicle, vehicleInfo,
    notes, price, isGerman, addons,
  } = body || {};

  if (!calendarId || !startISO || !durationHours || !firstName || !lastName || !email || !phone || !address) {
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
        firstName, lastName, email, phone,
        address1: address,
        source: "Website Booking",
        tags: ["website-booking", service].filter(Boolean),
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

  // Step 2: create appointment.
  const startTime = startISO;
  const endTime = new Date(new Date(startISO).getTime() + Number(durationHours) * 60 * 60 * 1000).toISOString();

  const title = `${service || "Detail"} — ${packageName || ""} — ${vehicle || ""}${vehicleInfo ? ` (${vehicleInfo})` : ""}${isGerman ? " · German" : ""}`.trim();

  const addonStr = Object.entries(addons || {}).filter(([, v]) => v).map(([k]) => k).join(", ");
  const fullNotes = [
    `Service: ${service || ""}`,
    `Package: ${packageName || ""}`,
    `Vehicle: ${vehicle || ""}${vehicleInfo ? ` — ${vehicleInfo}` : ""}`,
    isGerman ? "German vehicle upcharge applied (+$100)" : null,
    addonStr ? `Add-ons: ${addonStr}` : null,
    `Estimated total: $${price || 0}`,
    `Address: ${address}`,
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

  res.status(200).json({
    ok: true,
    contactId,
    appointmentId: apptJson.id || apptJson.event?.id || null,
  });
}
