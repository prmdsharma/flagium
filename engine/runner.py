import argparse
import json
import sys
import os
import logging
from datetime import datetime
from db.connection import get_connection
from db.utils import update_job_status
from flags import get_all_flags
from ingestion.db_writer import get_all_companies


# ──────────────────────────────────────────────
# Logging Setup
# ──────────────────────────────────────────────

_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)

_LOG_FORMAT = "[%(asctime)s], [%(levelname)s], [%(ticker)s], %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"


class _EngineTickerFilter(logging.Filter):
    """Injects a 'ticker' field into every log record."""
    def __init__(self, ticker: str = "ENGINE"):
        super().__init__()
        self.ticker = ticker

    def filter(self, record):
        record.ticker = self.ticker
        return True


def _get_engine_logger(ticker: str = "ENGINE") -> logging.Logger:
    """Returns a logger for the flag engine.

    Format: [Timestamp], [Level], [Ticker], [Message]
    Writes to both stdout and logs/engine.log.
    """
    logger_name = f"flagium.engine.{ticker}"
    logger = logging.getLogger(logger_name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)
    tf = _EngineTickerFilter(ticker)
    fmt = logging.Formatter(_LOG_FORMAT, datefmt=_LOG_DATEFMT)

    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    ch.addFilter(tf)
    logger.addHandler(ch)

    fh = logging.FileHandler(os.path.join(_LOG_DIR, "engine.log"), encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    fh.addFilter(tf)
    logger.addHandler(fh)

    logger.propagate = False
    return logger


# Module-level logger (company-agnostic lines)
_logger = _get_engine_logger()



def get_current_fiscal_quarter():
    """
    Returns (year, quarter) for the *previous* completed quarter.
    (Since usually we run flags on completed data)
    """
    now = datetime.now()
    month = now.month
    year = now.year
    
    # Financial Year starts April
    # Apr-Jun (Q1), Jul-Sep (Q2), Oct-Dec (Q3), Jan-Mar (Q4)
    
    if 1 <= month <= 3:
        # Current is Q4 of previous calendar year (which is part of current FY)
        # But data for Q3 (Oct-Dec) is likely just finished
        current_q = 4
        fy = year  # e.g. Jan 2025 is Q4 FY2025
    elif 4 <= month <= 6:
        current_q = 1
        fy = year + 1
    elif 7 <= month <= 9:
        current_q = 2
        fy = year + 1
    else:
        current_q = 3
        fy = year + 1
        
    # We want to start from the *latest completed* quarter
    # For simplicity, let's just use the current logic or accept explicit override
    # But for backfill, we define "latest" and go back.
    
    return fy, current_q


def get_previous_quarters(start_year, start_q, count=8):
    """
    Generate list of (year, quarter) tuples going back `count` quarters.
    """
    quarters = []
    
    curr_y, curr_q = start_year, start_q
    
    for _ in range(count):
        quarters.append((curr_y, curr_q))
        
        curr_q -= 1
        if curr_q < 1:
            curr_q = 4
            curr_y -= 1
            
    return quarters


def run_flags(ticker=None, backfill_quarters=1):
    conn = get_connection()
    if not conn:
        _logger.error("DB Connection failed")
        return

    # 1. Get companies
    companies = get_all_companies(conn)
    if ticker:
        companies = [c for c in companies if c["ticker"] == ticker]
        if not companies:
            _logger.error(f"Company {ticker} not found in DB.")
            return

    # 2. Get active flags
    active_flags = get_all_flags()
    
    # 3. Determine Periods
    # For now, let's assume "Quarterly" flags run on specific quarters
    # And "Annual" flags run on the year associated with that quarter (if it's Q4) OR just run annually.
    # To keep it simple: We run 'annual' check only if we are in Q4 backfill, or just always run it.
    
    # Let's derive the periods
    fy, fq = get_current_fiscal_quarter()
    
    # If standard run, backfill_quarters=1 (just the latest)
    target_quarters = get_previous_quarters(fy, fq, count=backfill_quarters)
    
    _logger.info(f"Running {len(active_flags)} flags on {len(companies)} companies for {len(target_quarters)} quarter(s)")
    _logger.info(f"Target periods: {target_quarters}")

    update_job_status("Flag Engine Job", "running", f"Running {len(active_flags)} flags on {len(companies)} companies")

    cursor = conn.cursor()
    
    total_flags_found = 0

    try:
        for company in companies:
            cid = company["id"]
            cticker = company["ticker"]
            logger = _get_engine_logger(cticker)
            logger.info(f"Analyzing {cticker}")

            # For backfill, we iterate through periods
            for year, quarter in target_quarters:
                
                company_flags = 0
                
                # Run each flag
                for flag_module in active_flags:
                    # We check both annual and quarterly, but we pass the explicit period
                    
                    # 1. Quarterly Check
                    if getattr(flag_module, "SUPPORTS_QUARTERLY", False):
                        try:
                            result = flag_module.check(conn, cid, cticker, period_type="quarterly", year=year, quarter=quarter)
                            if result:
                                result["fiscal_year"] = year
                                result["fiscal_quarter"] = quarter
                                save_flag(cursor, cid, result)
                                logger.info(f"{result['flag_code']} [FY{year} Q{quarter}]: {result['message']}")
                                company_flags += 1
                                total_flags_found += 1
                        except Exception as e:
                            pass

                    # 2. Annual Check
                    # Usually annual flags are calculated at end of year (Q4).
                    # But we can check them every time if we want, or only if quarter == 4.
                    # For now, let's run them if quarter == 4 to avoid duplicates, or just run them.
                    # Simplest: Run annual check using the 'year'.
                    if quarter == 4:
                        try:
                            result = flag_module.check(conn, cid, cticker, period_type="annual", year=year)
                            if result:
                                result["fiscal_year"] = year
                                result["fiscal_quarter"] = 0
                                save_flag(cursor, cid, result)
                                logger.info(f"{result['flag_code']} [FY{year} Annual]: {result['message']}")
                                company_flags += 1
                                total_flags_found += 1
                        except Exception as e:
                            pass

            if company_flags == 0:
                logger.debug(f"No flags detected for {cticker}")

        conn.commit()
        update_job_status("Flag Engine Job", "completed", f"Analyzed {len(companies)} companies. Flags detected: {total_flags_found}")

    except Exception as e:
        _logger.error(f"Flag engine failed: {e}", exc_info=True)
        update_job_status("Flag Engine Job", "failed", str(e))
        raise e
    finally:
        cursor.close()
        conn.close()

    _logger.info("=" * 60)
    _logger.info(f"Finished. Total flags detected: {total_flags_found}")
    _logger.info("=" * 60)


def save_flag(cursor, company_id, result):
    """Insert or Update flag into database (Idempotent)."""
    query = """
        INSERT INTO flags 
        (company_id, flag_code, flag_name, severity, period_type, fiscal_year, fiscal_quarter, message, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            severity = VALUES(severity),
            message = VALUES(message),
            details = VALUES(details),
            created_at = CURRENT_TIMESTAMP
    """
    cursor.execute(query, (
        company_id,
        result["flag_code"],
        result["flag_name"],
        result["severity"],
        result.get("period_type", "annual"),
        result.get("fiscal_year", 0),
        result.get("fiscal_quarter", 0),
        result["message"],
        json.dumps(result["details"])
    ))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Red Flag Engine")
    parser.add_argument("--ticker", help="Run for specific ticker (e.g. RELIANCE)")
    parser.add_argument("--backfill", type=int, default=1, help="Number of quarters to backfill (default 1)")
    args = parser.parse_args()

    run_flags(ticker=args.ticker, backfill_quarters=args.backfill)
