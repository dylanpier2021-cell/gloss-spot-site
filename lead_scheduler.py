"""
Optional scheduler for automated weekly lead scraping.
Uses APScheduler to run scrapes on a recurring schedule.

Usage:
  python lead_scheduler.py --start
  python lead_scheduler.py --stop
  python lead_scheduler.py --run-once [niche] [states]
"""

import argparse
import signal
import sys
from datetime import datetime
from lead_scraper import scrape_leads
from lead_config import NICHES

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
except ImportError:
    print("APScheduler not installed. Install with: pip install apscheduler")
    sys.exit(1)


class LeadScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_listener(self._scheduler_listener)

    def _scheduler_listener(self, event):
        """Log scheduler events"""
        if event.exception:
            print(f"❌ Scheduled job failed: {event.exception}")
        else:
            print(f"✓ Scheduled job executed at {datetime.now()}")

    def schedule_weekly_scrape(self, niche: str, states: list, day: str = "monday", hour: int = 9):
        """
        Schedule weekly lead scrape.

        Args:
            niche: Niche key (e.g., "funeral_homes")
            states: List of state codes (e.g., ["FL", "CA", "TX"])
            day: Day of week (monday, tuesday, etc.)
            hour: Hour of day in 24h format (9 = 9am)
        """
        if niche not in NICHES:
            print(f"❌ Unknown niche: {niche}")
            return False

        job_id = f"scrape_{niche}_{hour}_{day}"

        try:
            self.scheduler.add_job(
                func=scrape_leads,
                args=(niche, states),
                trigger=CronTrigger(day_of_week=day, hour=hour, minute=0),
                id=job_id,
                name=f"Weekly {NICHES[niche]['display_name']} scrape ({', '.join(states)})",
                replace_existing=True,
            )
            print(
                f"✓ Scheduled: {NICHES[niche]['display_name']} every {day.capitalize()} at {hour}:00 for {', '.join(states)}"
            )
            return True
        except Exception as e:
            print(f"❌ Failed to schedule job: {e}")
            return False

    def start(self):
        """Start the scheduler in background"""
        if self.scheduler.running:
            print("Scheduler already running")
            return

        self.scheduler.start()
        print(f"✓ Scheduler started at {datetime.now()}")
        print("Running in background. Press Ctrl+C to stop.\n")

        # Keep the scheduler running
        try:
            while True:
                signal.pause()
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            print(f"✓ Scheduler stopped at {datetime.now()}")
        else:
            print("Scheduler not running")

    def list_jobs(self):
        """List all scheduled jobs"""
        jobs = self.scheduler.get_jobs()
        if not jobs:
            print("No jobs scheduled")
            return

        print("\nScheduled jobs:")
        for job in jobs:
            print(f"  • {job.name} (ID: {job.id})")
            print(f"    Next run: {job.next_run_time}")


def main():
    parser = argparse.ArgumentParser(description="Lead scraper scheduler")
    subparsers = parser.add_subparsers(dest="command")

    # Start scheduler
    start_parser = subparsers.add_parser("start", help="Start the scheduler")
    start_parser.add_argument(
        "--niche", default="funeral_homes", help="Niche to scrape (default: funeral_homes)"
    )
    start_parser.add_argument(
        "--states", nargs="+", default=["FL", "CA", "TX"], help="States to scrape (default: FL CA TX)"
    )
    start_parser.add_argument("--day", default="monday", help="Day of week (default: monday)")
    start_parser.add_argument("--hour", type=int, default=9, help="Hour of day (default: 9)")

    # Stop scheduler
    subparsers.add_parser("stop", help="Stop the scheduler")

    # Run once
    run_once_parser = subparsers.add_parser("run-once", help="Run scraper once immediately")
    run_once_parser.add_argument("niche", help="Niche to scrape (e.g., funeral_homes)")
    run_once_parser.add_argument("--states", nargs="+", default=["FL", "CA", "TX"])

    # List jobs
    subparsers.add_parser("list", help="List scheduled jobs")

    args = parser.parse_args()

    scheduler = LeadScheduler()

    if args.command == "start":
        scheduler.schedule_weekly_scrape(args.niche, args.states, args.day, args.hour)
        scheduler.start()

    elif args.command == "stop":
        scheduler.stop()

    elif args.command == "run-once":
        print(f"Running {args.niche} scraper once...")
        scrape_leads(args.niche, args.states)

    elif args.command == "list":
        scheduler.list_jobs()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
