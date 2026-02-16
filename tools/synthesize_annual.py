import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db.connection import get_connection

def synthesize_annual_data(ticker):
    print(f"🔄 Synthesizing Annual Data for {ticker}...")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get Company ID
        cursor.execute("SELECT id FROM companies WHERE ticker = %s", (ticker,))
        res = cursor.fetchone()
        if not res:
            print(f"❌ Company {ticker} not found")
            return
        company_id = res["id"]
        
        # Get all quarterly data
        cursor.execute("""
            SELECT year, quarter, revenue, net_profit, profit_before_tax, 
                   operating_cash_flow, total_debt, interest_expense
            FROM financials 
            WHERE company_id = %s AND quarter > 0
            ORDER BY year, quarter
        """, (company_id,))
        
        quarters = cursor.fetchall()
        
        # Group by Year
        by_year = {}
        for q in quarters:
            y = q["year"]
            if y not in by_year:
                by_year[y] = {}
            by_year[y][q["quarter"]] = q
            
        # Synthesize
        for year, q_dict in by_year.items():
            # We need at least Q4 to generally imply we have the "end" of the year
            # P&L = Sum of available quarters (ideally need all 4 for accuracy, 
            # but we'll sum what we have if we have Q4? No, partial sum is misleading.)
            # Strict rule: Need Q1, Q2, Q3, Q4 for P&L sum.
            
            # Check if Annual already exists
            cursor.execute("SELECT id FROM financials WHERE company_id = %s AND year = %s AND quarter = 0", (company_id, year))
            if cursor.fetchone():
                print(f"  ⏭️  Annual {year} already exists. Skipping.")
                continue
            
            # Check availability
            has_all_quarters = all(k in q_dict for k in [1, 2, 3, 4])
            if not has_all_quarters:
                missing = [k for k in [1, 2, 3, 4] if k not in q_dict]
                print(f"  ⚠️  Year {year} incomplete. Missing quarters: {missing}. Skiping synthesis.")
                continue
                
            print(f"  ✨ Synthesizing Annual {year} from 4 quarters...")
            
            # Sum P&L
            revenue = sum(q_dict[k]["revenue"] or 0 for k in [1,2,3,4])
            net_profit = sum(q_dict[k]["net_profit"] or 0 for k in [1,2,3,4])
            pbt = sum(q_dict[k]["profit_before_tax"] or 0 for k in [1,2,3,4])
            ocf = sum(q_dict[k]["operating_cash_flow"] or 0 for k in [1,2,3,4]) # OCF is usually YTD in XBRL?
            # Wait! OCF in Indian XBRL "Cash Flow Statement" is usually YTD (Year To Date) or "For the period"?
            # If Q4 file has "Cash Flow for period 1 Apr to 31 Mar", then Q4 OCF *IS* Annual OCF.
            # If Q4 file has "Cash Flow for 1 Jan to 31 Mar", then we sum.
            # Indian XBRL Contexts for CF are usually duration.
            # My debug showed "Start: 2024-01-01 End: 2024-03-31". So it's Quarterly Cash Flow.
            # So Sum is correct.
            
            interest = sum(q_dict[k]["interest_expense"] or 0 for k in [1,2,3,4])
            
            # Snapshot BS (Take Q4)
            total_debt = q_dict[4]["total_debt"]
            
            # Insert
            cursor.execute("""
                INSERT INTO financials (company_id, year, quarter, revenue, net_profit, 
                                      profit_before_tax, operating_cash_flow, total_debt, interest_expense)
                VALUES (%s, %s, 0, %s, %s, %s, %s, %s, %s)
            """, (company_id, year, revenue, net_profit, pbt, ocf, total_debt, interest))
            conn.commit()
            print(f"     ✅ Inserted Annual {year}")
            
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    synthesize_annual_data("NUVOCO")
