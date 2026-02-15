import unittest
from unittest.mock import MagicMock
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from flags import ocf_vs_pat, negative_fcf, revenue_debt_divergence, interest_coverage, profit_collapse

class TestRedFlags(unittest.TestCase):

    def setUp(self):
        self.conn = MagicMock()
        self.cursor = MagicMock()
        self.conn.cursor.return_value = self.cursor
        self.company_id = 1
        self.ticker = "TEST"

    def test_f1_ocf_vs_pat(self):
        # Trigger: OCF < PAT in 2 of last 3 years
        # Year 1: PAT 100, OCF 50 (Fail)
        # Year 2: PAT 100, OCF 50 (Fail)
        # Year 3: PAT 100, OCF 120 (Pass)
        self.cursor.fetchall.return_value = [
            {"year": 2024, "net_profit": 100, "operating_cash_flow": 50},
            {"year": 2023, "net_profit": 100, "operating_cash_flow": 50},
            {"year": 2022, "net_profit": 100, "operating_cash_flow": 120},
        ]
        result = ocf_vs_pat.check(self.conn, self.company_id, self.ticker)
        self.assertIsNotNone(result)
        self.assertEqual(result["flag_code"], "F1")

        # Clean
        self.cursor.fetchall.return_value = [
            {"year": 2024, "net_profit": 100, "operating_cash_flow": 120},
            {"year": 2023, "net_profit": 100, "operating_cash_flow": 120},
            {"year": 2022, "net_profit": 100, "operating_cash_flow": 120},
        ]
        result = ocf_vs_pat.check(self.conn, self.company_id, self.ticker)
        self.assertIsNone(result)

    def test_f2_negative_fcf(self):
        # Trigger: Negative FCF for 3 consecutive years
        self.cursor.fetchall.return_value = [
            {"year": 2024, "free_cash_flow": -10},
            {"year": 2023, "free_cash_flow": -20},
            {"year": 2022, "free_cash_flow": -5},
        ]
        result = negative_fcf.check(self.conn, self.company_id, self.ticker)
        self.assertIsNotNone(result)
        self.assertEqual(result["flag_code"], "F2")

        # Clean
        self.cursor.fetchall.return_value = [
            {"year": 2024, "free_cash_flow": 10},
            {"year": 2023, "free_cash_flow": -20},
            {"year": 2022, "free_cash_flow": -5},
        ]
        result = negative_fcf.check(self.conn, self.company_id, self.ticker)
        self.assertIsNone(result)

    def test_f3_revenue_debt_divergence(self):
        # Trigger: Revenue -5%, Debt +20%
        # Current: Rev 95, Debt 120
        # Previous: Rev 100, Debt 100
        self.cursor.fetchall.return_value = [
            {"year": 2024, "revenue": 95, "total_debt": 120},
            {"year": 2023, "revenue": 100, "total_debt": 100},
        ]
        result = revenue_debt_divergence.check(self.conn, self.company_id, self.ticker)
        self.assertIsNotNone(result)
        self.assertEqual(result["flag_code"], "F3")

        # Clean
        self.cursor.fetchall.return_value = [
            {"year": 2024, "revenue": 110, "total_debt": 105},
            {"year": 2023, "revenue": 100, "total_debt": 100},
        ]
        result = revenue_debt_divergence.check(self.conn, self.company_id, self.ticker)
        self.assertIsNone(result)

    def test_f4_interest_coverage(self):
        # Trigger: Ratio < 2.5
        # PBT 10, Interest 10 -> EBIT 20. Ratio 2.0.
        self.cursor.fetchone.return_value = {
            "year": 2024, "profit_before_tax": 10, "interest_expense": 10
        }
        result = interest_coverage.check(self.conn, self.company_id, self.ticker)
        self.assertIsNotNone(result)
        self.assertEqual(result["flag_code"], "F4")
        self.assertEqual(result["severity"], "MEDIUM")

        # High Severity: Ratio < 1.5
        # PBT 2, Interest 10 -> EBIT 12. Ratio 1.2.
        self.cursor.fetchone.return_value = {
            "year": 2024, "profit_before_tax": 2, "interest_expense": 10
        }
        result = interest_coverage.check(self.conn, self.company_id, self.ticker)
        self.assertEqual(result["severity"], "HIGH")

        # Clean
        self.cursor.fetchone.return_value = {
            "year": 2024, "profit_before_tax": 100, "interest_expense": 10
        }
        result = interest_coverage.check(self.conn, self.company_id, self.ticker)
        self.assertIsNone(result)

    def test_f5_profit_collapse(self):
        # Trigger: > 50% drop
        # Prev: 100. Curr: 40.
        self.cursor.fetchall.return_value = [
            {"year": 2024, "net_profit": 40},
            {"year": 2023, "net_profit": 100},
        ]
        result = profit_collapse.check(self.conn, self.company_id, self.ticker)
        self.assertIsNotNone(result)
        self.assertEqual(result["flag_code"], "F5")

        # Clean
        self.cursor.fetchall.return_value = [
            {"year": 2024, "net_profit": 90},
            {"year": 2023, "net_profit": 100},
        ]
        result = profit_collapse.check(self.conn, self.company_id, self.ticker)
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()
