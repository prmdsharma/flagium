"""
Migration: Fix Legacy Flags with NULL fiscal_year

Root Cause: The first batch flag engine run (2026-02-15) saved flags without 
setting fiscal_year / fiscal_quarter. The current engine code (runner.py lines 191/209)
now correctly sets these fields before calling save_flag().

Fix: Delete the 166 legacy NULL-fy flags and re-run the flag engine for only 
those affected companies. This is cleaner than guessing the fiscal year.
"""

import json
from db.connection import get_connection


def fix_null_fiscal_year_flags():
    conn = get_connection()
    if not conn:
        print("❌ DB connection failed")
        return
    
    cursor = conn.cursor(dictionary=True)
    
    # 1. Find affected companies
    cursor.execute("""
        SELECT DISTINCT c.ticker, c.id 
        FROM flags f 
        JOIN companies c ON c.id = f.company_id 
        WHERE f.fiscal_year IS NULL
        ORDER BY c.ticker
    """)
    affected = cursor.fetchall()
    print(f"📋 Found {len(affected)} companies with NULL fiscal_year flags:")
    for a in affected:
        print(f"   - {a['ticker']} (id={a['id']})")
    
    # 2. Count and delete the bad flags
    cursor.execute("SELECT COUNT(*) as cnt FROM flags WHERE fiscal_year IS NULL")
    count = cursor.fetchone()['cnt']
    print(f"\n🗑️  Deleting {count} legacy flags with NULL fiscal_year...")
    
    cursor.execute("DELETE FROM flags WHERE fiscal_year IS NULL")
    conn.commit()
    print(f"✅ Deleted {count} legacy flags.")
    
    # 3. Re-run the flag engine for affected companies
    print(f"\n🔄 Re-running flag engine for {len(affected)} affected companies...")
    
    cursor.close()
    conn.close()
    
    from engine.runner import run_flags
    for company in affected:
        print(f"   Running flags for {company['ticker']}...")
        try:
            run_flags(ticker=company['ticker'], backfill_quarters=8)
        except Exception as e:
            print(f"   ⚠️  Error for {company['ticker']}: {e}")
    
    # 4. Verify
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as cnt FROM flags WHERE fiscal_year IS NULL")
    remaining = cursor.fetchone()['cnt']
    print(f"\n{'✅' if remaining == 0 else '⚠️'} Remaining NULL fiscal_year flags: {remaining}")
    cursor.close()
    conn.close()


if __name__ == "__main__":
    fix_null_fiscal_year_flags()
