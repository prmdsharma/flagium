"""
Flag: Profit Collapse

Detects a sudden and significant drop in profitability.
Rule: Trigger if Net Profit(Current) < 0.5 * Net Profit(Previous).
      For quarterly: compares same quarter YoY (e.g. Q3 FY2025 vs Q3 FY2024).
Severity: HIGH
"""

FLAG_CODE = "F5"
FLAG_NAME = "Profit Collapse"
SEVERITY = "HIGH"

# net_profit is available in quarterly data
SUPPORTS_QUARTERLY = True


def check(conn, company_id, ticker, period_type="annual"):
    """
    Check for > 50% drop in Net Profit.
    Annual: compares latest 2 years.
    Quarterly: compares same quarter year-over-year.
    """
    cursor = conn.cursor(dictionary=True)

    if period_type == "quarterly":
        # Get the latest quarter
        query = """
            SELECT year, quarter, net_profit
            FROM financials
            WHERE company_id = %s AND quarter > 0
            ORDER BY year DESC, quarter DESC
            LIMIT 1
        """
        cursor.execute(query, (company_id,))
        latest = cursor.fetchone()

        if not latest or latest["net_profit"] is None:
            cursor.close()
            return None

        # Find the same quarter from the previous year
        query2 = """
            SELECT year, quarter, net_profit
            FROM financials
            WHERE company_id = %s AND quarter = %s AND year = %s
            LIMIT 1
        """
        cursor.execute(query2, (company_id, latest["quarter"], latest["year"] - 1))
        previous = cursor.fetchone()
        cursor.close()

        if not previous or previous["net_profit"] is None:
            return None

        current = latest
    else:
        # Annual path
        query = """
            SELECT year, net_profit
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

    curr_pat = current["net_profit"]
    prev_pat = previous["net_profit"]

    if curr_pat is None or prev_pat is None:
        return None

    if prev_pat <= 0:
        return None

    threshold = 0.5 * prev_pat

    if curr_pat < threshold:
        drop_pct = ((prev_pat - curr_pat) / prev_pat) * 100

        if period_type == "quarterly":
            curr_label = f"FY{current['year']} Q{current['quarter']}"
            prev_label = f"FY{previous['year']} Q{previous['quarter']}"
        else:
            curr_label = str(current["year"])
            prev_label = str(previous["year"])

        return {
            "flag_code": FLAG_CODE,
            "flag_name": FLAG_NAME,
            "severity": SEVERITY,
            "period_type": period_type,
            "message": (
                f"{ticker}: Net Profit collapsed by {drop_pct:.1f}% "
                f"from {prev_label} to {curr_label}."
            ),
            "details": {
                "current_period": curr_label,
                "previous_period": prev_label,
                "current_pat": curr_pat,
                "previous_pat": prev_pat,
                "drop_pct": round(drop_pct, 2),
            }
        }

    return None
