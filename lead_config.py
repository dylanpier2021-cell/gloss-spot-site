"""
Lead generation configuration — all niche and location settings here.
No hardcoding anywhere else in the codebase.
"""

# Define business niches with Yelp category codes
# Format: niche_name -> { "yelp_category": "category_code", "display_name": "Display Name" }
NICHES = {
    "funeral_homes": {
        "yelp_category": "funeralservices",
        "display_name": "Funeral Homes",
        "description": "Funeral homes and services",
    },
    "pet_grooming": {
        "yelp_category": "petgroomers",
        "display_name": "Pet Grooming",
        "description": "Pet grooming and care",
    },
    "plumbing": {
        "yelp_category": "plumbing",
        "display_name": "Plumbing",
        "description": "Plumbing services",
    },
    "hvac": {
        "yelp_category": "heating",
        "display_name": "HVAC",
        "description": "Heating and cooling services",
    },
    "roofing": {
        "yelp_category": "roofing",
        "display_name": "Roofing",
        "description": "Roofing contractors",
    },
    "landscaping": {
        "yelp_category": "landscaping",
        "display_name": "Landscaping",
        "description": "Landscaping and lawn care",
    },
}

# Target cities and states
LOCATIONS = [
    # Florida
    {"city": "Miami", "state": "FL"},
    {"city": "Orlando", "state": "FL"},
    {"city": "Tampa", "state": "FL"},
    {"city": "Jacksonville", "state": "FL"},
    {"city": "Fort Lauderdale", "state": "FL"},
    # California
    {"city": "Los Angeles", "state": "CA"},
    {"city": "San Francisco", "state": "CA"},
    {"city": "San Diego", "state": "CA"},
    {"city": "Sacramento", "state": "CA"},
    {"city": "Fresno", "state": "CA"},
    # Texas
    {"city": "Houston", "state": "TX"},
    {"city": "Dallas", "state": "TX"},
    {"city": "Austin", "state": "TX"},
    {"city": "San Antonio", "state": "TX"},
    {"city": "Fort Worth", "state": "TX"},
]

# Data sources to use
# Each source can be enabled/disabled independently
DATA_SOURCES = {
    "yelp": {
        "enabled": True,
        "description": "Yelp Fusion API — searchable, reliable, legal",
        "requires_api_key": True,
    },
    "state_licensing": {
        "enabled": True,
        "description": "State licensing boards (regulated industries only)",
        "requires_api_key": False,
    },
}

# CSV output settings
CSV_OUTPUT_DIR = "lead_lists"
CSV_FILENAME_TEMPLATE = "{niche}_{state}_{timestamp}.csv"  # e.g., funeral_homes_FL_2026-04-19.csv

# Deduplication settings (number of days to check for duplicates)
DEDUPLICATION_DAYS = 30

# Pagination: results per location
RESULTS_PER_LOCATION = 50
