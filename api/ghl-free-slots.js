// Vercel serverless function: open booking times from the GHL calendar.
// Called from the booking widget. PIT token is read from env (server-only).
//
// GHL hands back 30-minute slot STARTS. A job only fits at a start time when
// every 30-minute slot it covers is open and it ends by close (8pm). Ceramic
// (`wholeDay`) is a morning drop-off with the rest of the day blocked.

import { readJsonBody, MAIN_CALENDAR_ID, GHL_BASE } from "./_lib/ghl.js";
import { CLOSE_HOUR, CERAMIC } from "./_lib/pricing.js";

const SLOT_MIN = 30;
const BUFFER_MIN = 15; // wrap-up time before close

// Minutes after midnight and weekday (0 = Sun) in America/Chicago.
function chicagoParts(iso) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", minute: "numeric", hour12: false, weekday: "short" }).formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t).value;
  return { min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10), wd: ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[get("weekday")] };
}

// Keep only start times where the whole job fits.
export function fitSlots(slots, { durationHours = 0.5, wholeDay = false } = {}) {
  const items = slots.map((iso) => ({ iso, ...chicagoParts(iso) }));
  const open = new Set(items.map((s) => s.min));
  const close = CLOSE_HOUR * 60;
  const [lh, lm] = CERAMIC.latestDropOff.split(":").map(Number);
  return items.filter((s) => {
    let end;
    if (wholeDay) {
      if (s.wd === 0 || s.min > lh * 60 + lm) return false; // Sunday opens at 1pm: no whole-day jobs
      end = close;
    } else {
      end = s.min + Math.max(SLOT_MIN, Math.round(Number(durationHours) * 60));
      if (end + BUFFER_MIN > close) return false;
    }
    for (let t = s.min; t < end; t += SLOT_MIN) if (!open.has(t)) return false;
    return true;
  }).map((s) => s.iso);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.GHL_PIT_TOKEN;
  if (!token) return res.status(500).json({ error: "GHL_PIT_TOKEN not configured on server" });
  let body;
  try { body = await readJsonBody(req); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  const { dateISO, durationHours = 2, wholeDay = false } = body || {};
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return res.status(400).json({ error: "dateISO required" });

  // 14-day window from the picked date (GHL often has a minimum advance buffer).
  const start = new Date(`${dateISO}T00:00:00Z`).getTime();
  const end = start + 14 * 24 * 60 * 60 * 1000 - 1;
  // Always the main booking calendar, whatever the browser sends.
  const url = `${GHL_BASE}/calendars/${MAIN_CALENDAR_ID}/free-slots?startDate=${start}&endDate=${end}&timezone=America/Chicago`;

  let r, data;
  try {
    r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Version: "2021-04-15", Accept: "application/json" } });
    data = await r.json().catch(() => ({}));
  } catch (e) {
    return res.status(502).json({ error: "GHL fetch failed", details: String(e.message || e) });
  }
  if (!r.ok) return res.status(r.status).json({ error: "GHL returned error", details: data });

  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    out[key] = { slots: fitSlots((val && val.slots) || [], { durationHours, wholeDay: !!wholeDay }) };
  }
  res.status(200).json(out);
}
