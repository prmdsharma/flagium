import sys
import os
import json
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db.connection import get_connection

def run_query(sql, params=None, one=False):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params or ())
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    if one:
        return rows[0] if rows else None
    return rows

def check_duplicates():
    print("🔍 Checking for duplicate financials...")
    duplicates = run_query("""
        SELECT company_id, year, quarter, COUNT(*) as count 
        FROM financials 
        GROUP BY company_id, year, quarter 
        HAVING count > 1
    """)
    if duplicates:
        print(f"❌ Found {len(duplicates)} duplicate financial records!")
        for d in duplicates[:5]:
            print(f"   - Company ID {d['company_id']} | {d['year']} Q{d['quarter']} | Count: {d['count']}")
    else:
        print("✅ No duplicate financial records found.")
    return len(duplicates)

def check_missing_data():
    print("\n🔍 Checking for companies with no financial data...")
    missing = run_query("""
        SELECT c.ticker, c.name 
        FROM companies c 
        LEFT JOIN financials f ON c.id = f.company_id 
        WHERE f.id IS NULL
    """)
    if missing:
        print(f"⚠️  {len(missing)} companies have ZERO financial records:")
        for m in missing[:10]:
            print(f"   - {m['ticker']} ({m['name']})")
    else:
        print("✅ All companies have financial data.")
    return len(missing)

def check_flag_sanity():
    print("\n🔍 Checking flag distribution...")
    total_companies = run_query("SELECT COUNT(*) as count FROM companies", one=False)[0]['count']
    flag_stats = run_query("""
        SELECT flag_name, COUNT(DISTINCT company_id) as companies 
        FROM flags 
        GROUP BY flag_name 
        ORDER BY companies DESC
    """)
    
    suspicious = []
    for f in flag_stats:
        coverage = (f['companies'] / total_companies) * 100
        print(f"   - {f['flag_name']}: {f['companies']} companies ({coverage:.1f}%)")
        if coverage > 90:
            suspicious.append(f['flag_name'])
            
    if suspicious:
        print(f"❌ WARNING: Flags firing on >90% of companies: {', '.join(suspicious)}")
    else:
        print("✅ Flag distribution looks reasonable.")
    return len(suspicious)

def check_synthesis_logic():
    print("\n🔍 Verifying synthesis logic (Sum of Quarters vs Annual)...")
    # Check for companies where we have both Annual and all 4 Quarters for a year
    # This is a good parity test for the parser and synthesizer
    discrepancies = run_query("""
        SELECT 
            f1.company_id, f1.year, 
            MAX(f1.revenue) as annual_rev, 
            SUM(f2.revenue) as sum_q_rev
        FROM financials f1
        JOIN financials f2 ON f1.company_id = f2.company_id AND f1.year = f2.year
        WHERE f1.quarter = 0 AND f2.quarter > 0
        GROUP BY f1.company_id, f1.year
        HAVING ABS(MAX(f1.revenue) - SUM(f2.revenue)) > 100
        LIMIT 5
    """)
    if discrepancies:
        print(f"⚠️  Found {len(discrepancies)} synthesis discrepancies > 100 units.")
        for d in discrepancies:
             print(f"   - CoID {d['company_id']} | Year {d['year']} | Annual: {d['annual_rev']} | Sum Q: {d['sum_q_rev']}")
    else:
        print("✅ Synthesis parity check passed (where data exists).")

def main():
    print("=" * 50)
    print(f"🚀 Flagium Data Sanity Report - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    errors = 0
    errors += check_duplicates()
    errors += check_missing_data()
    check_flag_sanity()
    check_synthesis_logic()
    
    print("\n" + "=" * 50)
    if errors == 0:
        print("🎉 SUCCESS: Data looks production-ready!")
    else:
        print(f"🚩 TOTAL ISSUES: {errors}")
        print("Recommendation: Run tools/backfill_gaps.py or check ingestion logs.")
    print("=" * 50)

if __name__ == "__main__":
    main()
