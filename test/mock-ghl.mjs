// Fake GoHighLevel for tests: records every API call the handlers make and
// answers like GHL does. No network, no real records.
export function mockGhl(opts = {}) {
  const calls = [];
  const fail = opts.fail || {}; // { "POST /opportunities/": 500, ... }
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const method = (init.method || "GET").toUpperCase();
    const key = `${method} ${u.pathname}`;
    let body = init.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }
    calls.push({ key, path: u.pathname, query: Object.fromEntries(u.searchParams), body, headers: init.headers || {} });
    const failCode = Object.entries(fail).find(([k]) => key.startsWith(k))?.[1];
    if (u.hostname !== "services.leadconnectorhq.com" && !opts.allowOther) return json({ error: "unexpected host " + u.hostname }, 599);
    if (failCode) return json({ message: "mock failure", statusCode: failCode }, failCode);
    if (key === "POST /contacts/upsert") return json({ contact: { id: "C1" } });
    if (/^PUT \/contacts\/[^/]+$/.test(key)) return json({ contact: { id: "C1" } });
    if (key === "POST /calendars/events/appointments") return json({ id: "A1" }, 201);
    if (/\/contacts\/[^/]+\/(tasks|notes|tags)$/.test(u.pathname)) return json({ id: "T1" }, 201);
    if (key === "GET /opportunities/pipelines") return json(opts.pipelines || { pipelines: [] });
    if (key === "POST /opportunities/") return opts.oppCreate ? opts.oppCreate(body) : json({ opportunity: { id: "O1" } }, 201);
    if (/^GET \/opportunities\/(?!search|pipelines)[^/]+$/.test(key)) return json(opts.oppGet || { opportunity: { id: u.pathname.split("/").pop(), status: "open" } });
    if (key === "GET /opportunities/search") return json(opts.oppSearch || { opportunities: [] });
    if (/^PUT \/opportunities\/[^/]+$/.test(key)) return json({ opportunity: { id: u.pathname.split("/").pop() } });
    if (key === "POST /invoices/text2pay") return json({ invoice: { _id: "I1" }, invoiceUrl: "https://pay.example/invoice/I1" });
    if (key.startsWith("GET /calendars/") && key.endsWith("/free-slots")) return json(opts.slots || {});
    if (key === "POST /medias/upload-file") return json({ url: "https://media.example/p.jpg" });
    return json({ error: "unmocked " + key }, 404);
  };
  return { calls, restore: () => { globalThis.fetch = real; }, find: (k) => calls.filter((c) => c.key.startsWith(k)) };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
// Minimal Vercel req/res pair.
export async function invoke(handler, body) {
  const req = { method: "POST", body };
  let status = 200, out;
  const res = { status(c) { status = c; return res; }, json(o) { out = o; return res; } };
  await handler(req, res);
  return { status, body: out };
}
