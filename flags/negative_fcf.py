"""
Flag: Negative FCF Streak

Detects persistent cash burn where Free Cash Flow is negative for consecutive years.
Rule: Trigger if FCF < 0 for 3 consecutive years.
Severity: HIGH
"""

FLAG_CODE = "F2"
FLAG_NAME = "Negative FCF Streak"
SEVERITY = "HIGH"
STREAK_YEARS = 3

# quarterly data has no free_cash_flow
SUPPORTS_QUARTERLY = False


def check(conn, company_id, ticker, period_type="annual"):
    """
    Check if FCF < 0 for last 3 years consecutively.
    Only runs on annual data (quarterly FCF not available).
    """
    if period_type == "quarterly":
        return None

    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT year, free_cash_flow
        FROM financials
        WHERE company_id = %s AND quarter = 0
        ORDER BY year DESC
        LIMIT %s
    """
    cursor.execute(query, (company_id, STREAK_YEARS))
    rows = cursor.fetchall()
    cursor.close()

    if not rows or len(rows) < STREAK_YEARS:
        return None

    negative_years = []
    for row in rows:
        fcf = row["free_cash_flow"]
        if fcf is None or fcf >= 0:
            return None
        negative_years.append(row)

    if len(negative_years) == STREAK_YEARS:
        return {
            "flag_code": FLAG_CODE,
            "flag_name": FLAG_NAME,
            "severity": SEVERITY,
            "period_type": "annual",
            "message": f"{ticker}: Negative Free Cash Flow for last {STREAK_YEARS} consecutive years.",
            "details": {
                "years_in_streak": [r["year"] for r in negative_years],
                "financials": negative_years
            }
        }

    return None
