// Vercel serverless function — receives private feedback from /feedback (the
// 1-3 star branch of the /review funnel), upserts the contact in GHL and
// attaches the message as a note. PIT token stored as an env var.

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

  const { name, phone, email, message, rating } = body || {};

  if (!name || !message || (!phone && !email)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const parts = String(name).trim().split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ") || "-";
  const stars = Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : null;

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: "2021-04-15",
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Step 1: upsert contact so the feedback lands on their existing record.
  let contactJson;
  try {
    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId: LOCATION_ID,
        firstName, lastName,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        source: "Website Feedback",
        tags: ["website-feedback", "needs-follow-up", stars ? `rating-${stars}` : null].filter(Boolean),
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

  // Step 2: attach the feedback as a note on the contact.
  const noteBody = [
    "PRIVATE FEEDBACK FROM WEBSITE",
    stars ? `Star rating: ${stars}/5` : "Star rating: not given",
    `Name: ${name}`,
    phone ? `Phone: ${phone}` : null,
    email ? `Email: ${email}` : null,
    "",
    message,
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

  res.status(200).json({ ok: true, contactId });
}
