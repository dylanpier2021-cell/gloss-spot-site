// Vercel serverless function — "Get a Quote" form (ceramic, PPF, wraps,
// membership, etc.). Upserts the contact in GHL, uploads any photos to the
// GHL media library, then attaches everything as a note on the contact.
// Photos arrive as JPEG data URLs already shrunk in the browser (~1600px).

import { DOM_USER_ID, taskForDom } from "./_lib/notify-dom.js";

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "CLJQbljlapECB2Aiq27f";
const MAX_PHOTOS = 3;

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

const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  const { name, phone, vehicle, service, textMe, notes, photos, page } = body || {};
  if (!name || !phone) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const parts = String(name).trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ") || "-";

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
        source: "Website Quote",
        assignedTo: DOM_USER_ID,
        tags: ["website-lead", "website-quote", service ? `quote-${slug(service)}` : null, textMe ? "prefers-text" : "prefers-call"].filter(Boolean),
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

  // Step 2: photos → GHL media library.
  const list = Array.isArray(photos) ? photos.slice(0, MAX_PHOTOS) : [];
  const stamp = Date.now();
  const urls = await Promise.all(list.map((p, i) => uploadPhoto(token, p, `quote-${slug(firstName)}-${stamp}-${i + 1}.jpg`)));
  const uploaded = urls.filter(Boolean);

  // Step 3: note on the contact with everything Dom needs to quote.
  const noteBody = [
    `QUOTE REQUEST: ${service || "General"}`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Vehicle: ${vehicle || "not given"}`,
    `Reply by: ${textMe ? "TEXT" : "call"}`,
    page ? `Sent from: ${page}` : null,
    notes ? `\nNotes:\n${notes}` : null,
    uploaded.length ? `\nPhotos:\n${uploaded.join("\n")}` : null,
    list.length > uploaded.length ? `(${list.length - uploaded.length} photo(s) failed to upload; ask them to text it)` : null,
  ].filter(Boolean).join("\n");

  try {
    const noteRes = await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ body: noteBody }),
    });
    if (!noteRes.ok) {
      const details = await noteRes.json().catch(() => ({}));
      res.status(noteRes.status).json({ error: "Note creation failed", details, contactId });
      return;
    }
  } catch (e) {
    res.status(502).json({ error: "GHL note error", details: String(e.message || e), contactId });
    return;
  }

  // Make sure Dom sees it (task assigned to him; GHL notifies him).
  await taskForDom(token, contactId, `New website quote: ${name} – ${service || "General"} – ${textMe ? "TEXT back" : "CALL back"} ${phone}`, noteBody);

  res.status(200).json({ ok: true, contactId, photos: uploaded.length });
}
