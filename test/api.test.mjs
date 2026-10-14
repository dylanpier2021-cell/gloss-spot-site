// Booking/quote API tests against a fake GHL (no network, no real records).
// Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { mockGhl, invoke } from "./mock-ghl.mjs";

process.env.GHL_PIT_TOKEN = "test-token";
const { default: booking } = await import("../api/ghl-create-booking.js");
const { default: quote } = await import("../api/ghl-quote.js");
const { default: slots, fitSlots } = await import("../api/ghl-free-slots.js");
const { _resetStageCache } = await import("../api/_lib/ghl.js");

const PIPES = { pipelines: [
  { id: "GRraamCmhOLB5wHjFdFv", name: "Car Detailing", stages: [{ id: "lead-live", name: "New Lead" }, { id: "booking-live", name: "New Booking" }] },
  { id: "AjncycVcEoB4Qa3qCcDF", name: "Ceramic coating", stages: [{ id: "coat-live", name: "New Lead Coating" }] },
] };
const START = "2026-11-10T09:00:00-06:00";
const who = { name: "Test Person", phone: "217-555-0142", email: "", smsConsent: true, page: "/packages" };

function setup(opts = {}) {
  _resetStageCache();
  delete process.env.GHL_DEPOSIT_INVOICES;
  delete process.env.LEAD_ALERT_WEBHOOK;
  return mockGhl({ pipelines: PIPES, ...opts });
}
const tagsOf = (m) => m.find("POST /contacts/upsert")[0].body.tags;
const appt = (m) => m.find("POST /calendars/events/appointments")[0]?.body;
const opp = (m) => m.find("POST /opportunities/")[0]?.body;

for (const [side, size, price, tag, title] of [
  ["interior", 2, 210, "interior", "Car Detailing – Interior Detail ($210) — SUV / regular truck"],
  ["exterior", 4, 125, "exterior", "Car Detailing – Exterior Detail ($125) — Minivan"],
]) {
  test(`detailing ${side}: contact, appointment, opportunity in New Booking`, async () => {
    const m = setup();
    const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "detailing", side, size }, price: 1 });
    m.restore();
    assert.equal(r.body.status, "booked");
    assert.deepEqual(tagsOf(m), ["website-lead", "website-booking", "Car Detailing", "prefers-text", tag]);
    assert.equal(m.find("POST /contacts/upsert")[0].body.source, "Website Booking");
    assert.equal(appt(m).title, title);
    assert.equal(appt(m).calendarId, "pR5kB7NNiIu7tnoGPBI5");
    assert.equal(appt(m).appointmentStatus, "confirmed");
    assert.deepEqual([opp(m).pipelineId, opp(m).pipelineStageId, opp(m).monetaryValue, opp(m).source, opp(m).status],
      ["GRraamCmhOLB5wHjFdFv", "booking-live", price, "Website Booking", "open"]);
    const cf = m.find("PUT /contacts/C1")[0].body.customFields.map((f) => f.id);
    assert.deepEqual(cf, ["Kd86ZdcvwGizvpRudKlM", "f8ITMzirWa3LBlwhaBF0"]);
  });
}

test("detailing inside & out Lux minivan + 2-step, price recomputed server-side", async () => {
  const m = setup();
  const r = await invoke(booking, { ...who, startISO: START, price: 5, selection: { svc: "detailing", side: "both", level: "lux", size: 4, twoStep: true, addons: { pet: true } } });
  m.restore();
  assert.equal(r.body.price, 610);
  assert.equal(appt(m).title, "Car Detailing – Lux Package + 2-step correction ($610) — Minivan");
  assert.match(appt(m).notes, /Pet hair: \+\$50–150, final price confirmed at drop-off/);
  assert.equal((new Date(appt(m).endTime) - new Date(appt(m).startTime)) / 3600e3, 7);
  assert.ok(tagsOf(m).includes("full-detail"));
});

test("headlight from the old /book-headlights page still books + gets an opportunity", async () => {
  const m = setup();
  const r = await invoke(booking, { calendarId: "pR5kB7NNiIu7tnoGPBI5", startISO: START, durationHours: 1, name: "Test Person", phone: "2175550142", service: "Headlight Restoration", packageName: "Both headlights", vehicle: "", price: 100, textMe: true, page: "/book-headlights" });
  m.restore();
  assert.equal(r.body.status, "booked");
  assert.equal(appt(m).title, "Headlight Restoration – Both headlights ($100)");
  assert.ok(tagsOf(m).includes("headlight"));
  assert.deepEqual([opp(m).pipelineId, opp(m).pipelineStageId, opp(m).monetaryValue], ["GRraamCmhOLB5wHjFdFv", "booking-live", 100]);
});

test("headlight from the new widget", async () => {
  const m = setup();
  const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "headlight", size: 1 } });
  m.restore();
  assert.equal(appt(m).title, "Headlight Restoration – Both headlights ($100) — Sedan / small truck");
  assert.equal(r.body.price, 100);
});

test("ceramic: pending deposit, whole day blocked, Ceramic pipeline, Dom told to send link", async () => {
  const m = setup();
  const r = await invoke(booking, { ...who, startISO: "2026-11-10T08:00:00-06:00", selection: { svc: "ceramic", tier: 1, correction: 2, color: "black", german: true, size: 1 } });
  m.restore();
  assert.deepEqual([r.body.status, r.body.total, r.body.deposit, r.body.balance, r.body.payUrl], ["pending-deposit", 2200, 440, 1760, null]);
  assert.equal(appt(m).appointmentStatus, "new");
  assert.equal(appt(m).title, "Ceramic Coating – 6-Year, 2-Step correction ($2,200) — Sedan / small truck · PENDING DEPOSIT");
  assert.equal(appt(m).endTime, "2026-11-11T02:00:00.000Z"); // 8pm Chicago
  assert.ok(tagsOf(m).includes("ceramic") && tagsOf(m).includes("deposit-pending"));
  assert.deepEqual([opp(m).pipelineId, opp(m).pipelineStageId, opp(m).monetaryValue], ["AjncycVcEoB4Qa3qCcDF", "coat-live", 2200]);
  assert.ok(m.find("POST /contacts/C1/tasks").some((t) => /Send \$440 ceramic deposit link/.test(t.body.title)));
  assert.equal(m.find("POST /invoices/text2pay").length, 0);
});

test("ceramic with GHL invoices switched on: text-to-pay deposit + pay link", async () => {
  const m = setup();
  process.env.GHL_DEPOSIT_INVOICES = "1";
  const r = await invoke(booking, { ...who, startISO: "2026-11-10T08:00:00-06:00", selection: { svc: "ceramic", tier: 0, correction: 1, color: "other", size: 0 } });
  m.restore();
  const inv = m.find("POST /invoices/text2pay")[0].body;
  assert.equal(inv.items[0].amount, 220);
  assert.equal(r.body.payUrl, "https://pay.example/invoice/I1");
});

test("quote-only picks are refused by the booking API", async () => {
  const m = setup();
  const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "ceramic", tier: 0, size: "oversized" } });
  m.restore();
  assert.equal(r.status, 400);
  assert.equal(m.calls.length, 0);
});

test("PPF quote: New Lead in Car Detailing, ppf-quote tag, coverage noted", async () => {
  const m = setup();
  const r = await invoke(quote, { ...who, service: "Paint Protection Film", vehicle: "2024 Tesla Model 3", coverage: "Full front", notes: "", photos: [] });
  m.restore();
  assert.equal(r.body.ok, true);
  assert.ok(tagsOf(m).includes("ppf-quote") && tagsOf(m).includes("website-quote"));
  assert.equal(m.find("POST /contacts/upsert")[0].body.source, "Website Quote");
  assert.deepEqual([opp(m).pipelineId, opp(m).pipelineStageId, opp(m).source], ["GRraamCmhOLB5wHjFdFv", "lead-live", "Website Quote"]);
  assert.match(m.find("POST /contacts/C1/notes")[0].body.body, /Coverage: Full front/);
});

test("oversized ceramic quote goes to the Ceramic pipeline", async () => {
  const m = setup();
  await invoke(quote, { ...who, service: "Ceramic Coating", vehicle: "F-350 dually", selection: { svc: "ceramic", tier: 2, size: "oversized" } });
  m.restore();
  assert.deepEqual([opp(m).pipelineId, opp(m).pipelineStageId], ["AjncycVcEoB4Qa3qCcDF", "coat-live"]);
});

// Real GHL answer (seen in live testing on 2026-10-14).
const DUP = () => new Response(JSON.stringify({ statusCode: 400, message: "Can not create duplicate opportunity for the contact.", code: "OPPORTUNITY_NO_DUPLICATE", meta: { existingId: "OLD1" } }), { status: 400 });

test("repeat customer with an OPEN opportunity: it's moved to this booking", async () => {
  const m = setup({ oppCreate: DUP, oppGet: { opportunity: { id: "OLD1", status: "open" } } });
  const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "detailing", side: "both", level: "full", size: 0 } });
  m.restore();
  assert.equal(r.body.status, "booked");
  const put = m.find("PUT /opportunities/OLD1")[0].body;
  assert.deepEqual([put.pipelineStageId, put.monetaryValue, put.status], ["booking-live", 225, "open"]);
});

test("repeat customer with a WON opportunity: the old sale is left alone, Dom gets a task, customer is booked", async () => {
  const m = setup({ oppCreate: DUP, oppGet: { opportunity: { id: "OLD1", status: "won" } } });
  const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "detailing", side: "both", level: "full", size: 0 } });
  m.restore();
  assert.equal(r.body.status, "booked");
  assert.equal(m.find("PUT /opportunities/").length, 0);
  assert.ok(m.find("POST /contacts/C1/tasks").some((t) => /Repeat customer/.test(t.body.title)));
});

test("a failed GHL step: customer gets the soft message, Dom gets a note + task, webhook fires", async () => {
  const m = setup({ fail: { "POST /opportunities/": 500 }, allowOther: true });
  process.env.LEAD_ALERT_WEBHOOK = "https://hooks.example/lead";
  const err = console.error; console.error = () => {};
  const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "detailing", side: "interior", size: 0 } });
  console.error = err; m.restore();
  assert.deepEqual([r.body.ok, r.body.confirmed, r.body.status], [true, false, "received"]);
  assert.ok(m.find("POST /contacts/C1/notes").some((n) => /needs a manual check/.test(n.body.body)));
  assert.ok(m.find("POST /contacts/C1/tasks").some((t) => /CHECK website booking/.test(t.body.title)));
  assert.equal(m.calls.filter((c) => c.path === "/lead").length, 1);
});

test("GHL down entirely: nothing saved in GHL but the lead is logged + webhooked", async () => {
  const m = setup({ fail: { "POST /contacts/upsert": 503 }, allowOther: true });
  process.env.LEAD_ALERT_WEBHOOK = "https://hooks.example/lead";
  const logged = []; const err = console.error; console.error = (...a) => logged.push(a.join(" "));
  const r = await invoke(booking, { ...who, startISO: START, selection: { svc: "detailing", side: "interior", size: 0 } });
  console.error = err; m.restore();
  assert.deepEqual([r.body.ok, r.body.status], [true, "received"]);
  assert.ok(logged.some((l) => l.includes("[LEAD-FALLBACK]") && l.includes("217-555-0142")));
  const hook = m.calls.find((c) => c.path === "/lead");
  assert.equal(hook.body.lead.phone, "217-555-0142");
});

test("free slots: a job only fits where every half hour it covers is open", () => {
  const day = (h) => h.map((x) => `2026-11-10T${x}:00-06:00`);
  const s = day(["08:00", "08:30", "09:00", "09:30", "10:00", "11:00", "11:30", "12:00", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]);
  assert.deepEqual(fitSlots(s, { durationHours: 2 }).map((x) => x.slice(11, 16)), ["08:00", "08:30", "17:00", "17:30"]); // 10:30 is taken; 2h from 18:00 runs past close
  assert.deepEqual(fitSlots(s, { durationHours: 1 }).map((x) => x.slice(11, 16)), ["08:00", "08:30", "09:00", "09:30", "11:00", "11:30", "17:00", "17:30", "18:00", "18:30"]); // 10:00 needs 10:30
  const full = day(["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"]);
  assert.deepEqual(fitSlots(full, { wholeDay: true }).map((x) => x.slice(11, 16)), ["08:00", "08:30", "09:00"]);
  assert.deepEqual(fitSlots(s, { wholeDay: true }), []); // 10:30 is booked
  const sunday = full.map((x) => x.replace("2026-11-10", "2026-11-08"));
  assert.deepEqual(fitSlots(sunday, { wholeDay: true }), []);
});

test("free slots endpoint always asks the main calendar", async () => {
  const m = setup({ slots: { "2026-11-10": { slots: ["2026-11-10T08:00:00-06:00", "2026-11-10T08:30:00-06:00"] }, traceId: "x" } });
  const r = await invoke(slots, { calendarId: "OmFAYCTDco9uQmZefcuQ", dateISO: "2026-11-10", durationHours: 1 });
  m.restore();
  assert.match(m.calls[0].path, /\/calendars\/pR5kB7NNiIu7tnoGPBI5\/free-slots/);
  assert.deepEqual(r.body, { "2026-11-10": { slots: ["2026-11-10T08:00:00-06:00"] } });
});
