import { client } from "./client-config.js";
import {
  pageHead, topbar, navbar, footerSection, buildPage,
  htmlEscape, phoneDigits, writeHtml,
  PHONE, PHONE_TEL,
} from "./generate-landing-page.js";

// Pricing matrix per spec — used by frontend JS too (rendered into a window var).
const PRICING = {
  detail: {
    label: "Car Detailing",
    packages: {
      "Express Interior":     { Coupe:[110,1],   Sedan:[135,1.5], "Mid SUV":[165,2],   "Large SUV":[210,2.5], Minivan:[250,3]    },
      "Interior Refresh":     { Coupe:[150,1.5], Sedan:[175,2],   "Mid SUV":[225,2.5], "Large SUV":[275,3],   Minivan:[285,3.5]  },
      "Express In & Out":     { Coupe:[200,2.25],Sedan:[235,2.75],"Mid SUV":[285,3.25],"Large SUV":[335,3.75],Minivan:[350,4]    },
      "Full Interior Detail": { Coupe:[220,2.5], Sedan:[250,3],   "Mid SUV":[300,3.5], "Large SUV":[340,4],   Minivan:[400,4.75] },
      "Full Detail":          { Coupe:[300,3.5], Sedan:[350,4],   "Mid SUV":[400,4.5], "Large SUV":[450,5],   Minivan:[500,6]    },
    },
  },
  ceramic: {
    label: "Ceramic Coating",
    durations: 6,
    packages: {
      "1 Year":  { base: 200 },
      "3 Year":  { base: 700 },
      "5 Year":  { base: 1000 },
    },
    vehicleAdd: { Coupe: 0, Sedan: 50, "Mid SUV": 100, "Large SUV": 150, Minivan: 200 },
  },
  tint: {
    label: "Window Tint",
    duration: 3,
    sizes: { Coupe: "Small", Sedan: "Med", "Mid SUV": "Large", "Large SUV": "XL", Minivan: "XL" },
    packages: {
      "Obsidian":    { Small: 350, Med: 450, Large: 550, XL: 650 },
      "Ceramic IR":  { Small: 475, Med: 575, Large: 675, XL: 775 },
      "Crystalline": { Small: 890, Med: 990, Large: 1090, XL: 1190 },
    },
    addons: { Windshield: 250, Brow: 75 },
  },
  ppf: {
    label: "Paint Protection Film",
    duration: 6,
    packages: {
      "City": 300, "Rural": 700, "Highway": 850, "Autobahn": 1800, "Track Pack": 3000, "Pro Street": 6500,
    },
  },
  wrap: {
    label: "Car Wrap",
    duration: 24,
    packages: { "Misc Color": 500, "Black": 750, "White": 950 },
  },
  paintCorrection: {
    label: "Paint Correction",
    duration: 5,
    packages: { "Misc Color": 500, "Black": 750, "White": 950 },
    vehicleAdd: { Coupe: 0, Sedan: 150, "Mid SUV": 300, "Large SUV": 450, Minivan: 600 },
  },
};

const GERMAN_UPCHARGE = 100;
const GERMAN_APPLIES = ["ceramic", "ppf", "wrap", "paintCorrection"];

function bookingStyles() {
  return `
.book-wrap{background:var(--soft);padding:60px 0 110px;min-height:60vh}
.book-shell{max-width:1100px;margin:0 auto;padding:0 28px}
.book-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;margin-bottom:34px}
.book-head h1{font-size:clamp(2rem,3.6vw,2.6rem);margin:0}
.book-steps{display:flex;gap:12px;align-items:center;font-size:.86rem;color:var(--muted);font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.book-steps span{display:inline-flex;align-items:center;gap:8px}
.book-steps b{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--line);color:var(--muted);font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:.85rem}
.book-steps b.done{background:var(--primary);color:#fff}
.book-steps b.current{background:var(--ink);color:#fff}
.book-card{background:#fff;border:1px solid var(--line);border-radius:8px;padding:36px 36px 30px;box-shadow:0 18px 40px -22px rgba(0,0,0,.12)}
.book-grid{display:grid;grid-template-columns:1fr 360px;gap:36px;align-items:start}
.book-summary{position:sticky;top:120px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:28px 28px 32px}
.book-summary h4{font-family:'Inter Tight',sans-serif;font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary);margin-bottom:16px;font-weight:700}
.book-summary .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:.92rem}
.book-summary .row:last-of-type{border-bottom:none}
.book-summary .row span:first-child{color:var(--muted)}
.book-summary .row span:last-child{font-weight:600;color:var(--ink);text-align:right;max-width:60%}
.book-total{display:flex;justify-content:space-between;align-items:baseline;margin-top:18px;padding-top:18px;border-top:2px solid var(--ink)}
.book-total .lbl{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:700}
.book-total .amt{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:2.2rem;color:var(--primary);font-variation-settings:"opsz" 96}
.book-total .amt small{font-size:.85rem;color:var(--muted);font-weight:500;display:block;margin-top:2px}

.opt-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:18px}
.opt-grid-3{grid-template-columns:repeat(3,1fr)}
.opt{display:block;padding:18px 20px;border:1.5px solid var(--line);border-radius:6px;cursor:pointer;background:#fff;transition:all .2s ease}
.opt:hover{border-color:var(--primary)}
.opt.active{border-color:var(--primary);background:rgba(2,136,138,.06);box-shadow:0 8px 20px -10px rgba(2,136,138,.3)}
.opt input{display:none}
.opt .opt-name{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:1.05rem;color:var(--ink);margin-bottom:4px;letter-spacing:-.005em}
.opt .opt-desc{font-size:.85rem;color:var(--muted);line-height:1.45}
.opt .opt-price{margin-top:10px;font-family:'Bricolage Grotesque',sans-serif;font-weight:800;color:var(--primary);font-size:1.15rem}
.opt .opt-price small{color:var(--muted);font-weight:500;font-size:.78rem;margin-left:6px}

.field{display:block;margin-bottom:18px}
.field label{display:block;font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:6px;letter-spacing:.04em}
.field input,.field select,.field textarea{width:100%;padding:13px 15px;border:1.5px solid var(--line);border-radius:6px;font-family:'Inter Tight',sans-serif;font-size:1rem;color:var(--ink);background:#fff;transition:border-color .2s}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--primary)}
.field textarea{min-height:90px;resize:vertical}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}

.slot-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}
.slot{padding:13px 8px;border:1.5px solid var(--line);border-radius:6px;background:#fff;font-family:'Inter Tight',sans-serif;font-weight:600;font-size:.95rem;cursor:pointer;text-align:center;transition:all .2s}
.slot:hover{border-color:var(--primary)}
.slot.active{background:var(--primary);color:#fff;border-color:var(--primary)}
.slot-loading{padding:30px;text-align:center;color:var(--muted);font-style:italic}
.slot-empty{padding:30px;text-align:center;color:var(--muted);background:var(--soft);border-radius:6px;margin-top:18px}

.book-actions{display:flex;justify-content:space-between;gap:14px;margin-top:36px;padding-top:24px;border-top:1px solid var(--line)}
.book-back{background:transparent;color:var(--muted);border:1.5px solid var(--line)}
.book-back:hover{color:var(--ink);border-color:var(--ink)}

.book-step-title{margin-bottom:10px;font-size:1.6rem}
.book-step-desc{color:var(--muted);font-size:.97rem;margin-bottom:0}

.book-success{text-align:center;padding:40px 20px}
.book-success .icon{width:80px;height:80px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;margin:0 auto 24px;font-size:2.4rem}
.book-success h2{font-size:2rem;margin-bottom:.5em}
.book-success p{color:var(--muted);max-width:46ch;margin:0 auto 24px;line-height:1.6}

.book-error{padding:14px 18px;background:#fee;border:1px solid #fcc;border-radius:6px;color:#900;font-size:.92rem;margin-top:14px}

@media (max-width:980px){
  .book-grid{grid-template-columns:1fr}
  .book-summary{position:static;margin-top:24px}
  .opt-grid,.opt-grid-3{grid-template-columns:1fr}
  .field-row{grid-template-columns:1fr}
  .slot-grid{grid-template-columns:repeat(3,1fr)}
}
@media (max-width:580px){
  .book-card{padding:24px 22px}
  .slot-grid{grid-template-columns:repeat(2,1fr)}
  .book-summary{padding:22px}
}
`;
}

export async function generateBookingPage() {
  const description = `Book mobile detailing online with ${client.businessName}. 4-step booking — pick service, vehicle, date and time. Confirmed instantly.`;
  const head = pageHead({
    title: `Book an Appointment | ${client.businessName}`,
    description,
    canonical: `${client.domain}/book-an-appointment-1696`,
    extraStyles: bookingStyles(),
  });

  const pricingJson = JSON.stringify(PRICING);
  const germanJson = JSON.stringify({ upcharge: GERMAN_UPCHARGE, applies: GERMAN_APPLIES });

  const body = `<section class="book-wrap">
  <div class="book-shell">
    <div class="book-head">
      <div>
        <h1>Book an Appointment</h1>
        <p style="color:var(--muted);margin-top:6px;max-width:50ch">Four quick steps. Confirmed instantly. Mobile detailing across central Illinois.</p>
      </div>
      <div class="book-steps" id="stepIndicator">
        <span><b id="b1" class="current">1</b> Service</span>
        <span><b id="b2">2</b> Vehicle</span>
        <span><b id="b3">3</b> Time</span>
        <span><b id="b4">4</b> Info</span>
      </div>
    </div>

    <div class="book-grid">
      <div class="book-card" id="bookCard">

        <!-- Step 1: Service -->
        <div class="book-step" data-step="1">
          <h2 class="book-step-title">What service do you need?</h2>
          <p class="book-step-desc">Pick a category to see packages and pricing.</p>
          <div class="opt-grid opt-grid-3" id="serviceGrid">
            <label class="opt" data-svc="detail"><div class="opt-name">Car Detailing</div><div class="opt-desc">Interior, exterior, full service. 1–6 hours.</div><div class="opt-price">From $110</div></label>
            <label class="opt" data-svc="ceramic"><div class="opt-name">Ceramic Coating</div><div class="opt-desc">1, 3, or 5 year hydrophobic protection. 6 hours.</div><div class="opt-price">From $200<small>+ vehicle</small></div></label>
            <label class="opt" data-svc="tint"><div class="opt-name">Window Tinting</div><div class="opt-desc">Obsidian, Ceramic IR, Crystalline. 3 hours.</div><div class="opt-price">From $350</div></label>
            <label class="opt" data-svc="ppf"><div class="opt-name">Paint Protection Film</div><div class="opt-desc">City to Pro Street coverage tiers. 6 hours.</div><div class="opt-price">From $300</div></label>
            <label class="opt" data-svc="wrap"><div class="opt-name">Car Wrap</div><div class="opt-desc">Misc, black, white. Full vehicle. 24 hours.</div><div class="opt-price">From $500</div></label>
            <label class="opt" data-svc="paintCorrection"><div class="opt-name">Paint Correction</div><div class="opt-desc">Multi-stage polish. Pairs with ceramic. 5 hours.</div><div class="opt-price">From $500</div></label>
          </div>
          <div class="book-actions">
            <a href="/" class="btn book-back">← Back to home</a>
            <button class="btn btn-primary" id="next1" disabled>Next: Vehicle</button>
          </div>
        </div>

        <!-- Step 2: Vehicle + Package + Add-ons -->
        <div class="book-step" data-step="2" hidden>
          <h2 class="book-step-title">Pick your package</h2>
          <p class="book-step-desc">Live price + duration estimate updates as you choose.</p>

          <div id="packageBlock"></div>

          <div style="margin-top:28px">
            <label style="font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:10px;display:block;letter-spacing:.04em">Vehicle size</label>
            <div class="opt-grid" id="vehicleGrid">
              <label class="opt" data-veh="Coupe"><div class="opt-name">Coupe / Compact</div><div class="opt-desc">2-door, small footprint</div></label>
              <label class="opt" data-veh="Sedan"><div class="opt-name">Sedan</div><div class="opt-desc">4-door car, standard</div></label>
              <label class="opt" data-veh="Mid SUV"><div class="opt-name">Mid SUV</div><div class="opt-desc">CR-V, RAV4, Equinox-class</div></label>
              <label class="opt" data-veh="Large SUV"><div class="opt-name">Large SUV / Truck</div><div class="opt-desc">Tahoe, Suburban, F-150-class</div></label>
              <label class="opt" data-veh="Minivan"><div class="opt-name">Minivan</div><div class="opt-desc">Odyssey, Sienna, Pacifica</div></label>
            </div>
          </div>

          <div id="addonBlock" style="margin-top:28px"></div>

          <div style="margin-top:28px">
            <label class="opt" id="germanToggle" style="cursor:pointer;display:flex;align-items:center;gap:14px">
              <input type="checkbox" id="germanCheck" style="display:inline-block;width:auto;margin:0">
              <div>
                <div class="opt-name">German vehicle (+$100)</div>
                <div class="opt-desc">Audi, BMW, Mercedes-Benz, Porsche, VW. Applies to ceramic, PPF, wrap, paint correction only.</div>
              </div>
            </label>
          </div>

          <div class="book-actions">
            <button class="btn book-back" id="back2">← Back</button>
            <button class="btn btn-primary" id="next2" disabled>Next: Pick a Time</button>
          </div>
        </div>

        <!-- Step 3: Date + Time -->
        <div class="book-step" data-step="3" hidden>
          <h2 class="book-step-title">Pick a date &amp; time</h2>
          <p class="book-step-desc">Available slots are pulled live from our calendar.</p>

          <div class="field-row" style="margin-top:18px">
            <div class="field">
              <label>Pick a date</label>
              <input type="date" id="dateInput" min="">
            </div>
            <div class="field">
              <label>Timezone</label>
              <input type="text" value="America/Chicago" disabled>
            </div>
          </div>

          <div id="slotsBlock" style="margin-top:8px"></div>

          <div class="book-actions">
            <button class="btn book-back" id="back3">← Back</button>
            <button class="btn btn-primary" id="next3" disabled>Next: Your Info</button>
          </div>
        </div>

        <!-- Step 4: Customer Info -->
        <div class="book-step" data-step="4" hidden>
          <h2 class="book-step-title">Your information</h2>
          <p class="book-step-desc">Where should we meet you? We'll bring water and power.</p>

          <div class="field-row" style="margin-top:18px">
            <div class="field"><label>First name *</label><input type="text" id="fName" required></div>
            <div class="field"><label>Last name *</label><input type="text" id="lName" required></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Phone *</label><input type="tel" id="phone" required placeholder="217-555-0123"></div>
            <div class="field"><label>Email *</label><input type="email" id="email" required placeholder="you@email.com"></div>
          </div>
          <div class="field"><label>Service address *</label><input type="text" id="addr" required placeholder="Street, City, IL ZIP"></div>
          <div class="field"><label>Vehicle (year + make + model)</label><input type="text" id="vehicleInfo" placeholder="2022 Honda Civic — black"></div>
          <div class="field"><label>Notes (anything we should know)</label><textarea id="notes" placeholder="Pet hair, smoke smell, particular stain, parking instructions, etc."></textarea></div>

          <div id="errBox"></div>

          <div class="book-actions">
            <button class="btn book-back" id="back4">← Back</button>
            <button class="btn btn-primary" id="submitBtn">Confirm Booking →</button>
          </div>
        </div>

        <!-- Success -->
        <div class="book-step" data-step="5" hidden>
          <div class="book-success">
            <div class="icon">✓</div>
            <h2>You're booked.</h2>
            <p id="successMsg">We've confirmed your appointment and sent details to your email. ${htmlEscape(client.ownerName.split(" ")[0])} will reach out the morning of with a more precise arrival window.</p>
            <a href="/" class="btn btn-primary">Back to Home</a>
          </div>
        </div>
      </div>

      <aside class="book-summary">
        <h4>Booking Summary</h4>
        <div class="row"><span>Service</span><span id="sumService">—</span></div>
        <div class="row"><span>Package</span><span id="sumPackage">—</span></div>
        <div class="row"><span>Vehicle</span><span id="sumVehicle">—</span></div>
        <div class="row"><span>Add-ons</span><span id="sumAddons">—</span></div>
        <div class="row"><span>Duration</span><span id="sumDuration">—</span></div>
        <div class="row"><span>Date</span><span id="sumDate">—</span></div>
        <div class="row"><span>Start time</span><span id="sumTime">—</span></div>
        <div class="book-total">
          <div><div class="lbl">Estimated Total</div><div style="font-size:.78rem;color:var(--muted);margin-top:4px">Final price confirmed before service</div></div>
          <div class="amt" id="sumTotal">$0<small>0 hr</small></div>
        </div>
        <p style="margin-top:18px;font-size:.82rem;color:var(--muted);line-height:1.5">By booking you agree to our <a href="/terms-and-conditions">Terms</a> and <a href="/privacy-policy">Privacy Policy</a>.</p>
      </aside>
    </div>
  </div>
</section>

<script>
window.PRICING = ${pricingJson};
window.GERMAN = ${germanJson};
const CALENDAR_ID = "pR5kB7NNiIu7tnoGPBI5";
const TZ = "America/Chicago";

// State
const S = {
  step: 1, service: null, packageName: null, vehicle: null,
  addons: {}, isGerman: false, date: null, slot: null, slotISO: null,
  duration: 0, price: 0,
};

const $ = (id) => document.getElementById(id);
const fmt = (n) => "$" + Number(n).toLocaleString();

function setStep(n) {
  S.step = n;
  document.querySelectorAll(".book-step").forEach((el) => {
    el.hidden = parseInt(el.dataset.step, 10) !== n;
  });
  for (let i = 1; i <= 4; i++) {
    const b = $("b" + i);
    if (!b) continue;
    b.classList.remove("done", "current");
    if (i < n) b.classList.add("done");
    if (i === n) b.classList.add("current");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Step 1: service selection
document.querySelectorAll("#serviceGrid .opt").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll("#serviceGrid .opt").forEach((o) => o.classList.remove("active"));
    el.classList.add("active");
    S.service = el.dataset.svc;
    S.packageName = null; S.vehicle = null; S.addons = {}; S.isGerman = false;
    $("next1").disabled = false;
    updateSummary();
  });
});
$("next1").addEventListener("click", () => {
  renderPackagesAndAddons();
  setStep(2);
});

// Step 2: render packages + add-ons based on selected service
function renderPackagesAndAddons() {
  const cfg = window.PRICING[S.service];
  const block = $("packageBlock");
  let html = '<label style="font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:10px;display:block;letter-spacing:.04em">' + cfg.label + ' Package</label><div class="opt-grid" id="packageGrid">';
  Object.keys(cfg.packages).forEach((pkg) => {
    let priceHint = "";
    if (S.service === "detail") {
      const v = cfg.packages[pkg].Coupe;
      priceHint = '<div class="opt-price">From ' + fmt(v[0]) + '<small>· ' + v[1] + ' hr</small></div>';
    } else if (S.service === "ceramic" || S.service === "ppf" || S.service === "wrap" || S.service === "paintCorrection") {
      const base = typeof cfg.packages[pkg] === "object" ? cfg.packages[pkg].base : cfg.packages[pkg];
      priceHint = '<div class="opt-price">From ' + fmt(base) + '</div>';
    } else if (S.service === "tint") {
      const v = Object.values(cfg.packages[pkg])[0];
      priceHint = '<div class="opt-price">From ' + fmt(v) + '</div>';
    }
    html += '<label class="opt" data-pkg="' + pkg + '"><div class="opt-name">' + pkg + '</div>' + priceHint + '</label>';
  });
  html += "</div>";
  block.innerHTML = html;
  block.querySelectorAll(".opt").forEach((el) => {
    el.addEventListener("click", () => {
      block.querySelectorAll(".opt").forEach((o) => o.classList.remove("active"));
      el.classList.add("active");
      S.packageName = el.dataset.pkg;
      checkStep2();
    });
  });

  // Add-ons (tint only)
  const addonBlock = $("addonBlock");
  if (S.service === "tint") {
    addonBlock.innerHTML = '<label style="font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:10px;display:block;letter-spacing:.04em">Add-ons (optional)</label><div class="opt-grid"><label class="opt" id="addOnW"><input type="checkbox" id="addOnWindshield"><div class="opt-name">Windshield Tint</div><div class="opt-price">+$250</div></label><label class="opt" id="addOnB"><input type="checkbox" id="addOnBrow"><div class="opt-name">Brow Strip</div><div class="opt-price">+$75</div></label></div>';
    $("addOnWindshield").addEventListener("change", (e) => { S.addons.Windshield = e.target.checked; document.getElementById("addOnW").classList.toggle("active", e.target.checked); calc(); });
    $("addOnBrow").addEventListener("change", (e) => { S.addons.Brow = e.target.checked; document.getElementById("addOnB").classList.toggle("active", e.target.checked); calc(); });
  } else {
    addonBlock.innerHTML = "";
  }

  document.querySelectorAll("#vehicleGrid .opt").forEach((el) => {
    el.addEventListener("click", () => {
      document.querySelectorAll("#vehicleGrid .opt").forEach((o) => o.classList.remove("active"));
      el.classList.add("active");
      S.vehicle = el.dataset.veh;
      checkStep2();
    });
  });

  $("germanCheck").checked = false;
  $("germanCheck").addEventListener("change", (e) => {
    S.isGerman = e.target.checked;
    document.getElementById("germanToggle").classList.toggle("active", e.target.checked);
    calc();
  });
}

function checkStep2() {
  const ok = !!(S.service && S.packageName && S.vehicle);
  $("next2").disabled = !ok;
  if (ok) calc();
}

function calc() {
  const cfg = window.PRICING[S.service];
  let price = 0, hours = 0;
  if (S.service === "detail") {
    const arr = cfg.packages[S.packageName][S.vehicle];
    price = arr[0]; hours = arr[1];
  } else if (S.service === "ceramic") {
    price = cfg.packages[S.packageName].base + cfg.vehicleAdd[S.vehicle];
    hours = cfg.durations;
  } else if (S.service === "tint") {
    const size = cfg.sizes[S.vehicle];
    price = cfg.packages[S.packageName][size];
    if (S.addons.Windshield) price += cfg.addons.Windshield;
    if (S.addons.Brow) price += cfg.addons.Brow;
    hours = cfg.duration;
  } else if (S.service === "ppf") {
    price = cfg.packages[S.packageName];
    hours = cfg.duration;
  } else if (S.service === "wrap") {
    price = cfg.packages[S.packageName];
    hours = cfg.duration;
  } else if (S.service === "paintCorrection") {
    price = cfg.packages[S.packageName] + cfg.vehicleAdd[S.vehicle];
    hours = cfg.duration;
  }
  if (S.isGerman && window.GERMAN.applies.includes(S.service)) {
    price += window.GERMAN.upcharge;
  }
  S.price = price;
  S.duration = hours;
  updateSummary();
}

function updateSummary() {
  const cfg = window.PRICING[S.service];
  $("sumService").textContent = cfg ? cfg.label : "—";
  $("sumPackage").textContent = S.packageName || "—";
  $("sumVehicle").textContent = S.vehicle || "—";
  const ad = Object.entries(S.addons).filter(([, v]) => v).map(([k]) => k).join(", ");
  $("sumAddons").textContent = (ad || (S.isGerman ? "German +$100" : "—"));
  $("sumDuration").textContent = S.duration ? S.duration + " hr" : "—";
  $("sumDate").textContent = S.date || "—";
  $("sumTime").textContent = S.slot || "—";
  $("sumTotal").innerHTML = fmt(S.price) + (S.duration ? "<small>" + S.duration + " hr</small>" : "<small>0 hr</small>");
}

$("back2").addEventListener("click", () => setStep(1));
$("next2").addEventListener("click", () => {
  setStep(3);
  const today = new Date(); today.setDate(today.getDate() + 1);
  const min = today.toISOString().split("T")[0];
  $("dateInput").min = min;
  $("dateInput").value = min;
  loadSlots(min);
});

// Step 3: load slots
$("dateInput").addEventListener("change", (e) => loadSlots(e.target.value));

async function loadSlots(dateStr) {
  S.date = dateStr; S.slot = null; S.slotISO = null;
  $("next3").disabled = true;
  updateSummary();
  const block = $("slotsBlock");
  block.innerHTML = '<div class="slot-loading">Loading available times…</div>';
  try {
    const r = await fetch("/api/ghl-free-slots", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ calendarId: CALENDAR_ID, dateISO: dateStr, durationHours: S.duration }),
    });
    const data = await r.json();
    const dayKey = Object.keys(data).find((k) => /^\\d{4}-\\d{2}-\\d{2}$/.test(k));
    let slots = (dayKey && data[dayKey] && data[dayKey].slots) || [];
    // Same-day-finish guard for long jobs (≥4hr): only first slot per day
    if (S.duration >= 4 && slots.length > 0) slots = [slots[0]];
    if (slots.length === 0) {
      block.innerHTML = '<div class="slot-empty">No times available on this date. Try another day, or <a href="' + ${JSON.stringify(PHONE_TEL)} + '">call us</a>.</div>';
      return;
    }
    let html = '<div class="slot-grid">';
    slots.forEach((iso, i) => {
      const t = new Date(iso);
      const label = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
      html += '<button type="button" class="slot" data-iso="' + iso + '" data-label="' + label + '">' + label + '</button>';
    });
    html += '</div>';
    block.innerHTML = html;
    block.querySelectorAll(".slot").forEach((b) => {
      b.addEventListener("click", () => {
        block.querySelectorAll(".slot").forEach((s) => s.classList.remove("active"));
        b.classList.add("active");
        S.slot = b.dataset.label;
        S.slotISO = b.dataset.iso;
        $("next3").disabled = false;
        updateSummary();
      });
    });
  } catch (e) {
    block.innerHTML = '<div class="slot-empty">Couldn\\'t load times right now. Please <a href="' + ${JSON.stringify(PHONE_TEL)} + '">call ${PHONE}</a>.</div>';
  }
}

$("back3").addEventListener("click", () => setStep(2));
$("next3").addEventListener("click", () => setStep(4));
$("back4").addEventListener("click", () => setStep(3));

// Step 4: submit
$("submitBtn").addEventListener("click", async () => {
  const fName = $("fName").value.trim();
  const lName = $("lName").value.trim();
  const phone = $("phone").value.trim();
  const email = $("email").value.trim();
  const addr  = $("addr").value.trim();
  const vehicleInfo = $("vehicleInfo").value.trim();
  const notes = $("notes").value.trim();
  $("errBox").innerHTML = "";
  if (!fName || !lName || !phone || !email || !addr) {
    $("errBox").innerHTML = '<div class="book-error">Please fill out all required fields.</div>';
    return;
  }
  $("submitBtn").disabled = true;
  $("submitBtn").textContent = "Booking…";
  try {
    const cfg = window.PRICING[S.service];
    const payload = {
      calendarId: CALENDAR_ID,
      startISO: S.slotISO,
      durationHours: S.duration,
      name: fName + " " + lName,
      firstName: fName, lastName: lName,
      email, phone,
      address: addr,
      service: cfg.label,
      packageName: S.packageName,
      vehicle: S.vehicle,
      vehicleInfo,
      notes,
      price: S.price,
      isGerman: S.isGerman,
      addons: S.addons,
    };
    const r = await fetch("/api/ghl-create-booking", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Booking failed");
    setStep(5);
  } catch (e) {
    $("errBox").innerHTML = '<div class="book-error">' + (e.message || "Something went wrong. Call " + ${JSON.stringify(PHONE)}) + '</div>';
    $("submitBtn").disabled = false;
    $("submitBtn").textContent = "Confirm Booking →";
  }
});
</script>`;
  writeHtml("book-an-appointment-1696.html", buildPage({ head, currentPath: "/book-an-appointment-1696", body }));
  console.log(`  ✓ booking → output/book-an-appointment-1696.html`);
  return { file: "book-an-appointment-1696.html" };
}

// ── Cost calculator (no API — pure calculation) ──────────────────────────────
export async function generateCostCalculator() {
  const description = `Cost calculator for ${client.businessName} — pick service, package, and vehicle for an instant detailing estimate.`;
  const head = pageHead({
    title: `Cost Calculator | ${client.businessName}`,
    description,
    canonical: `${client.domain}/cost-calculator`,
    extraStyles: bookingStyles(),
  });

  const pricingJson = JSON.stringify(PRICING);
  const germanJson = JSON.stringify({ upcharge: GERMAN_UPCHARGE, applies: GERMAN_APPLIES });

  const body = `<section class="book-wrap">
  <div class="book-shell">
    <div class="book-head">
      <div>
        <h1>Cost Calculator</h1>
        <p style="color:var(--muted);margin-top:6px;max-width:50ch">Pick a service, package, and vehicle. Instant estimate. No email required.</p>
      </div>
    </div>

    <div class="book-grid">
      <div class="book-card">
        <h2 class="book-step-title">Service</h2>
        <div class="opt-grid opt-grid-3" id="serviceGrid">
          <label class="opt" data-svc="detail"><div class="opt-name">Car Detailing</div><div class="opt-price">From $110</div></label>
          <label class="opt" data-svc="ceramic"><div class="opt-name">Ceramic Coating</div><div class="opt-price">From $200</div></label>
          <label class="opt" data-svc="tint"><div class="opt-name">Window Tinting</div><div class="opt-price">From $350</div></label>
          <label class="opt" data-svc="ppf"><div class="opt-name">PPF</div><div class="opt-price">From $300</div></label>
          <label class="opt" data-svc="wrap"><div class="opt-name">Car Wrap</div><div class="opt-price">From $500</div></label>
          <label class="opt" data-svc="paintCorrection"><div class="opt-name">Paint Correction</div><div class="opt-price">From $500</div></label>
        </div>

        <div id="packageBlock" style="margin-top:28px"></div>

        <div style="margin-top:28px">
          <label style="font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:10px;display:block;letter-spacing:.04em">Vehicle size</label>
          <div class="opt-grid" id="vehicleGrid">
            <label class="opt" data-veh="Coupe"><div class="opt-name">Coupe / Compact</div></label>
            <label class="opt" data-veh="Sedan"><div class="opt-name">Sedan</div></label>
            <label class="opt" data-veh="Mid SUV"><div class="opt-name">Mid SUV</div></label>
            <label class="opt" data-veh="Large SUV"><div class="opt-name">Large SUV / Truck</div></label>
            <label class="opt" data-veh="Minivan"><div class="opt-name">Minivan</div></label>
          </div>
        </div>

        <div id="addonBlock" style="margin-top:28px"></div>

        <div style="margin-top:28px">
          <label class="opt" id="germanToggle" style="cursor:pointer;display:flex;align-items:center;gap:14px">
            <input type="checkbox" id="germanCheck" style="display:inline-block;width:auto;margin:0">
            <div>
              <div class="opt-name">German vehicle (+$100)</div>
              <div class="opt-desc">Audi, BMW, Mercedes, Porsche, VW. Applies to ceramic, PPF, wrap, paint correction only.</div>
            </div>
          </label>
        </div>

        <div class="book-actions">
          <a href="/packages" class="btn book-back">View packages</a>
          <a href="/book-an-appointment-1696" class="btn btn-primary" id="bookCta">Book This →</a>
        </div>
      </div>

      <aside class="book-summary">
        <h4>Estimate</h4>
        <div class="row"><span>Service</span><span id="sumService">—</span></div>
        <div class="row"><span>Package</span><span id="sumPackage">—</span></div>
        <div class="row"><span>Vehicle</span><span id="sumVehicle">—</span></div>
        <div class="row"><span>Add-ons</span><span id="sumAddons">—</span></div>
        <div class="row"><span>Duration</span><span id="sumDuration">—</span></div>
        <div class="book-total">
          <div><div class="lbl">Estimate</div><div style="font-size:.78rem;color:var(--muted);margin-top:4px">Free quote · final price confirmed before service</div></div>
          <div class="amt" id="sumTotal">$0<small>0 hr</small></div>
        </div>
        <p style="margin-top:18px;font-size:.82rem;color:var(--muted);line-height:1.5">Want to lock this in? <a href="/book-an-appointment-1696">Book online</a> or <a href="${PHONE_TEL}">call ${PHONE}</a>.</p>
      </aside>
    </div>
  </div>
</section>

<script>
window.PRICING = ${pricingJson};
window.GERMAN = ${germanJson};
const S = { service: null, packageName: null, vehicle: null, addons: {}, isGerman: false, price: 0, duration: 0 };
const $ = (id) => document.getElementById(id);
const fmt = (n) => "$" + Number(n).toLocaleString();

function renderPackages() {
  const cfg = window.PRICING[S.service];
  if (!cfg) return;
  const block = $("packageBlock");
  let html = '<label style="font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:10px;display:block;letter-spacing:.04em">' + cfg.label + ' Package</label><div class="opt-grid" id="packageGrid">';
  Object.keys(cfg.packages).forEach((pkg) => {
    let priceHint = "";
    if (S.service === "detail") {
      const v = cfg.packages[pkg].Coupe;
      priceHint = '<div class="opt-price">From ' + fmt(v[0]) + '<small>· ' + v[1] + ' hr</small></div>';
    } else if (S.service === "ceramic" || S.service === "ppf" || S.service === "wrap" || S.service === "paintCorrection") {
      const base = typeof cfg.packages[pkg] === "object" ? cfg.packages[pkg].base : cfg.packages[pkg];
      priceHint = '<div class="opt-price">From ' + fmt(base) + '</div>';
    } else if (S.service === "tint") {
      const v = Object.values(cfg.packages[pkg])[0];
      priceHint = '<div class="opt-price">From ' + fmt(v) + '</div>';
    }
    html += '<label class="opt" data-pkg="' + pkg + '"><div class="opt-name">' + pkg + '</div>' + priceHint + '</label>';
  });
  html += "</div>";
  block.innerHTML = html;
  block.querySelectorAll(".opt").forEach((el) => {
    el.addEventListener("click", () => {
      block.querySelectorAll(".opt").forEach((o) => o.classList.remove("active"));
      el.classList.add("active");
      S.packageName = el.dataset.pkg;
      calc();
    });
  });

  const addonBlock = $("addonBlock");
  if (S.service === "tint") {
    addonBlock.innerHTML = '<label style="font-size:.85rem;color:var(--muted);font-weight:600;margin-bottom:10px;display:block;letter-spacing:.04em">Add-ons</label><div class="opt-grid"><label class="opt" id="addOnW"><input type="checkbox" id="addOnWindshield"><div class="opt-name">Windshield Tint</div><div class="opt-price">+$250</div></label><label class="opt" id="addOnB"><input type="checkbox" id="addOnBrow"><div class="opt-name">Brow Strip</div><div class="opt-price">+$75</div></label></div>';
    $("addOnWindshield").addEventListener("change", (e) => { S.addons.Windshield = e.target.checked; document.getElementById("addOnW").classList.toggle("active", e.target.checked); calc(); });
    $("addOnBrow").addEventListener("change", (e) => { S.addons.Brow = e.target.checked; document.getElementById("addOnB").classList.toggle("active", e.target.checked); calc(); });
  } else { addonBlock.innerHTML = ""; }
}

document.querySelectorAll("#serviceGrid .opt").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll("#serviceGrid .opt").forEach((o) => o.classList.remove("active"));
    el.classList.add("active");
    S.service = el.dataset.svc;
    S.packageName = null; S.addons = {};
    renderPackages();
    calc();
  });
});
document.querySelectorAll("#vehicleGrid .opt").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll("#vehicleGrid .opt").forEach((o) => o.classList.remove("active"));
    el.classList.add("active");
    S.vehicle = el.dataset.veh;
    calc();
  });
});
$("germanCheck").addEventListener("change", (e) => {
  S.isGerman = e.target.checked;
  $("germanToggle").classList.toggle("active", e.target.checked);
  calc();
});

function calc() {
  if (!S.service || !S.packageName || !S.vehicle) { update(); return; }
  const cfg = window.PRICING[S.service];
  let price = 0, hours = 0;
  if (S.service === "detail") {
    const arr = cfg.packages[S.packageName][S.vehicle];
    price = arr[0]; hours = arr[1];
  } else if (S.service === "ceramic") { price = cfg.packages[S.packageName].base + cfg.vehicleAdd[S.vehicle]; hours = cfg.durations; }
  else if (S.service === "tint") {
    const size = cfg.sizes[S.vehicle]; price = cfg.packages[S.packageName][size];
    if (S.addons.Windshield) price += cfg.addons.Windshield;
    if (S.addons.Brow) price += cfg.addons.Brow;
    hours = cfg.duration;
  }
  else if (S.service === "ppf") { price = cfg.packages[S.packageName]; hours = cfg.duration; }
  else if (S.service === "wrap") { price = cfg.packages[S.packageName]; hours = cfg.duration; }
  else if (S.service === "paintCorrection") { price = cfg.packages[S.packageName] + cfg.vehicleAdd[S.vehicle]; hours = cfg.duration; }
  if (S.isGerman && window.GERMAN.applies.includes(S.service)) price += window.GERMAN.upcharge;
  S.price = price; S.duration = hours;
  update();
}

function update() {
  const cfg = window.PRICING[S.service];
  $("sumService").textContent = cfg ? cfg.label : "—";
  $("sumPackage").textContent = S.packageName || "—";
  $("sumVehicle").textContent = S.vehicle || "—";
  const ad = Object.entries(S.addons).filter(([, v]) => v).map(([k]) => k).join(", ");
  $("sumAddons").textContent = (ad || (S.isGerman ? "German +$100" : "—"));
  $("sumDuration").textContent = S.duration ? S.duration + " hr" : "—";
  $("sumTotal").innerHTML = fmt(S.price) + (S.duration ? "<small>" + S.duration + " hr</small>" : "<small>0 hr</small>");
}
</script>`;

  writeHtml("cost-calculator.html", buildPage({ head, currentPath: "/cost-calculator", body }));
  console.log(`  ✓ cost-calculator → output/cost-calculator.html`);
  return { file: "cost-calculator.html" };
}
