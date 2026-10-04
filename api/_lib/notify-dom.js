// Shared by the website API functions: make sure Dom hears about every
// website lead. The contact is assigned to Dom and a task is created for him,
// which GHL pushes to his app/email per his notification settings. The
// "website-lead" tag is the trigger for the "Website Lead -> Notify Dom"
// workflow in GHL (internal SMS/email). Failures here never block the lead.

const GHL_BASE = "https://services.leadconnectorhq.com";
// Dominic Pierson's GHL user (dnd.cinc@gmail.com). Override with DOM_USER_ID.
export const DOM_USER_ID = process.env.DOM_USER_ID || "8TiM94RrV6V3yGwDI1Kw";

export async function taskForDom(token, contactId, title, body) {
  try {
    const r = await fetch(`${GHL_BASE}/contacts/${contactId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        title: String(title).slice(0, 200),
        body,
        dueDate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        completed: false,
        assignedTo: DOM_USER_ID,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// GHL contact custom fields that say which service a website lead wants.
//   Preferred Service  (contact.preferred_service, text)       → short label
//   Service Requested  (contact.service_requested, long text)  → full details
export const SERVICE_FIELDS = {
  preferred: process.env.GHL_FIELD_PREFERRED_SERVICE || "Kd86ZdcvwGizvpRudKlM",
  requested: process.env.GHL_FIELD_SERVICE_REQUESTED || "f8ITMzirWa3LBlwhaBF0",
};
// Saved in a separate call after the contact upsert, so a rejected field can
// never block a booking or quote.
export async function setServiceFields(token, contactId, label, details) {
  try {
    const r = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ customFields: serviceFields(label, details) }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
export function serviceFields(label, details) {
  return [
    { id: SERVICE_FIELDS.preferred, field_value: String(label || "").slice(0, 250) },
    { id: SERVICE_FIELDS.requested, field_value: String(details || label || "") },
  ];
}
