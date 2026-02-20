"""
Flagium — Database Writer

Takes parsed financial data and saves it to the MySQL database.
Handles company upserts and financial data insertion.
"""

import logging
import os
import sys
from db.connection import get_connection


# ──────────────────────────────────────────────
# Module Logger
# ──────────────────────────────────────────────

_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)
_LOG_FORMAT = "[%(asctime)s], [%(levelname)s], [%(ticker)s], %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"


class _DBTickerFilter(logging.Filter):
    def __init__(self, ticker="DB"):
        super().__init__()
        self.ticker = ticker
    def filter(self, record):
        record.ticker = self.ticker
        return True


def _get_db_logger(ticker="DB") -> logging.Logger:
    logger_name = f"flagium.db.{ticker}"
    logger = logging.getLogger(logger_name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.DEBUG)
    tf = _DBTickerFilter(ticker)
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


_logger = _get_db_logger()



def ensure_company(cursor, ticker, name=None, sector=None, index_name=None):
    """Ensure a company exists in the database and return its id.

    Creates the company if it doesn't exist, otherwise returns
    the existing company's id.

    Args:
        cursor: Active MySQL cursor.
        ticker: Stock ticker (e.g., 'RELIANCE').
        name: Company name. Defaults to ticker.
        sector: Industry sector.
        index_name: Index membership (e.g., 'NIFTY50').

    Returns:
        (company_id, was_created) tuple
    """
    company_name = name if name else ticker

    # Check if company already exists
    cursor.execute(
        "SELECT id FROM companies WHERE ticker = %s",
        (ticker,)
    )
    row = cursor.fetchone()

    if row:
        return row[0], False

    # Create new company
    cursor.execute(
        """
        INSERT INTO companies (name, ticker, sector, index_name)
        VALUES (%s, %s, %s, %s)
        """,
        (company_name, ticker, sector, index_name)
    )
    return cursor.lastrowid, True


def save_financials(conn, ticker, records, company_info=None):
    """Save parsed financial records to the database.

    Args:
        conn: Active MySQL connection.
        ticker: Stock ticker.
        records: List of dicts from xbrl_parser (each has year, revenue, etc.)
        company_info: Optional dict with name, sector, index fields.

    Returns:
        dict with counts: {inserted, updated, skipped, errors}
    """
    cursor = conn.cursor()
    result = {"inserted": 0, "updated": 0, "skipped": 0, "errors": []}

    try:
        # Ensure company exists
        name = company_info.get("name", ticker) if company_info else ticker
        sector = company_info.get("sector") if company_info else None
        index_name = company_info.get("index") if company_info else None

        company_id, was_created = ensure_company(
            cursor, ticker, name, sector, index_name
        )

        if was_created:
            _get_db_logger(ticker).info(f"Created company: {ticker} ({name})")

        # Insert/update each financial record
        for record in records:
            try:
                # Check if record already exists
                cursor.execute(
                    """
                    SELECT id, is_consolidated FROM financials
                    WHERE company_id = %s AND year = %s AND quarter = %s
                    """,
                    (company_id, record["year"], record.get("quarter", 0))
                )
                existing_row = cursor.fetchone()
                
                is_cons = record.get("is_consolidated", False)

                if existing_row:
                    existing_id, existing_is_cons = existing_row
                    
                    # PRIORITY LOGIC: 
                    # 1. If currently consolidated and DB is standalone -> Update
                    # 2. If both same status -> Update (keep newest)
                    # 3. If currently standalone and DB is consolidated -> Skip
                    if existing_is_cons and not is_cons:
                        result["skipped"] += 1
                        continue
                    
                    # Update existing record
                    cursor.execute(
                        """
                        UPDATE financials SET
                            revenue = %s,
                            net_profit = %s,
                            profit_before_tax = %s,
                            operating_cash_flow = %s,
                            free_cash_flow = %s,
                            total_debt = %s,
                            interest_expense = %s,
                            is_consolidated = %s
                        WHERE id = %s
                        """,
                        (
                            record.get("revenue"),
                            record.get("net_profit"),
                            record.get("profit_before_tax"),
                            record.get("operating_cash_flow"),
                            record.get("free_cash_flow"),
                            record.get("total_debt"),
                            record.get("interest_expense"),
                            is_cons,
                            existing_id,
                        )
                    )
                    result["updated"] += 1
                else:
                    # Insert new record
                    cursor.execute(
                        """
                        INSERT INTO financials
                            (company_id, year, quarter, revenue, net_profit, profit_before_tax,
                             operating_cash_flow, free_cash_flow,
                             total_debt, interest_expense, is_consolidated)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            company_id,
                            record["year"],
                            record.get("quarter", 0),
                            record.get("revenue"),
                            record.get("net_profit"),
                            record.get("profit_before_tax"),
                            record.get("operating_cash_flow"),
                            record.get("free_cash_flow"),
                            record.get("total_debt"),
                            record.get("interest_expense"),
                            is_cons,
                        )
                    )
                    result["inserted"] += 1

            except Exception as e:
                result["errors"].append(
                    f"{ticker} year {record.get('year')}: {e}"
                )

        conn.commit()

    except Exception as e:
        conn.rollback()
        result["errors"].append(f"Transaction failed for {ticker}: {e}")

    finally:
        cursor.close()

    return result


def save_shareholding(conn, company_id, year, promoter_pct):
    """Save promoter holding data.

    Args:
        conn: Active MySQL connection.
        company_id: Company ID.
        year: Financial year.
        promoter_pct: Promoter holding percentage.
    """
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO shareholding (company_id, year, promoter_holding_pct)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE promoter_holding_pct = %s
            """,
            (company_id, year, promoter_pct, promoter_pct)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        _get_db_logger().error(f"Failed to save shareholding: {e}")
    finally:
        cursor.close()


def get_all_companies(conn):
    """Fetch all companies from the database.

    Returns:
        List of dicts: [{id, ticker, name, sector}, ...]
    """
    cursor = conn.cursor()
    cursor.execute("SELECT id, ticker, name, sector FROM companies")
    rows = cursor.fetchall()
    cursor.close()
    return [
        {"id": r[0], "ticker": r[1], "name": r[2], "sector": r[3]}
        for r in rows
    ]


def get_financials(conn, company_id, limit=5):
    """Fetch financial records for a company, most recent first.

    Args:
        conn: Active MySQL connection.
        company_id: Company ID.
        limit: Max records to return.

    Returns:
        List of dicts with financial data.
    """
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT year, revenue, net_profit, operating_cash_flow,
               free_cash_flow, total_debt, interest_expense
        FROM financials
        WHERE company_id = %s
        ORDER BY year DESC
        LIMIT %s
        """,
        (company_id, limit)
    )
    rows = cursor.fetchall()
    cursor.close()
    return [
        {
            "year": r[0],
            "revenue": r[1],
            "net_profit": r[2],
            "operating_cash_flow": r[3],
            "free_cash_flow": r[4],
            "total_debt": r[5],
            "interest_expense": r[6],
        }
        for r in rows
    ]
