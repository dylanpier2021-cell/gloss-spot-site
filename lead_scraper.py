"""
Main lead scraper — pulls from Yelp API and optional state licensing sources.
"""

import os
import csv
import json
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
from lead_config import (
    NICHES,
    LOCATIONS,
    DATA_SOURCES,
    CSV_OUTPUT_DIR,
    CSV_FILENAME_TEMPLATE,
    DEDUPLICATION_DAYS,
    RESULTS_PER_LOCATION,
)

try:
    from dotenv import load_dotenv
except ImportError:
    print("Warning: python-dotenv not installed. Set env vars manually.")
    load_dotenv = None

if load_dotenv:
    load_dotenv()

# Ensure output directory exists
Path(CSV_OUTPUT_DIR).mkdir(exist_ok=True)


class YelpLeadScraper:
    """Fetch leads from Yelp Fusion API"""

    def __init__(self):
        self.api_key = os.getenv("YELP_API_KEY")
        if not self.api_key:
            raise ValueError(
                "YELP_API_KEY not found in .env. Get one at https://www.yelp.com/developers"
            )
        self.base_url = "https://api.yelp.com/v3/businesses/search"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    def search(
        self, category: str, location: str, state: str, limit: int = 50
    ) -> List[Dict]:
        """
        Search Yelp for businesses.
        Returns list of businesses with name, phone, address, website (if available).
        """
        results = []
        offset = 0

        while offset < limit:
            params = {
                "categories": category,
                "location": f"{location}, {state}",
                "limit": min(50, limit - offset),  # Yelp max per request
                "offset": offset,
                "sort_by": "best_match",
            }

            try:
                response = requests.get(
                    self.base_url, headers=self.headers, params=params, timeout=10
                )
                response.raise_for_status()
                data = response.json()

                if "businesses" not in data:
                    break

                for business in data["businesses"]:
                    results.append(
                        {
                            "name": business.get("name", ""),
                            "phone": business.get("phone", ""),
                            "address": " ".join(
                                business.get("location", {}).get("display_address", [])
                            ),
                            "city": business.get("location", {}).get("city", ""),
                            "state": business.get("location", {}).get("state", ""),
                            "website": business.get("url", ""),  # Yelp URL, not their website
                            "yelp_url": business.get("url", ""),
                            "has_website": bool(
                                business.get("website")
                            ),  # Their actual website
                            "source": "yelp",
                            "scraped_at": datetime.now().isoformat(),
                        }
                    )

                offset += len(data["businesses"])
                if len(data["businesses"]) < 50:
                    break

            except requests.exceptions.RequestException as e:
                print(f"Error fetching from Yelp for {location}, {state}: {e}")
                break

        return results


class LeadDeduplicator:
    """Handle CSV deduplication and merging"""

    @staticmethod
    def load_existing_leads(csv_path: str) -> Dict[str, Dict]:
        """Load existing leads from CSV, keyed by (name, phone) tuple"""
        leads = {}
        if not Path(csv_path).exists():
            return leads

        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = (row.get("Business Name", ""), row.get("Phone", ""))
                    leads[key] = row
        except Exception as e:
            print(f"Warning: Could not load existing CSV {csv_path}: {e}")

        return leads

    @staticmethod
    def is_old_lead(scraped_at_str: str, days: int = DEDUPLICATION_DAYS) -> bool:
        """Check if a lead is older than specified days"""
        try:
            scraped_at = datetime.fromisoformat(scraped_at_str)
            cutoff = datetime.now() - timedelta(days=days)
            return scraped_at < cutoff
        except:
            return False

    @staticmethod
    def deduplicate(
        new_leads: List[Dict], existing_leads_path: str, days: int = DEDUPLICATION_DAYS
    ) -> List[Dict]:
        """
        Deduplicate new leads against existing CSV.
        Removes duplicates older than DEDUPLICATION_DAYS.
        """
        existing = LeadDeduplicator.load_existing_leads(existing_leads_path)
        deduped = []

        for lead in new_leads:
            key = (lead.get("name", ""), lead.get("phone", ""))
            if key in existing:
                # Duplicate found — only keep if it's new or updating old data
                if not LeadDeduplicator.is_old_lead(existing[key].get("scraped_at"), days):
                    continue  # Skip, already recent in CSV

            deduped.append(lead)

        return deduped


class LeadCSVWriter:
    """Handle CSV output with proper formatting"""

    FIELDNAMES = [
        "Business Name",
        "Phone",
        "Address",
        "City",
        "State",
        "No Website",
        "Yelp URL",
        "Source",
        "Scraped At",
    ]

    @staticmethod
    def write(leads: List[Dict], output_path: str, append: bool = True):
        """Write leads to CSV. If append=True, append to existing file (skip header)."""
        if not leads:
            print(f"No leads to write to {output_path}")
            return

        file_exists = Path(output_path).exists() and append

        try:
            with open(output_path, "a" if file_exists else "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=LeadCSVWriter.FIELDNAMES)

                if not file_exists:
                    writer.writeheader()

                for lead in leads:
                    # Map from scraper format to CSV format
                    row = {
                        "Business Name": lead.get("name", ""),
                        "Phone": lead.get("phone", ""),
                        "Address": lead.get("address", ""),
                        "City": lead.get("city", ""),
                        "State": lead.get("state", ""),
                        "No Website": "No" if lead.get("has_website") else "Yes",
                        "Yelp URL": lead.get("yelp_url", ""),
                        "Source": lead.get("source", ""),
                        "Scraped At": lead.get("scraped_at", ""),
                    }
                    writer.writerow(row)

            print(f"✓ Wrote {len(leads)} leads to {output_path}")
        except Exception as e:
            print(f"Error writing CSV {output_path}: {e}")


def scrape_leads(niche_key: str, states: Optional[List[str]] = None) -> int:
    """
    Main entry point: scrape leads for a niche across locations.

    Args:
        niche_key: Key from NICHES dict (e.g., "funeral_homes")
        states: Optional list of state codes to filter (e.g., ["FL", "CA"])
                If None, scrapes all locations.

    Returns:
        Total number of leads scraped
    """
    if niche_key not in NICHES:
        print(f"❌ Unknown niche: {niche_key}. Available: {list(NICHES.keys())}")
        return 0

    niche = NICHES[niche_key]
    print(f"\n🔍 Scraping {niche['display_name']}...")

    # Filter locations by state if specified
    locations_to_scrape = LOCATIONS
    if states:
        locations_to_scrape = [loc for loc in LOCATIONS if loc["state"] in states]

    all_leads = []
    scraper = YelpLeadScraper()

    # Scrape from Yelp for each location
    if DATA_SOURCES["yelp"]["enabled"]:
        print(f"   Searching {len(locations_to_scrape)} locations on Yelp...")
        for loc in locations_to_scrape:
            try:
                leads = scraper.search(
                    niche["yelp_category"], loc["city"], loc["state"], RESULTS_PER_LOCATION
                )
                all_leads.extend(leads)
                print(f"   ✓ {loc['city']}, {loc['state']}: {len(leads)} results")
            except Exception as e:
                print(f"   ✗ {loc['city']}, {loc['state']}: {e}")

    print(f"\nTotal leads scraped: {len(all_leads)}")

    # Deduplicate
    states_str = "_".join(sorted(set([l["state"] for l in all_leads])))
    csv_filename = CSV_FILENAME_TEMPLATE.format(
        niche=niche_key, state=states_str, timestamp=datetime.now().strftime("%Y-%m-%d")
    )
    csv_path = os.path.join(CSV_OUTPUT_DIR, csv_filename)

    all_leads = LeadDeduplicator.deduplicate(all_leads, csv_path)
    print(f"After deduplication: {len(all_leads)} new leads")

    # Filter to only businesses WITHOUT websites
    no_website_leads = [lead for lead in all_leads if not lead.get("has_website")]
    print(f"Leads without websites: {len(no_website_leads)}")

    # Write to CSV
    if no_website_leads:
        LeadCSVWriter.write(no_website_leads, csv_path, append=True)
        return len(no_website_leads)
    else:
        print("No new leads without websites found.")
        return 0


if __name__ == "__main__":
    # Example usage: scrape funeral homes in FL, CA, TX
    total = 0
    for niche in ["funeral_homes"]:
        scraped = scrape_leads(niche, states=["FL", "CA", "TX"])
        total += scraped

    print(f"\n✅ Scrape complete. Total leads: {total}")
