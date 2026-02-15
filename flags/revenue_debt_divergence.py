"""
Flag: Revenue-Debt Divergence

Detects financial deterioration where revenue is falling while debt is rising.
Rule: Trigger if Revenue(Current) < Revenue(Previous) AND Total Debt(Current) > Total Debt(Previous).
Severity: MEDIUM
"""

FLAG_CODE = "F3"
FLAG_NAME = "Revenue-Debt Divergence"
SEVERITY = "MEDIUM"

# quarterly data has no total_debt
SUPPORTS_QUARTERLY = False


def check(conn, company_id, ticker, period_type="annual"):
    """
    Check for revenue decline alongside debt increase.
    Only runs on annual data (quarterly debt not available).
    """
    if period_type == "quarterly":
        return None

    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT year, revenue, total_debt
        FROM financials
        WHERE company_id = %s AND quarter = 0
        ORDER BY year DESC
        LIMIT 2
    """
    cursor.execute(query, (company_id,))
    rows = cursor.fetchall()
    cursor.close()

    if not rows or len(rows) < 2:
        return None

    current = rows[0]
    previous = rows[1]

    if current["year"] <= previous["year"]:
        return None

    curr_rev = current["revenue"]
    prev_rev = previous["revenue"]
    curr_debt = current["total_debt"]
    prev_debt = previous["total_debt"]

    if None in (curr_rev, prev_rev, curr_debt, prev_debt):
        return None

    revenue_declining = curr_rev < prev_rev
    debt_increasing = curr_debt > prev_debt

    if revenue_declining and debt_increasing:
        rev_change_pct = ((curr_rev - prev_rev) / prev_rev) * 100 if prev_rev else 0
        debt_change_pct = ((curr_debt - prev_debt) / prev_debt) * 100 if prev_debt else 0

        return {
            "flag_code": FLAG_CODE,
            "flag_name": FLAG_NAME,
            "severity": SEVERITY,
            "period_type": "annual",
            "message": (
                f"{ticker}: Revenue fell {abs(rev_change_pct):.1f}% while Debt rose {debt_change_pct:.1f}% "
                f"in {current['year']} vs {previous['year']}."
            ),
            "details": {
                "current_year": current["year"],
                "previous_year": previous["year"],
                "revenue_change_pct": round(rev_change_pct, 2),
                "debt_change_pct": round(debt_change_pct, 2),
                "financials": [current, previous]
            }
        }

    return None
