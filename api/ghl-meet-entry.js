// Vercel serverless function: car meet giveaway entry from /free-detail
// (the QR code on the wall signs). Upserts the contact in GHL with name,
// phone and SMS consent, tags it for the meet, leaves a note, gives Dom a
// task, and (only if they opted in) texts them the 15% off code.

import { DOM_USER_ID, taskForDom } from "./_lib/notify-dom.js";

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "CLJQbljlapECB2Aiq27f";
const MEET_TAG = "car-meet-2026-11-21";
const CODE = "MEET15";
const EXPIRES = "Dec 21, 2026";

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function normalizePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const token = process.env.GHL_PIT_TOKEN;
  if (!token) { res.status(500).json({ error: "GHL_PIT_TOKEN not configured on server" }); return; }

  let body;
  try { body = await readJsonBody(req); } catch { res.status(400).json({ error: "Invalid JSON body" }); return; }

  const firstName = String(body.firstName || "").trim().slice(0, 60);
  const lastName = String(body.lastName || "").trim().slice(0, 60) || "-";
  const phone = normalizePhone(body.phone);
  const consent = body.consent === true;
  const car = String(body.car || "").trim().slice(0, 120);

  if (!firstName || !phone) { res.status(400).json({ error: "Name and a valid phone number are required" }); return; }

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  let contactId;
  try {
    const r = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId: LOCATION_ID,
        firstName, lastName, phone,
        source: "Car Meet QR - Nov 21 2026",
        assignedTo: DOM_USER_ID,
        tags: ["website-lead", MEET_TAG, "meet-15-off", consent ? "sms-opt-in" : "no-sms-consent"],
        ...(consent ? {} : { dnd: true }),
      }),
    });
    const j = await r.json();
    if (!r.ok) { res.status(r.status).json({ error: "Contact upsert failed", details: j }); return; }
    contactId = j.contact?.id || j.id || j.contactId;
  } catch (e) {
    res.status(502).json({ error: "GHL contact upsert error", details: String(e.message || e) }); return;
  }
  if (!contactId) { res.status(500).json({ error: "Contact upsert returned no ID" }); return; }

  const note = [
    "CAR MEET GIVEAWAY ENTRY (Sat Nov 21, 2026)",
    `Name: ${firstName} ${lastName === "-" ? "" : lastName}`.trim(),
    `Phone: ${phone}`,
    car ? `Car: ${car}` : null,
    `Text consent: ${consent ? "YES" : "NO"}`,
    `Offer: 15% off any detail, code ${CODE}, good through ${EXPIRES}`,
    "Drawing for free full detail at 2 PM.",
  ].filter(Boolean).join("\n");

  // Nothing below blocks the entry.
  await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
    method: "POST", headers, body: JSON.stringify({ body: note }),
  }).catch(() => {});
  await taskForDom(token, contactId, `Car meet entry: ${firstName} ${lastName === "-" ? "" : lastName}`.trim(), note);

  let texted = false;
  if (consent && process.env.MEET_SEND_SMS !== "off") {
    try {
      const r = await fetch(`${GHL_BASE}/conversations/messages`, {
        method: "POST", headers,
        body: JSON.stringify({
          type: "SMS",
          contactId,
          message: `You're entered, ${firstName}! 🚗 Free full detail winner announced at 2 PM today, must be present. Everyone gets 15% off any detail with code ${CODE} (good thru ${EXPIRES}). Book: theglossspotil.com/book - The Gloss Spot. Reply STOP to opt out.`,
        }),
      });
      texted = r.ok;
    } catch {}
  }

  res.status(200).json({ ok: true, contactId, texted });
}
