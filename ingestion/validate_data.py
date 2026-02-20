"""
Flagium — Data Validation & Backfill

Scans the database for companies with insufficient financial data
(target: 8 quarters) and triggers ingestion to backfill them.
"""

import argparse
import sys
import logging
import os
from db.connection import get_connection
from ingestion.ingest import ingest_company
from ingestion.nse_fetcher import NSESession


# ──────────────────────────────────────────────
# Module Logger
# ──────────────────────────────────────────────

_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)
_LOG_FORMAT = "[%(asctime)s], [%(levelname)s], [%(ticker)s], %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"


class _ValidateFilter(logging.Filter):
    def __init__(self, ticker="VALIDATE"):
        super().__init__()
        self.ticker = ticker
    def filter(self, record):
        record.ticker = self.ticker
        return True


def _get_validate_logger() -> logging.Logger:
    logger_name = "flagium.validate"
    logger = logging.getLogger(logger_name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.DEBUG)
    tf = _ValidateFilter()
    fmt = logging.Formatter(_LOG_FORMAT, datefmt=_LOG_DATEFMT)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    ch.addFilter(tf)
    logger.addHandler(ch)
    fh = logging.FileHandler(os.path.join(_LOG_DIR, "ingestion.log"), encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    fh.addFilter(tf)
    logger.addHandler(fh)
    logger.propagate = False
    return logger


_logger = _get_validate_logger()


MIN_QUARTERS = 8

def get_data_counts(conn):
    """Get the count of quarterly records for each company."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.ticker, COUNT(f.id) as q_count
        FROM companies c
        LEFT JOIN financials f ON c.id = f.company_id AND f.quarter > 0
        GROUP BY c.ticker
    """)
    rows = cursor.fetchall()
    cursor.close()
    return {r[0]: r[1] for r in rows}

def validate_and_fix(fix=False, ticker=None):
    conn = get_connection()
    counts = get_data_counts(conn)

    if ticker:
        if ticker in counts:
            counts = {ticker: counts[ticker]}
        else:
            _logger.error(f"Ticker {ticker} not found in database.")
            conn.close()
            return

    missing_data = []

    _logger.info("=" * 60)
    _logger.info(f"Data Validation Scan (Target: {MIN_QUARTERS} quarters)")
    _logger.info("=" * 60)

    for t, count in counts.items():
        if count < MIN_QUARTERS:
            missing_data.append(t)
            _logger.warning(f"{t:<12}: {count} quarters (needs backfill)")
        elif ticker:
            _logger.info(f"{t:<12}: {count} quarters (OK)")

    total_companies = len(counts)
    gap_count = len(missing_data)

    _logger.info("=" * 60)
    _logger.info(f"Summary: {gap_count}/{total_companies} companies need backfill.")
    _logger.info("=" * 60)

    if not missing_data:
        _logger.info("All checked companies have sufficient data!")
        conn.close()
        return

    if fix:
        _logger.info(f"Starting Backfill for {gap_count} companies...")
        session = NSESession()
        try:
            for i, t in enumerate(missing_data, 1):
                _logger.info(f"[{i}/{gap_count}] Backfilling {t}")
                ingest_company(session, conn, t)
        finally:
            session.close()
            conn.close()

        _logger.info("Backfill Complete.")
    else:
        _logger.info("Run with --fix to automatically fetch missing data.")
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate and backfill financial data.")
    parser.add_argument("--fix", action="store_true", help="Attempt to fetch missing data")
    parser.add_argument("--ticker", type=str, help="Validate specific ticker")
    args = parser.parse_args()

    validate_and_fix(fix=args.fix, ticker=args.ticker)

