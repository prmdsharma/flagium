
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import get_connection
from ingestion.validate_data import get_data_counts, MIN_QUARTERS
from ingestion.ingest import ingest_all

def main():
    print("🔍 Scanning for data gaps...")
    conn = get_connection()
    try:
        counts = get_data_counts(conn)
    finally:
        conn.close()

    missing_tickers = []
    for ticker, count in counts.items():
        if count < MIN_QUARTERS:
            missing_tickers.append(ticker)
    
    # Also include tickers found in companies table but not in counts (0 records)
    # The get_data_counts function does LEFT JOIN so they should be there with 0 count roughly
    # actually get_data_counts implementation:
    # SELECT c.ticker, COUNT(f.id) ... GROUP BY c.ticker
    # So yes, they are included.

    print(f"📉 Found {len(missing_tickers)} companies with < {MIN_QUARTERS} quarters of data.")
    
    if not missing_tickers:
        print("✅ No backfill needed.")
        return

    print(f"🚀 Starting backfill for {len(missing_tickers)} companies...")
    ingest_all(tickers=missing_tickers)

if __name__ == "__main__":
    main()
