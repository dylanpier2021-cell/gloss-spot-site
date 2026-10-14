# The Gloss Spot — site repo

Static marketing site for **The Gloss Spot** (Dom & Dylan Pierson,
606 N. Country Fair Dr, Champaign, IL), deployed on Vercel.

- **Live:** https://www.theglossspotil.com (apex 307s → `www`; canonicals,
  sitemap and JSON-LD all use the `www` host — keep them matched)
- **Deploy:** Vercel serves `output/` directly. `vercel.json` sets
  `outputDirectory: output`, `cleanUrls: true`, plus redirects, security
  headers and long caching for `/assets/*`. There is no Vercel build step:
  run `npm run build` locally and commit `output/`.

## Layout

| Path | What it is |
|---|---|
| `api/_lib/pricing.js` | **Detailing, ceramic and headlight prices + the pricing function.** Used by the site build (widget, calculator, price cards, schema) AND the booking API, which reprices every booking server-side. |
| `site/content.js` | **All other business data and shared copy**: NAP, hours, PPF/wrap/plan prices, photos + alt text, reviews, FAQs, city drive times, blog posts. |
| `site/pages.js` | **Every page**: URL, title, meta, H1, hero line, buttons and content blocks. |
| `site/build.js` | Templates, JSON-LD schema, sitemap, `REDESIGN.md`. Fails the build if a title ≥60 chars, a meta ≥155, an H1 lacks "Champaign, IL", titles/metas repeat, or a core service page tops 300 body words. |
| `site/booking.js` | The guided booking widget + price calculator → `output/assets/book.js` / `book.css` (also loaded by the headlight landing page). |
| `site/styles.js` / `site/client.js` | Written to `output/assets/site.css` / `site.js` (one shared file, versioned by hash). |
| `site/media.js` | Background video loops made in OpenArt from our real photos (hotlinked from OpenArt's CDN). |
| `output/` | **The deployed site, generated.** Don't hand-edit except `review.html` / `feedback.html` (the review funnel; not generated). |
| `REDESIGN.md` | Generated deliverables: old→new URL map, every page's title/meta/H1/copy, FAQs, booking flow, schema, open items. |
| `api/` | Vercel functions: `ghl-free-slots` (only start times where the whole job fits; ceramic = morning drop-off, whole day), `ghl-create-booking`, `ghl-quote` (PPF coverage + photo upload), `ghl-feedback`. Shared GHL code in `api/_lib/ghl.js`. Every booking/quote: contact (assigned to Dom, tagged `website-lead` + a service tag), service fields "Preferred Service" / "Service Requested", appointment (bookings), **opportunity** (Car Detailing → New Booking / New Lead; Ceramic coating → New Lead Coating), note + task for Dom. Any failed GHL step → customer sees "Got it! We'll text you to confirm", Dom gets a note + task, the lead is logged (`[LEAD-FALLBACK]` in Vercel logs) and POSTed to `LEAD_ALERT_WEBHOOK`. |
| `test/` | `npm test`: the booking/quote/slots APIs against a fake GHL (no network). |
| `generate-landing-page.js`, `run.js`, `blog-generator.js`, `sitemap-generator.js`, `daily-cron.js` | **Legacy** AI generator (old mobile-detailing site). Renamed to `npm run legacy:*`. Running them overwrites `output/` with the old design. |
| `Clients/Aricka Dean/` | **Unrelated** — KEI Events landing pages. Not part of this site. |
| `lead_*.py` | Yelp lead scraper. Unrelated; excluded via `.vercelignore`. |

## Editing

- Change copy, prices or photos in `site/content.js` / `site/pages.js`, then
  `npm run build`. No API calls, no cost. Never patch `output/*.html` by hand;
  the next build overwrites it.
- Detailing/ceramic/headlight prices exist in exactly one place
  (`api/_lib/pricing.js`). The booking widget, calculator, price cards, schema
  and the booking API all read from it. Run `npm test` after API changes.
- Every old URL must keep a page. If one ever has to move, add a 301 in
  `vercel.json` and note it in `redirectsAdded` in `pages.js`.
- Booking: guided widget embedded at `#book` (not on /ppf, /car-wraps, /window-tint).
  A page's `book: { lock, preset }` in `pages.js` locks it to its own service.
  GHL calendar `pR5kB7NNiIu7tnoGPBI5` only (never Follow-Up Calls or Window Tint).

## Environment

The Vercel env needs `GHL_PIT_TOKEN` (read by everything in `api/`; needs contacts, calendars/events, opportunities and, for deposits, invoices scopes). Optional: `LEAD_ALERT_WEBHOOK` (backup alert for failed submissions), `GHL_DEPOSIT_INVOICES=1` (text the 20% ceramic deposit as a GHL invoice once Square/Stripe is connected in GHL Payments). Optional `DOM_USER_ID` overrides the GHL user that website leads go to (default: Dominic Pierson, `8TiM94RrV6V3yGwDI1Kw`). GHL sub-account: "The Gloss Spot IL" (`CLJQbljlapECB2Aiq27f`). The
legacy generator's `.env` (Anthropic key etc.) is not needed for `npm run build`.

## Known open items

- Confirm ZIP 61821 and shop hours match the Google Business Profile.
- Photo alt text is generic; replace with the real car + service per photo.
- No before/after pairs yet (`beforeAfter` in `content.js`); no brothers photo.
- Referral offer hidden until confirmed (`biz.referralConfirmed`).
- Videos and shop photos are hotlinked from OpenArt; move them to Cloudinary.
- No analytics installed.
