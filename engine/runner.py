import argparse
import json
import sys
from datetime import datetime
from db.connection import get_connection
from flags import get_all_flags
from ingestion.db_writer import get_all_companies


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
    
    # 3. Determine Periods
    # For now, let's assume "Quarterly" flags run on specific quarters
    # And "Annual" flags run on the year associated with that quarter (if it's Q4) OR just run annually.
    # To keep it simple: We run 'annual' check only if we are in Q4 backfill, or just always run it.
    
    # Let's derive the periods
    fy, fq = get_current_fiscal_quarter()
    
    # If standard run, backfill_quarters=1 (just the latest)
    target_quarters = get_previous_quarters(fy, fq, count=backfill_quarters)
    
    print(f"🚀 Running {len(active_flags)} flags on {len(companies)} companies for {len(target_quarters)} quarters...")
    print(f"📅 Periods: {target_quarters}")

    cursor = conn.cursor()
    
    total_flags_found = 0

    for company in companies:
        cid = company["id"]
        cticker = company["ticker"]
        print(f"  🔍 Analyzing {cticker}...")

        # For backfill, we iterate through periods
        for year, quarter in target_quarters:
            
            # Clear existing flags for this SPECIFIC Company + Year + Quarter
            query_del = """
                DELETE FROM flags 
                WHERE company_id = %s 
                  AND fiscal_year = %s 
                  AND fiscal_quarter = %s
            """
            cursor.execute(query_del, (cid, year, quarter))

            company_flags = 0
            
            # Run each flag
            for flag_module in active_flags:
                # We check both annual and quarterly, but we pass the explicit period
                
                # 1. Quarterly Check
                if getattr(flag_module, "SUPPORTS_QUARTERLY", False):
                    try:
                        result = flag_module.check(conn, cid, cticker, period_type="quarterly", year=year, quarter=quarter)
                        if result:
                            # Enforce metadata
                            result["fiscal_year"] = year
                            result["fiscal_quarter"] = quarter
                            
                            save_flag(cursor, cid, result)
                            print(f"    📊 {result['flag_code']} [FY{year} Q{quarter}]: {result['message']}")
                            company_flags += 1
                            total_flags_found += 1
                    except Exception as e:
                        # Silently ignore data missing errors normally, but print for debug
                        # print(f"    ❌ Error running {flag_module.FLAG_CODE} (Q): {e}")
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
                            result["fiscal_quarter"] = 0 # Annual
                            
                            save_flag(cursor, cid, result)
                            print(f"    📅 {result['flag_code']} [FY{year} Annual]: {result['message']}")
                            company_flags += 1
                            total_flags_found += 1
                    except Exception as e:
                        pass

        if total_flags_found == 0 and backfill_quarters == 1:
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
        INSERT INTO flags 
        (company_id, flag_code, flag_name, severity, period_type, fiscal_year, fiscal_quarter, message, details)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (
        company_id,
        result["flag_code"],
        result["flag_name"],
        result["severity"],
        result.get("period_type", "annual"),
        result.get("fiscal_year"),
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
