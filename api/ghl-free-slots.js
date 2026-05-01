// Vercel serverless function — fetches available calendar slots from GoHighLevel.
// Called from the booking page client. PIT token is read from env (server-only).

const GHL_BASE = "https://services.leadconnectorhq.com";

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

// Returns the local hour (0-23.99) for a given ISO timestamp in America/Chicago.
function chicagoHourOf(iso) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric", minute: "numeric", hour12: false,
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === "hour").value, 10);
  const m = parseInt(parts.find((p) => p.type === "minute").value, 10);
  return h + m / 60;
}
function chicagoDayOf(iso) {
  const d = new Date(iso);
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short" }).format(d);
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[wd];
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
  try { body = await readJsonBody(req); } catch (e) {
    res.status(400).json({ error: "Invalid JSON body" }); return;
  }
  const { calendarId, dateISO, durationHours = 2 } = body || {};
  if (!calendarId || !dateISO) {
    res.status(400).json({ error: "calendarId and dateISO required" });
    return;
  }

  // 14-day window starting from the picked date — GHL calendars often have a
  // minimum advance buffer, so a single-day query frequently returns nothing.
  // The wrapper returns all days; the frontend decides which to show.
  const start = new Date(`${dateISO}T00:00:00Z`).getTime();
  const end = start + 14 * 24 * 60 * 60 * 1000 - 1;

  const url = `${GHL_BASE}/calendars/${encodeURIComponent(calendarId)}/free-slots?startDate=${start}&endDate=${end}&timezone=America/Chicago`;

  let r;
  try {
    r = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-04-15",
        Accept: "application/json",
      },
    });
  } catch (e) {
    res.status(502).json({ error: "GHL fetch failed", details: String(e.message || e) });
    return;
  }
  let data;
  try { data = await r.json(); } catch { data = {}; }

  if (!r.ok) {
    res.status(r.status).json({ error: "GHL returned error", details: data });
    return;
  }

  // Pass GHL's response through unchanged. GHL is the source of truth for
  // availability (Availability tab on the calendar). The previous version
  // double-filtered against business hours + duration here, which dropped
  // valid slots — especially for long-duration services like 24hr ceramic.
  res.status(200).json(data);
}
