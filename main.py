"""
Flagium — Main Entry Point

CLI tool for the Flagium financial risk detection engine.

Usage:
    python main.py ingest                     # Ingest all Nifty 50 companies
    python main.py ingest RELIANCE TCS        # Ingest specific companies
    python main.py ingest-file <path> TICKER  # Ingest from local XBRL file
    python main.py status                     # Show DB status
"""

import sys
from db.connection import get_connection


def cmd_ingest(tickers=None):
    """Run NSE data ingestion."""
    from ingestion.ingest import ingest_all

    if tickers:
        print(f"Ingesting data for: {', '.join(tickers)}")
    else:
        print("Ingesting data for all Nifty 50 companies...")

    ingest_all(tickers=tickers if tickers else None)


def cmd_ingest_file(file_path, ticker):
    """Ingest from a local XBRL file."""
    from ingestion.ingest import ingest_from_xbrl_file
    ingest_from_xbrl_file(file_path, ticker)


def cmd_status():
    """Show current database status."""
    conn = get_connection()
    cursor = conn.cursor()

    print("\n" + "=" * 50)
    print("  📊 Flagium Database Status")
    print("=" * 50)

    # Companies count
    cursor.execute("SELECT COUNT(*) FROM companies")
    companies = cursor.fetchone()[0]
    print(f"\n  Companies:    {companies}")

    # Financials count
    cursor.execute("SELECT COUNT(*) FROM financials")
    financials = cursor.fetchone()[0]
    print(f"  Financials:   {financials}")

    # Flags count
    cursor.execute("SELECT COUNT(*) FROM flags")
    flags = cursor.fetchone()[0]
    print(f"  Flags:        {flags}")

    # Latest data
    if financials > 0:
        cursor.execute("""
            SELECT c.ticker, c.name, f.year, f.revenue, f.net_profit
            FROM financials f
            JOIN companies c ON c.id = f.company_id
            ORDER BY f.year DESC, c.ticker
            LIMIT 10
        """)
        rows = cursor.fetchall()
        if rows:
            print(f"\n  Latest Financial Data:")
            print(f"  {'Ticker':<12} {'Name':<25} {'Year':<6} {'Revenue':>12} {'Net Profit':>12}")
            print(f"  {'─' * 70}")
            for row in rows:
                ticker, name, year, revenue, net_profit = row
                rev_str = f"₹{revenue:,}" if revenue else "N/A"
                np_str = f"₹{net_profit:,}" if net_profit else "N/A"
                print(f"  {ticker:<12} {name[:24]:<25} {year:<6} {rev_str:>12} {np_str:>12}")

    cursor.close()
    conn.close()
    print(f"\n{'=' * 50}\n")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    command = sys.argv[1].lower()

    if command == "ingest":
        tickers = sys.argv[2:] if len(sys.argv) > 2 else None
        cmd_ingest(tickers)

    elif command == "ingest-file":
        if len(sys.argv) < 4:
            print("Usage: python main.py ingest-file <path.xml> <TICKER>")
            return
        cmd_ingest_file(sys.argv[2], sys.argv[3])

    elif command == "status":
        cmd_status()

    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
