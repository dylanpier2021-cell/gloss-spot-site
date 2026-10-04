// Vercel serverless function — Meta Conversions API (server-side events).
// The headlight landing/thank-you pages post the same eventID they send to
// the browser pixel, so Meta deduplicates the pair.
// Inactive until META_CAPI_TOKEN is set in Vercel (Events Manager → your
// pixel → Settings → Conversions API → Generate access token). Without it,
// this returns 204 and does nothing.

const PIXEL_ID = process.env.META_PIXEL_ID || "1386818502603317";
const ALLOWED = new Set(["Schedule", "Lead", "Contact"]);

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

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const token = process.env.META_CAPI_TOKEN;
  if (!token) { res.status(204).end(); return; }

  let b;
  try { b = await readJsonBody(req); } catch { res.status(400).json({ error: "Invalid JSON" }); return; }
  const { eventName, eventId, value, currency, contentName, url, fbp, fbc } = b || {};
  if (!ALLOWED.has(eventName) || !eventId) { res.status(400).json({ error: "eventName and eventId required" }); return; }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || undefined;
  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: String(eventId).slice(0, 100),
    action_source: "website",
    event_source_url: url,
    user_data: {
      client_ip_address: ip,
      client_user_agent: req.headers["user-agent"],
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    },
    custom_data: {
      ...(value != null ? { value: Number(value), currency: currency || "USD" } : {}),
      ...(contentName ? { content_name: contentName } : {}),
    },
  };
  const test = process.env.META_TEST_EVENT_CODE; // optional, for Events Manager → Test Events

  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event], ...(test ? { test_event_code: test } : {}) }),
    });
    const j = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 502).json(r.ok ? { ok: true } : { error: "Meta rejected event", details: j });
  } catch (e) {
    res.status(502).json({ error: "Meta CAPI request failed", details: String(e.message || e) });
  }
}
