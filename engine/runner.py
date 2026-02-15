"""
Flagium — Red Flag Engine Runner

Executes all registered red flags against companies in the database.
Supports both annual and quarterly flag detection.
"""

import argparse
import json
import sys
from db.connection import get_connection
from flags import get_all_flags
from ingestion.db_writer import get_all_companies


def run_flags(ticker=None):
    conn = get_connection()
    if not conn:
        print("❌ DB Connection failed")
        return

    # 1. Get companies
    companies = get_all_companies(conn)
    if ticker:
        companies = [c for c in companies if c["ticker"] == ticker]
        if not companies:
            print(f"❌ Company {ticker} not found in DB.")
            return

    # 2. Get active flags
    active_flags = get_all_flags()
    print(f"🚀 Running {len(active_flags)} flags on {len(companies)} companies (annual + quarterly)...")

    cursor = conn.cursor()
    
    total_flags_found = 0

    for company in companies:
        cid = company["id"]
        cticker = company["ticker"]
        print(f"  🔍 Analyzing {cticker}...")

        # Clear existing flags for this company
        cursor.execute("DELETE FROM flags WHERE company_id = %s", (cid,))
        
        company_flags = 0
        
        # Run each flag for BOTH annual and quarterly
        for flag_module in active_flags:
            for period_type in ["annual", "quarterly"]:
                try:
                    result = flag_module.check(conn, cid, cticker, period_type=period_type)
                    if result:
                        save_flag(cursor, cid, result)
                        label = "📅" if period_type == "annual" else "📊"
                        print(f"    {label} {result['flag_code']} [{period_type}]: {result['message']}")
                        company_flags += 1
                        total_flags_found += 1
                except Exception as e:
                    print(f"    ❌ Error running {flag_module.FLAG_CODE} ({period_type}): {e}")

        if company_flags == 0:
            print(f"    ✅ Clean (No flags detected)")

    conn.commit()
    cursor.close()
    conn.close()
    
    print("\n════════════════════════════════════════════════════════════")
    print(f"🏁 Finished. Total flags detected: {total_flags_found}")
    print("════════════════════════════════════════════════════════════")


def save_flag(cursor, company_id, result):
    """Insert flag into database."""
    query = """
        INSERT INTO flags (company_id, flag_code, flag_name, severity, period_type, message, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (
        company_id,
        result["flag_code"],
        result["flag_name"],
        result["severity"],
        result.get("period_type", "annual"),
        result["message"],
        json.dumps(result["details"])
    ))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Red Flag Engine")
    parser.add_argument("--ticker", help="Run for specific ticker (e.g. RELIANCE)")
    args = parser.parse_args()

    run_flags(ticker=args.ticker)
