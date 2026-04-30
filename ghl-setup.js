import { client } from "./client-config.js";

const BASE_URL = "https://services.leadconnectorhq.com";
const API_VERSION = "2021-07-28";

// ── GHL API helper ────────────────────────────────────────────────────────────
async function ghlFetch(endpoint, method = "GET", body = null) {
  const headers = {
    Authorization: `Bearer ${client.ghlApiKey}`,
    Version: API_VERSION,
    "Content-Type": "application/json",
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`GHL ${method} ${endpoint}: HTTP ${res.status} — ${JSON.stringify(data)}`);
  }
  return data;
}

// ── Pipeline setup ────────────────────────────────────────────────────────────
async function setupPipeline() {
  console.log("  Creating pipeline: Lead Pipeline...");

  const stages = [
    { name: "New Lead", position: 0 },
    { name: "Attempted Contact", position: 1 },
    { name: "Connected", position: 2 },
    { name: "Estimate Sent", position: 3 },
    { name: "Job Booked", position: 4 },
    { name: "Job Complete", position: 5 },
    { name: "Lost", position: 6 },
  ];

  try {
    const result = await ghlFetch(
      `/opportunities/pipelines?locationId=${client.ghlLocationId}`,
      "POST",
      {
        name: `${client.niche} Leads`,
        stages,
        locationId: client.ghlLocationId,
      }
    );
    console.log(`  ✓ Pipeline created: ${result.pipeline?.name || "Success"}`);
    return result;
  } catch (err) {
    if (err.message.includes("409") || err.message.includes("already exists")) {
      console.log("  ✓ Pipeline already exists — skipping");
      return null;
    }
    throw err;
  }
}

// ── Custom fields setup ───────────────────────────────────────────────────────
async function setupCustomFields() {
  console.log("  Creating custom contact fields...");

  const fields = [
    {
      name: "Project Type",
      dataType: "TEXT",
      fieldType: "SINGLE_OPTIONS",
      options: ["Residential", "Commercial", "Emergency", "Maintenance", "Other"],
    },
    {
      name: "Square Footage",
      dataType: "NUMERICAL",
      fieldType: "NUMERICAL",
    },
    {
      name: "Service Needed",
      dataType: "TEXT",
      fieldType: "SINGLE_OPTIONS",
      options: client.services.map((s) =>
        s.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
      ),
    },
    {
      name: "Estimated Job Value",
      dataType: "MONETARY",
      fieldType: "MONETARY",
    },
    {
      name: "Lead Source",
      dataType: "TEXT",
      fieldType: "TEXT",
    },
    {
      name: "Job Address",
      dataType: "TEXT",
      fieldType: "TEXT",
    },
  ];

  let created = 0;
  for (const field of fields) {
    try {
      await ghlFetch(
        `/locations/${client.ghlLocationId}/customFields`,
        "POST",
        field
      );
      console.log(`    ✓ ${field.name}`);
      created++;
    } catch (err) {
      if (err.message.includes("409") || err.message.includes("already exists") || err.message.includes("duplicate")) {
        console.log(`    ✓ ${field.name} (already exists)`);
      } else {
        console.error(`    ✗ ${field.name}: ${err.message}`);
      }
    }
  }
  return created;
}

// ── Tags setup ────────────────────────────────────────────────────────────────
async function setupTags() {
  console.log("  Creating tags...");

  const nichePrefix = client.nicheSlug;
  const tags = [
    `${nichePrefix}-lead`,
    "estimate-sent",
    "job-booked",
    "job-complete",
    "review-requested",
  ];

  let created = 0;
  for (const tag of tags) {
    try {
      await ghlFetch(
        `/locations/${client.ghlLocationId}/tags`,
        "POST",
        { name: tag }
      );
      console.log(`    ✓ ${tag}`);
      created++;
    } catch (err) {
      if (err.message.includes("409") || err.message.includes("already exists") || err.message.includes("duplicate")) {
        console.log(`    ✓ ${tag} (already exists)`);
      } else {
        console.error(`    ✗ ${tag}: ${err.message}`);
      }
    }
  }
  return created;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function setupGHL() {
  if (!client.ghlApiKey || !client.ghlLocationId) {
    console.log("\n▸ GHL setup: skipped (no GHL_API_KEY or GHL_LOCATION_ID in .env)");
    return { setup: false };
  }

  console.log(`\n▸ Setting up GHL for ${client.businessName}...`);

  await setupPipeline();
  await setupCustomFields();
  await setupTags();

  console.log("  Done — GHL setup complete.\n");
  return { setup: true };
}

// CLI entry
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  setupGHL().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
