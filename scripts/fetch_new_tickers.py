"""
Flagium Utility — Fetch New Tickers

Identifies tickers that are in the target 1000-company universe
but missing from the existing database.
"""

import sys
import os

# Add root to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ingestion.nse_fetcher import fetch_universe_1000
from db.connection import get_connection

def find_missing_tickers():
    print("🔭 Fetching target universe (1000 companies)...")
    target_tickers = fetch_universe_1000()
    print(f"✅ Found {len(target_tickers)} tickers in target universe.")

    print("🔍 Checking existing companies in database...")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ticker FROM companies")
    existing_tickers = {row[0] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    print(f"✅ Found {len(existing_tickers)} existing companies in database.")

    missing = sorted(list(set(target_tickers) - existing_tickers))
    print(f"✨ Found {len(missing)} missing companies.")
    
    if missing:
        print("\nMissing Tickers:")
        print(", ".join(missing[:20]) + ("..." if len(missing) > 20 else ""))
        
        # Save to file
        with open("missing_tickers.txt", "w") as f:
            f.write("\n".join(missing))
        print(f"\n📝 Saved missing tickers to missing_tickers.txt")
    
    return missing

if __name__ == "__main__":
    find_missing_tickers()
