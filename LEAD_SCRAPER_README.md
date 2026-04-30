# B2B Lead Scraper — Legal Data Source

Automated lead generation tool that finds businesses without websites using legal data sources (Yelp API, state licensing boards, chamber of commerce data).

**Why this is different:**
- ✅ Uses official APIs and public records (no scraping Google Maps)
- ✅ Legal and reliable — no ToS violations
- ✅ Filters to only businesses WITHOUT websites (qualified prospects for web dev/SEO services)
- ✅ Timestamped, deduplicated CSV output
- ✅ Easily configurable by niche and location
- ✅ Optional weekly automation

---

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Get Yelp API Key

1. Go to https://www.yelp.com/developers/v3/manage_app
2. Sign up (free tier available)
3. Create an app and copy your API key

### 3. Configure .env

```bash
cp .env.example .env
# Edit .env and paste your Yelp API key
nano .env
```

### 4. Run Once

```bash
# Scrape funeral homes in FL, CA, TX
python lead_scraper.py
```

**Output:** `lead_lists/funeral_homes_CA_FL_TX_2026-04-19.csv`

---

## Configuration

### Change Niche & Locations

Edit `lead_config.py`:

```python
# Add new niche (find Yelp category codes at: https://docs.yelp.com/categories)
NICHES = {
    "your_niche": {
        "yelp_category": "yelp_category_slug",
        "display_name": "Display Name",
        "description": "Description",
    },
    # ... existing niches
}

# Add/remove locations
LOCATIONS = [
    {"city": "New York", "state": "NY"},
    {"city": "Chicago", "state": "IL"},
    # ... etc
]
```

### Run for Specific Niche & States

```bash
# Python: Edit lead_scraper.py main block or use as module
python -c "from lead_scraper import scrape_leads; scrape_leads('pet_grooming', states=['FL', 'CA'])"
```

---

## CSV Output Format

Each scrape creates a timestamped CSV:

| Business Name | Phone | Address | City | State | No Website | Yelp URL | Source | Scraped At |
|---|---|---|---|---|---|---|---|---|
| Peaceful Rest Funeral Home | +1-555-0123 | 123 Main St | Miami | FL | Yes | https://yelp.com/... | yelp | 2026-04-19T14:32:00 |

**Key column:** `No Website` = "Yes" means they don't have their own website (qualified lead).

---

## Automation (Weekly Scraping)

### Option 1: APScheduler (Background Process)

```bash
# Schedule weekly scrape: Mondays 9am for funeral homes
python lead_scheduler.py start --niche funeral_homes --states FL CA TX --day monday --hour 9

# Run in background (e.g., in a terminal multiplexer like tmux)
tmux new-session -d -s lead_scraper 'python lead_scheduler.py start'

# Stop scheduler
python lead_scheduler.py stop

# List scheduled jobs
python lead_scheduler.py list

# Run once immediately
python lead_scheduler.py run-once funeral_homes --states FL CA TX
```

### Option 2: System Cron (Linux/Mac)

```bash
# Add to crontab (run Mondays 9am)
# 0 9 * * 1 cd /path/to/project && python -c "from lead_scraper import scrape_leads; scrape_leads('funeral_homes', ['FL', 'CA', 'TX'])"
```

### Option 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task → "Lead Scraper Weekly"
3. Trigger: Weekly, Monday 9:00 AM
4. Action: `python C:\path\to\lead_scraper.py`

---

## Deduplication & History

- **Automatic deduplication:** Removes duplicate (name + phone) combinations from previous 30 days
- **Timestamped CSVs:** Each run creates new file: `{niche}_{states}_{date}.csv`
- **Append behavior:** Multiple runs in same day append to the same file
- **Historical tracking:** Keep all CSVs to track new vs. old leads

```bash
# To merge all CSVs into one master list
cat lead_lists/*.csv > all_leads.csv
```

---

## Data Sources

### Currently Enabled ✅

| Source | Type | Data | Legal | Free |
|---|---|---|---|---|
| **Yelp Fusion API** | API | Business name, phone, address, Yelp URL | ✅ Official API | ✅ Free tier (5k/month) |

### Future Sources (Extensible)

| Source | Type | Data | Cost |
|---|---|---|---|
| Apollo.io | API | B2B directory, emails, domains | ~$0.01/record |
| Hunter.io | API | Email finder | Free tier + paid |
| State Licensing Boards | Web scraping | Funeral homes, contractors (regulated) | Free |
| Chamber of Commerce | API/scraping | Local business listings | Free |

---

## Troubleshooting

### "YELP_API_KEY not found in .env"

```bash
# Did you create .env?
ls -la .env

# Did you copy the key?
cat .env | grep YELP
```

### "Rate limit exceeded"

Yelp free tier: 5,000 requests/month (~166/day).

- Reduce `RESULTS_PER_LOCATION` in `lead_config.py`
- Run less frequently
- Upgrade to paid tier

### "No leads without websites"

Yelp includes their own business URL. We filter for businesses without a separate website.

- Verify data by checking Yelp manually
- Try different niche/location combination
- Check if Yelp has complete data for that category

### CSV file already exists / Deduplication issues

- Delete the old CSV to start fresh: `rm lead_lists/*.csv`
- Or manually edit CSV and re-run

---

## Advanced Usage

### Use as Python Module

```python
from lead_scraper import scrape_leads, YelpLeadScraper, LeadCSVWriter

# Scrape and get number of new leads
new_leads = scrape_leads("plumbing", states=["TX", "CA"])

# Or use components directly
scraper = YelpLeadScraper()
leads = scraper.search("plumbing", "Austin", "TX", limit=50)
```

### Add Custom Niche

```python
# In lead_config.py, find Yelp category slug at:
# https://docs.yelp.com/categories

NICHES["custom_niche"] = {
    "yelp_category": "yelp_category_slug",
    "display_name": "Your Display Name",
    "description": "Your description",
}
```

### Monitor via Email/Webhook

Edit `lead_scraper.py`, add to bottom of `scrape_leads()`:

```python
# Send email notification
import smtplib
msg = f"Scraped {total} leads for {niche_key}"
# ... send email
```

---

## Cost Breakdown

| Component | Cost | Notes |
|---|---|---|
| Yelp API | $0 | Free tier: 5k/month |
| Python hosting | $0-5/mo | Cron, VPS, or local machine |
| **Total** | **$0-5/mo** | Very cost-effective |

---

## Next Steps

1. **Get Yelp API key** → https://www.yelp.com/developers
2. **Set .env file** → `cp .env.example .env` + paste key
3. **Test once** → `python lead_scraper.py`
4. **Set up automation** → `python lead_scheduler.py start ...`
5. **Import CSVs to your CRM** → Spreadsheet, Salesforce, HubSpot, etc.

---

## Legal & Ethics

✅ **Yelp API:** Official API, complies with ToS, licensed use  
✅ **Public records:** State licensing boards are public data, no scraping restrictions  
✅ **Privacy:** Businesses are listed publicly; no personal data harvesting  
✅ **Usage:** Lead generation for business services (web dev, SEO, etc.) is legitimate use  

❌ **NOT legal:** Scraping Google Maps, LinkedIn, Facebook (violates ToS)

---

## Support

- **Yelp API docs:** https://docs.yelp.com/
- **APScheduler docs:** https://apscheduler.readthedocs.io/
- **Yelp categories:** https://docs.yelp.com/categories
