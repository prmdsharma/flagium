"""
Flagium — Data Validation & Backfill

Scans the database for companies with insufficient financial data
(target: 8 quarters) and triggers ingestion to backfill them.
"""

import argparse
import sys
from db.connection import get_connection
from ingestion.ingest import ingest_company
from ingestion.nse_fetcher import NSESession

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
    
    # Filter if ticker provided
    if ticker:
        if ticker in counts:
            counts = {ticker: counts[ticker]}
        else:
            print(f"❌ Ticker {ticker} not found in database.")
            conn.close()
            return

    missing_data = [] # List of tickers
    
    print(f"\n{'='*60}")
    print(f"🕵️  Data Validation Scan (Target: {MIN_QUARTERS} quarters)")
    print(f"{'='*60}")
    
    for t, count in counts.items():
        if count < MIN_QUARTERS:
            missing_data.append(t)
            print(f"  ⚠️  {t:<12} : {count} quarters")
        elif ticker:
            # If validating a specific ticker, print even if it has enough data
            print(f"  ✅  {t:<12} : {count} quarters")
    
    total_companies = len(counts)
    gap_count = len(missing_data)
    
    print(f"\n{'='*60}")
    print(f"📊 Summary: {gap_count}/{total_companies} companies need backfill.")
    print(f"{'='*60}")
    
    if not missing_data:
        print("  ✅ All checked companies have sufficient data!")
        conn.close()
        return

    if fix:
        print(f"\n🚀 Starting Backfill for {gap_count} companies...\n")
        session = NSESession()
        try:
            for i, t in enumerate(missing_data, 1):
                print(f"[{i}/{gap_count}] Backfilling {t}...")
                ingest_company(session, conn, t)
                print("-" * 40)
        finally:
            session.close()
            conn.close()
            
        print("\n✅ Backfill Complete.")
    else:
        print("\n💡 Run with --fix to automatically fetch missing data.")
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate and backfill financial data.")
    parser.add_argument("--fix", action="store_true", help="Attempt to fetch missing data")
    parser.add_argument("--ticker", type=str, help="Validate specific ticker")
    args = parser.parse_args()
    
    validate_and_fix(fix=args.fix, ticker=args.ticker)
