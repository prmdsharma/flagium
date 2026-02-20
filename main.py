"""
Flagium AI — Main Entry Point

CLI tool for the Flagium AI financial risk detection engine.

Usage:
    python main.py ingest [--keep] [TICKERS...]  # Ingest Nifty 50 or specific tickers
    python main.py ingest-file <path> TICKER     # Ingest from local XBRL file
    python main.py flags [--ticker X] [--backfill N]  # Run flag engine
    python main.py status                        # Show DB status

Options:
    --keep       Keep downloaded XBRL files (do not delete after ingestion)
    --delta      Delta mode: only fetch files newer than what's in the DB
    --ticker     Run flag engine for a specific ticker
    --backfill   Number of quarters to backfill (default: 1)
"""

import sys
from db.connection import get_connection


def cmd_ingest(tickers=None, keep_files=False, delta_mode=False, limit=None, offset=0):
    """Run NSE data ingestion."""
    from ingestion.ingest import ingest_all

    if tickers:
        print(f"Ingesting data for: {', '.join(tickers)}")
    else:
        print("Ingesting data for all Nifty 50 companies...")

    ingest_all(tickers=tickers if tickers else None, keep_files=keep_files, delta_mode=delta_mode, limit=limit, offset=offset)


def cmd_ingest_file(file_path, ticker):
    """Ingest from a local XBRL file."""
    from ingestion.ingest import ingest_from_xbrl_file
    ingest_from_xbrl_file(file_path, ticker)


def cmd_flags(ticker=None, backfill=1):
    """Run the flag engine."""
    from engine.runner import run_flags
    run_flags(ticker=ticker, backfill_quarters=backfill)


def cmd_status():
    """Show current database status."""
    conn = get_connection()
    cursor = conn.cursor()

    print("\n" + "=" * 50)
    print("  📊 Flagium AI Database Status")
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
        args = sys.argv[2:]
        keep_files = False
        delta_mode = False
        limit = None
        offset = 0
        
        # Parse arguments manually to handle --limit and --offset
        filtered_args = []
        skip_next = 0
        for i, arg in enumerate(args):
            if skip_next > 0:
                skip_next -= 1
                continue
            
            if arg == "--keep":
                keep_files = True
            elif arg == "--delta":
                delta_mode = True
            elif arg == "--limit" and i + 1 < len(args):
                try:
                    limit = int(args[i+1])
                    skip_next = 1
                except ValueError:
                    filtered_args.append(arg)
            elif arg == "--offset" and i + 1 < len(args):
                try:
                    offset = int(args[i+1])
                    skip_next = 1
                except ValueError:
                    filtered_args.append(arg)
            else:
                filtered_args.append(arg)
        
        tickers = filtered_args if filtered_args else None
        cmd_ingest(tickers, keep_files=keep_files, delta_mode=delta_mode, limit=limit, offset=offset)

    elif command == "ingest-file":
        if len(sys.argv) < 4:
            print("Usage: python main.py ingest-file <path.xml> <TICKER>")
            return
        cmd_ingest_file(sys.argv[2], sys.argv[3])

    elif command == "status":
        cmd_status()

    elif command == "flags":
        args = sys.argv[2:]
        ticker = None
        backfill = 1
        i = 0
        while i < len(args):
            if args[i] == "--ticker" and i + 1 < len(args):
                ticker = args[i + 1]
                i += 2
            elif args[i] == "--backfill" and i + 1 < len(args):
                try:
                    backfill = int(args[i + 1])
                except ValueError:
                    pass
                i += 2
            else:
                i += 1
        cmd_flags(ticker=ticker, backfill=backfill)

    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
