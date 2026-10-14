// Shared GoHighLevel plumbing for the website API functions. Server-side only:
// the PIT token is read from the Vercel env and never sent to the browser.

import { DOM_USER_ID, taskForDom, setServiceFields } from "./notify-dom.js";

export const GHL_BASE = "https://services.leadconnectorhq.com";
export const LOCATION_ID = "CLJQbljlapECB2Aiq27f";
// "The Gloss Spot Auto Detailing": the only calendar the website books into.
// (Never "Follow-Up Calls (Internal)" or "Window Tint".)
export const MAIN_CALENDAR_ID = "pR5kB7NNiIu7tnoGPBI5";
export const SHOP_ADDRESS = "606 N. Country Fair Dr, Champaign, IL 61821";
export const SHOP_PHONE = "217-600-2108";

// Pipelines and stages. Stage IDs are looked up by name at runtime (so a
// renamed or rebuilt stage keeps working); the IDs here are the fallback.
export const PIPELINES = {
  detailing: {
    id: "GRraamCmhOLB5wHjFdFv", name: "Car Detailing",
    stages: { booking: ["New Booking", "ebbce03f-361e-4c66-b59d-1fe52b5a1b5f"], lead: ["New Lead", "863a8484-aaa7-46ae-ab0f-ca0bf56650ce"] },
  },
  ceramic: {
    id: "AjncycVcEoB4Qa3qCcDF", name: "Ceramic coating",
    stages: { booking: ["New Lead Coating", "49a9a4c0-96b2-40a8-978a-77fdc8c8cab5"], lead: ["New Lead Coating", "49a9a4c0-96b2-40a8-978a-77fdc8c8cab5"] },
  },
};

export async function readJsonBody(req) {
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

// One GHL request. Never throws: returns { ok, status, data, error }.
export async function ghl(token, method, path, body, version = "2021-07-28") {
  try {
    const r = await fetch(GHL_BASE + path, {
      method,
      headers: { Authorization: `Bearer ${token}`, Version: version, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data, error: r.ok ? null : `${method} ${path.split("?")[0]} → ${r.status} ${data.message || data.error || ""}`.trim() };
  } catch (e) {
    return { ok: false, status: 0, data: {}, error: `${method} ${path.split("?")[0]} → ${e.message || e}` };
  }
}

export function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "-" };
}

// Create or update the contact (GHL dedupes by phone/email). Returns the id.
export async function upsertContact(token, { name, phone, email, source, tags }) {
  const { firstName, lastName } = splitName(name);
  const r = await ghl(token, "POST", "/contacts/upsert", {
    locationId: LOCATION_ID, firstName, lastName, phone,
    ...(email ? { email } : {}),
    source, assignedTo: DOM_USER_ID,
    tags: [...new Set(tags.filter(Boolean))],
  }, "2021-04-15");
  const id = r.data.contact?.id || r.data.id || r.data.contactId || null;
  return { ...r, id, ok: r.ok && !!id, error: r.ok && !id ? "Contact upsert returned no ID" : r.error };
}

export async function addTags(token, contactId, tags) {
  return ghl(token, "POST", `/contacts/${contactId}/tags`, { tags });
}

export async function addNote(token, contactId, body) {
  return ghl(token, "POST", `/contacts/${contactId}/notes`, { body, userId: DOM_USER_ID });
}

export { taskForDom, setServiceFields, DOM_USER_ID };

// ── pipeline stages (looked up by name, cached per warm function) ───────────
let stageCache = null;
async function stageId(token, pipelineKey, which) {
  const p = PIPELINES[pipelineKey];
  const [wantName, fallback] = p.stages[which];
  if (!stageCache) {
    const r = await ghl(token, "GET", `/opportunities/pipelines?locationId=${LOCATION_ID}`);
    stageCache = r.ok ? (r.data.pipelines || []) : [];
  }
  const pipe = stageCache.find((x) => x.id === p.id);
  const stage = pipe && (pipe.stages || []).find((s) => String(s.name).trim().toLowerCase() === wantName.toLowerCase());
  return stage ? stage.id : fallback;
}
export function _resetStageCache() { stageCache = null; }

// Create the opportunity. GHL allows one per contact per pipeline unless
// "Allow duplicate opportunities" is on, so for a repeat customer it answers
// OPPORTUNITY_NO_DUPLICATE with the existing id. An OPEN one is moved to this
// booking; a won/lost one is left alone (its sale stays on the books) and the
// caller tells Dom instead ({ repeatClosed: true }).
export async function createOpportunity(token, { pipeline, stage, contactId, name, value, source }) {
  const p = PIPELINES[pipeline];
  const pipelineStageId = await stageId(token, pipeline, stage);
  const body = {
    pipelineId: p.id, locationId: LOCATION_ID, pipelineStageId, contactId,
    name: String(name).slice(0, 200), status: "open",
    ...(value ? { monetaryValue: Number(value) } : {}),
    assignedTo: DOM_USER_ID, source,
  };
  const r = await ghl(token, "POST", "/opportunities/", body);
  if (r.ok) return { ...r, id: r.data.opportunity?.id || r.data.id || null, stageId: pipelineStageId };
  if (r.status !== 400 || !/duplicate/i.test(JSON.stringify(r.data))) return r;
  let existingId = r.data.meta?.existingId, status = null;
  if (existingId) {
    const g = await ghl(token, "GET", `/opportunities/${existingId}`);
    status = g.ok ? g.data.opportunity?.status : null;
  } else {
    const s = await ghl(token, "GET", `/opportunities/search?locationId=${LOCATION_ID}&contactId=${contactId}&pipelineId=${p.id}&limit=1`);
    const o = s.ok && (s.data.opportunities || [])[0];
    if (o) { existingId = o.id; status = o.status; }
  }
  if (!existingId) return r;
  if (status && status !== "open") return { ok: false, repeatClosed: true, id: existingId, status, error: `repeat customer: existing ${p.name} opportunity ${existingId} is ${status}` };
  const u = await ghl(token, "PUT", `/opportunities/${existingId}`, { pipelineId: p.id, pipelineStageId, name: body.name, status: "open", ...(value ? { monetaryValue: Number(value) } : {}) });
  return { ...u, id: existingId, stageId: pipelineStageId, updated: true };
}

export async function createAppointment(token, { startISO, endISO, contactId, title, notes, status }) {
  const r = await ghl(token, "POST", "/calendars/events/appointments", {
    calendarId: MAIN_CALENDAR_ID, locationId: LOCATION_ID, contactId,
    startTime: startISO, endTime: endISO, title,
    appointmentStatus: status || "confirmed",
    address: SHOP_ADDRESS, notes,
  }, "2021-04-15");
  return { ...r, id: r.data.id || r.data.event?.id || null };
}

// ── no lead is ever lost ────────────────────────────────────────────────────
// Called whenever any GHL step fails. Logs the whole submission (Vercel logs),
// leaves a note + task for Dom when the contact exists, and POSTs it to
// LEAD_ALERT_WEBHOOK if set (e.g. a GHL "Inbound Webhook" workflow or Zapier
// hook that texts/emails Dom; it works even when the API token is broken).
export async function alertFailure(token, { contactId, what, failures, lead }) {
  const text = `⚠️ Website ${what} needs a manual check. Failed: ${failures.join(" | ")}`;
  console.error("[LEAD-FALLBACK]", JSON.stringify({ what, failures, lead }));
  const detail = `${text}\n\n${Object.entries(lead).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n")}`;
  const jobs = [];
  if (contactId) {
    jobs.push(addNote(token, contactId, detail));
    jobs.push(taskForDom(token, contactId, `CHECK website ${what}: ${lead.name || ""} ${lead.phone || ""} – text them to confirm`, detail));
  }
  const hook = process.env.LEAD_ALERT_WEBHOOK;
  if (hook) {
    jobs.push(fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, what, failures, lead }), signal: AbortSignal.timeout(5000) }).catch((e) => console.error("[LEAD-FALLBACK] webhook failed", e.message)));
  }
  await Promise.allSettled(jobs);
}

const money = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
export { money };
