"""
Flag: Low Interest Coverage

Detects difficulty in servicing debt obligations.
Rule: Trigger if Interest Coverage Ratio (EBIT / Interest Expense) < 2.5.
      EBIT = Profit Before Tax + Interest Expense.
Severity: HIGH (< 1.5), MEDIUM (< 2.5)
"""

FLAG_CODE = "F4"
FLAG_NAME = "Low Interest Coverage"

# pbt and interest_expense are available in quarterly data
SUPPORTS_QUARTERLY = True


def check(conn, company_id, ticker, period_type="annual"):
    """
    Check if Interest Coverage Ratio is low.
    Supports both annual and quarterly data.
    """
    cursor = conn.cursor(dictionary=True)

    if period_type == "quarterly":
        # Compare latest quarter vs same quarter previous year (YoY)
        query = """
            SELECT year, quarter, profit_before_tax, interest_expense
            FROM financials
            WHERE company_id = %s AND quarter > 0
            ORDER BY year DESC, quarter DESC
            LIMIT 1
        """
        cursor.execute(query, (company_id,))
    else:
        query = """
            SELECT year, profit_before_tax, interest_expense
            FROM financials
            WHERE company_id = %s AND quarter = 0
            ORDER BY year DESC
            LIMIT 1
        """
        cursor.execute(query, (company_id,))

    row = cursor.fetchone()
    cursor.close()

    if not row:
        return None

    pbt = row["profit_before_tax"]
    interest = row["interest_expense"]

    if pbt is None or interest is None:
        return None

    # Calculate EBIT
    ebit = pbt + interest

    if interest == 0:
        return None

    ratio = ebit / interest

    if ratio < 2.5:
        severity = "HIGH" if ratio < 1.5 else "MEDIUM"

        if period_type == "quarterly":
            period_label = f"FY{row['year']} Q{row['quarter']}"
        else:
            period_label = str(row["year"])

        return {
            "flag_code": FLAG_CODE,
            "flag_name": FLAG_NAME,
            "severity": severity,
            "period_type": period_type,
            "message": (
                f"{ticker}: Low Interest Coverage Ratio of {ratio:.2f}x in {period_label} "
                f"(Threshold: 2.5x)."
            ),
            "details": {
                "period": period_label,
                "year": row["year"],
                "quarter": row.get("quarter", 0),
                "ebit": ebit,
                "interest_expense": interest,
                "ratio": round(ratio, 2),
            }
        }

    return None
