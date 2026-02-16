"""
Flag: OCF < PAT (Operating Cash Flow less than Net Profit)

Detects potential earnings quality issues where reported profit is not backed by cash flow.
Rule: Trigger if OCF < Net Profit in at least 2 of the last 3 years/quarters.
Severity: HIGH
"""

FLAG_CODE = "F1"
FLAG_NAME = "OCF < PAT"
SEVERITY = "HIGH"
THRESHOLD_COUNT = 2
LOOKBACK = 3

# quarterly data has no operating_cash_flow
SUPPORTS_QUARTERLY = False


def check(conn, company_id, ticker, period_type="annual", year=None, quarter=None):
    """
    Check if OCF < Net Profit in 2 of last 3 years.
    Only runs on annual data (quarterly OCF not available).
    """
    if period_type == "quarterly":
        return None

    cursor = conn.cursor(dictionary=True)

    if year:
        query = """
            SELECT year, net_profit, operating_cash_flow
            FROM financials
            WHERE company_id = %s AND quarter = 0 AND year <= %s
            ORDER BY year DESC
            LIMIT %s
        """
        cursor.execute(query, (company_id, year, LOOKBACK))
    else:
        query = """
            SELECT year, net_profit, operating_cash_flow
            FROM financials
            WHERE company_id = %s AND quarter = 0
            ORDER BY year DESC
            LIMIT %s
        """
        cursor.execute(query, (company_id, LOOKBACK))
    rows = cursor.fetchall()
    cursor.close()

    if not rows or len(rows) < LOOKBACK:
        return None

    triggered_years = []

    for row in rows:
        pat = row["net_profit"]
        ocf = row["operating_cash_flow"]

        if pat is None or ocf is None:
            continue

        if ocf < pat:
            triggered_years.append({
                "year": row["year"],
                "ocf": ocf,
                "pat": pat,
                "diff": ocf - pat
            })

    if len(triggered_years) >= THRESHOLD_COUNT:
        return {
            "flag_code": FLAG_CODE,
            "flag_name": FLAG_NAME,
            "severity": SEVERITY,
            "period_type": "annual",
            "message": f"{ticker}: OCF below Net Profit in {len(triggered_years)}/{len(rows)} recent years.",
            "details": {
                "triggered_count": len(triggered_years),
                "threshold": THRESHOLD_COUNT,
                "years_analyzed": len(rows),
                "evidence": triggered_years
            }
        }

    return None
