import sys
import os
import json
from datetime import date

# Ensure we can import from the root directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.connection import get_connection

def run_sanity_checks():
    print("Running Daily Data Sanity Checks...")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    anomalies = {
        "duplicates": [],
        "missing_data": [],
        "missing_profit": [],
        "synthesis_discrepancies": [],
        "negative_revenue": [],
        "orphaned_flags": []
    }

    try:
        # 1. Duplicates
        cursor.execute("""
            SELECT company_id, year, quarter, COUNT(*) as count 
            FROM financials 
            GROUP BY company_id, year, quarter 
            HAVING count > 1
        """)
        anomalies["duplicates"] = cursor.fetchall()
        print(f"  - Duplicates: {len(anomalies['duplicates'])}")

        # 2. Missing Data
        cursor.execute("""
            SELECT c.ticker, c.name 
            FROM companies c 
            LEFT JOIN financials f ON c.id = f.company_id 
            WHERE f.id IS NULL
        """)
        anomalies["missing_data"] = cursor.fetchall()
        print(f"  - Missing Data: {len(anomalies['missing_data'])}")

        # 3. Missing Net Profit / Null Values
        cursor.execute("""
            SELECT c.ticker, f.year, f.quarter, f.revenue, f.net_profit
            FROM financials f
            JOIN companies c ON f.company_id = c.id
            WHERE f.year >= 2024 AND f.revenue IS NOT NULL AND f.revenue > 0
            AND (f.net_profit IS NULL OR f.net_profit = 0)
        """)
        anomalies["missing_profit"] = cursor.fetchall()
        print(f"  - Missing Net Profit: {len(anomalies['missing_profit'])}")

        # 4. Synthesis Discrepancies (Annual vs Quarterly)
        cursor.execute("""
            SELECT 
                f1.company_id, c.ticker, f1.year, 
                MAX(f1.revenue) as annual_rev, 
                SUM(f2.revenue) as sum_q_rev
            FROM financials f1
            JOIN companies c ON f1.company_id = c.id
            JOIN financials f2 ON f1.company_id = f2.company_id AND f1.year = f2.year
            WHERE f1.quarter = 0 AND f2.quarter > 0
            GROUP BY f1.company_id, c.ticker, f1.year
            HAVING ABS(MAX(f1.revenue) - SUM(f2.revenue)) > 1000000000  -- 100 Cr diff
            LIMIT 50
        """)
        anomalies["synthesis_discrepancies"] = cursor.fetchall()
        print(f"  - Synthesis Discrepancies: {len(anomalies['synthesis_discrepancies'])}")

        # 5. Negative Revenue
        cursor.execute("""
            SELECT c.ticker, f.year, f.quarter, f.revenue
            FROM financials f
            JOIN companies c ON f.company_id = c.id
            WHERE f.revenue < 0
        """)
        anomalies["negative_revenue"] = cursor.fetchall()
        print(f"  - Negative Revenue: {len(anomalies['negative_revenue'])}")

        # 6. Orphaned Flags
        cursor.execute("""
            SELECT fl.id, fl.flag_name, fl.company_id
            FROM flags fl
            LEFT JOIN companies c ON fl.company_id = c.id
            WHERE c.id IS NULL
        """)
        anomalies["orphaned_flags"] = cursor.fetchall()
        print(f"  - Orphaned Flags: {len(anomalies['orphaned_flags'])}")

        # Compile final payload
        class DecimalEncoder(json.JSONEncoder):
            def default(self, obj):
                from decimal import Decimal
                if isinstance(obj, Decimal):
                    return float(obj)
                return super(DecimalEncoder, self).default(obj)
                
        summary = {
            "total_anomalies": sum(len(v) for v in anomalies.values()),
            "details": anomalies
        }
        report_json = json.dumps(summary, cls=DecimalEncoder)

        # Store ONLY the latest report in system_reports (overwrite previous)
        today = date.today()
        cursor.execute("""
            INSERT INTO system_reports (report_type, report_date, report_data)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                report_date = VALUES(report_date),
                report_data = VALUES(report_data),
                updated_at = CURRENT_TIMESTAMP
        """, ("daily_sanity", today, report_json))
        
        conn.commit()
        print(f"Successfully saved Daily Sanity Report with {summary['total_anomalies']} anomalies.")

    except Exception as e:
        print(f"ERROR running sanity checks: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_sanity_checks()
