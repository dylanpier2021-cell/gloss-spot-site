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
| `site/content.js` | **All business data and shared copy**: NAP, hours, prices, photos + alt text, reviews, FAQs, city drive times, blog posts. |
| `site/pages.js` | **Every page**: URL, title, meta, H1, hero line, buttons and content blocks. |
| `site/build.js` | Templates, JSON-LD schema, sitemap, `REDESIGN.md`. Fails the build if a title ≥60 chars, a meta ≥155, an H1 lacks "Champaign, IL", titles/metas repeat, or a core service page tops 300 body words. |
| `site/styles.js` / `site/client.js` | Written to `output/assets/site.css` / `site.js` (one shared file, versioned by hash). |
| `site/landing-paint-offer.js` | `/paint-protection-offer`: standalone Meta-ad lead-qualification page (paint correction + ceramic). noindex/nofollow, not in the sitemap, linked from nowhere, no links out. One question per screen; posts to `/api/ghl-quote` with an `offer` object. Answer options, tags and GHL custom-field mapping live in `api/_lib/paint-offer.js`; prices come from `content.js`. `PO.responseTime` is the thank-you placeholder. |
| `site/media.js` | Background video loops made in OpenArt from our real photos (hotlinked from OpenArt's CDN). |
| `output/` | **The deployed site, generated.** Don't hand-edit except `review.html` / `feedback.html` (the review funnel; not generated). |
| `REDESIGN.md` | Generated deliverables: old→new URL map, every page's title/meta/H1/copy, FAQs, booking flow, schema, open items. |
| `api/` | Vercel functions: `ghl-free-slots`, `ghl-create-booking` (name + phone only), `ghl-quote` (quote form + photo upload), `ghl-feedback`. Every submission is assigned to Dom, tagged `website-lead`, gets a GHL task for Dom, and has its service written to the GHL contact fields "Preferred Service" / "Service Requested" (`api/_lib/notify-dom.js`). |
| `generate-landing-page.js`, `run.js`, `blog-generator.js`, `sitemap-generator.js`, `daily-cron.js` | **Legacy** AI generator (old mobile-detailing site). Renamed to `npm run legacy:*`. Running them overwrites `output/` with the old design. |
| `Clients/Aricka Dean/` | **Unrelated** — KEI Events landing pages. Not part of this site. |
| `lead_*.py` | Yelp lead scraper. Unrelated; excluded via `.vercelignore`. |

## Editing

- Change copy, prices or photos in `site/content.js` / `site/pages.js`, then
  `npm run build`. No API calls, no cost. Never patch `output/*.html` by hand;
  the next build overwrites it.
- Prices exist in exactly one place (`content.js`). The price cards, booking
  widget, calculator and schema all read from it.
- Every old URL must keep a page. If one ever has to move, add a 301 in
  `vercel.json` and note it in `redirectsAdded` in `pages.js`.
- Booking: embedded on every page at `#book`. GHL calendar `pR5kB7NNiIu7tnoGPBI5`.

## Environment

The Vercel env needs `GHL_PIT_TOKEN` (read by everything in `api/`). Optional `DOM_USER_ID` overrides the GHL user that website leads go to (default: Dominic Pierson, `8TiM94RrV6V3yGwDI1Kw`). GHL sub-account: "The Gloss Spot IL" (`CLJQbljlapECB2Aiq27f`). The
legacy generator's `.env` (Anthropic key etc.) is not needed for `npm run build`.

## Known open items

- Confirm ZIP 61821 and shop hours match the Google Business Profile.
- Photo alt text is generic; replace with the real car + service per photo.
- No before/after pairs yet (`beforeAfter` in `content.js`); no brothers photo.
- Referral offer hidden until confirmed (`biz.referralConfirmed`).
- Videos and shop photos are hotlinked from OpenArt; move them to Cloudinary.
- No analytics installed.
- `/paint-protection-offer`: fill `PO.responseTime`; create its GHL custom fields (names in `api/_lib/paint-offer.js`; the API looks them up by key, so the PIT token needs the `locations/customFields.readonly` scope). Set `META_CAPI_TOKEN` to turn on server-side Lead events.
