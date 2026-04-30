# Pierson Digital — Home Service Website Agent

AI-powered website and SEO content system that deploys a complete website for any home service business in one command.

## Quick Start (5 minutes)

### 1. Install dependencies

```
npm install
```

### 2. Set up .env

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
GHL_API_KEY=your-ghl-key-here        # optional
GHL_LOCATION_ID=your-location-id     # optional
INDEXNOW_KEY=your-indexnow-key       # optional
```

Get your Anthropic API key at: https://console.anthropic.com

### 3. Fill out client-config.js

Open `client-config.js` and fill in the client's info:

**Required fields:**
- `businessName` — company name
- `niche` — industry (e.g. "Plumbing", "Roofing", "HVAC")
- `nicheKeyword` — main keyword (e.g. "plumber", "roofer")
- `nicheSlug` — URL-safe keyword (e.g. "plumbing", "roofing")
- `city` — primary city
- `state` — two-letter state code
- `cities` — all cities to target (array)
- `services` — all services offered (array)
- `phone` — business phone number
- `primaryColor` — hex color for branding
- `domain` — website URL (no trailing slash)

All other fields have smart defaults.

### 4. Deploy

```
npm run deploy
```

This runs the full pipeline:
1. Validates your config
2. Generates city landing pages
3. Generates all blog posts from auto-generated topic matrix
4. Builds sitemap.xml
5. Sets up GHL CRM (if key provided)
6. Pings IndexNow (if key provided)
7. Prints cost summary

Output goes to `output/` folder.

## Daily Blog Automation

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task → name it "Daily Blog Posts"
3. Trigger: Daily, set your preferred time (e.g. 6:00 AM)
4. Action: Start a program
   - Program: `node`
   - Arguments: `daily-cron.js`
   - Start in: `C:\Users\PC\Claude` (your project path)
5. Done — generates 3 new blog posts per day

### Manual run

```
npm run cron
```

## Individual Scripts

| Command | What it does |
|---------|-------------|
| `npm run deploy` | Full deployment (everything) |
| `npm run generate` | City landing pages only |
| `npm run blog` | All blog posts |
| `npm run blog -- --limit 5` | First 5 blog posts only |
| `npm run sitemap` | Rebuild sitemap.xml |
| `npm run ping` | Ping IndexNow |
| `npm run ghl` | GHL CRM setup |
| `npm run cron` | Daily cron (3 new posts) |

## GHL Connection

1. Go to your GHL sub-account → Settings → API Keys
2. Create a new API key with full permissions
3. Copy the Location ID from Settings → Business Info
4. Add both to your `.env` file
5. Run `npm run ghl` or include in full deploy

## IndexNow Setup

1. Go to https://www.indexnow.org
2. Generate a key
3. Add `INDEXNOW_KEY=your-key` to `.env`
4. Create a file named `{your-key}.txt` containing your key
5. Upload that file to your domain root (e.g. `https://yourdomain.com/{key}.txt`)
6. IndexNow will be pinged automatically after every publish

## Output Structure

```
output/
  Austin-landing-page.html      → city money pages
  Round-Rock-landing-page.html
  blog/
    drain-cleaning-cost-guide-austin.html
    ...
  sitemap.xml                   → auto-rebuilt every run
  posts.json                    → blog index manifest
```

## Cost Estimates

Using Claude Sonnet (`claude-sonnet-4-20250514`):
- 1 landing page: ~$0.05
- 1 blog post: ~$0.04
- Full deploy (4 cities + 128 posts): ~$6-8
- Daily cron (3 posts): ~$0.12/day

## File Overview

| File | Purpose |
|------|---------|
| `client-config.js` | Single source of truth — all client data |
| `generate-landing-page.js` | Builds premium city landing pages |
| `blog-generator.js` | Auto topic matrix + blog post generation |
| `sitemap-generator.js` | Rebuilds sitemap.xml from output/ |
| `indexnow-ping.js` | Pings IndexNow API for fast indexing |
| `ghl-setup.js` | Sets up GHL CRM pipeline + fields + tags |
| `run.js` | Master runner — one command deploys all |
| `daily-cron.js` | Daily blog automation (3 posts/day) |
