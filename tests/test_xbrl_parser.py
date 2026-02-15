import unittest
from datetime import date
from io import BytesIO
from lxml import etree
import sys
import os

# Add project root to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ingestion.xbrl_parser import _extract_contexts, parse_xbrl_content, COMMON_NAMESPACES

class TestXBRLParser(unittest.TestCase):

    def setUp(self):
        # Sample XBRL snippet
        self.xml_content = b"""<?xml version="1.0" encoding="utf-8"?>
        <xbrli:xbrl xmlns:in-bse-fin="http://www.bseindia.com/xbrl/fin/2020-03-31/in-bse-fin"
                    xmlns:xbrli="http://www.xbrl.org/2003/instance"
                    xmlns:iso4217="http://www.xbrl.org/2003/iso4217">
            
            <!-- Annual Context (Duration) -->
            <xbrli:context id="OneD">
                <xbrli:period>
                    <xbrli:startDate>2023-04-01</xbrli:startDate>
                    <xbrli:endDate>2024-03-31</xbrli:endDate>
                </xbrli:period>
            </xbrli:context>

            <!-- Quarterly Context (Duration) -->
            <xbrli:context id="OneQ">
                <xbrli:period>
                    <xbrli:startDate>2024-01-01</xbrli:startDate>
                    <xbrli:endDate>2024-03-31</xbrli:endDate>
                </xbrli:period>
            </xbrli:context>

            <!-- Instant Context (End of Year/Quarter) -->
            <xbrli:context id="Instant">
                <xbrli:period>
                    <xbrli:instant>2024-03-31</xbrli:instant>
                </xbrli:period>
            </xbrli:context>

            <!-- Values -->
            <in-bse-fin:RevenueFromOperations contextRef="OneD" unitRef="INR" decimals="-5">1000</in-bse-fin:RevenueFromOperations>
            <in-bse-fin:RevenueFromOperations contextRef="OneQ" unitRef="INR" decimals="-5">250</in-bse-fin:RevenueFromOperations>
            
            <in-bse-fin:ProfitBeforeTax contextRef="OneD" unitRef="INR" decimals="-5">100</in-bse-fin:ProfitBeforeTax>
            <in-bse-fin:ProfitBeforeTax contextRef="OneQ" unitRef="INR" decimals="-5">25</in-bse-fin:ProfitBeforeTax>

            <in-bse-fin:NetCashProvidedByUsedInOperatingActivities contextRef="OneD" unitRef="INR" decimals="-5">120</in-bse-fin:NetCashProvidedByUsedInOperatingActivities>
            
            <!-- Balance Sheet (Instant) -->
            <in-bse-fin:LongTermBorrowings contextRef="Instant" unitRef="INR" decimals="-5">500</in-bse-fin:LongTermBorrowings>

        </xbrli:xbrl>
        """
        self.root = etree.parse(BytesIO(self.xml_content)).getroot()
        self.ns_map = {
            'xbrli': 'http://www.xbrl.org/2003/instance',
            'in-bse-fin': 'http://www.bseindia.com/xbrl/fin/2020-03-31/in-bse-fin'
        }

    def test_extract_contexts(self):
        contexts = _extract_contexts(self.root)
        
        # Check Annual (OneD)
        self.assertIn("OneD", contexts)
        oned = contexts["OneD"]
        self.assertEqual(oned["type"], "duration")
        self.assertEqual(oned["start"], "2023-04-01")
        self.assertEqual(oned["end"], "2024-03-31")
        
        # Check Quarterly (OneQ)
        self.assertIn("OneQ", contexts)
        oneq = contexts["OneQ"]
        self.assertEqual(oneq["type"], "duration")
        self.assertEqual(oneq["start"], "2024-01-01")
        self.assertEqual(oneq["end"], "2024-03-31")

        # Check Instant
        self.assertIn("Instant", contexts)
        self.assertEqual(contexts["Instant"]["type"], "instant")

    def test_build_records(self):
        contexts = _extract_contexts(self.root)
        records_map = {}
        
        # Manually verify mapping logic if needed, or stick to integration test style
        # But let's test _build_records directly if we interpret extracted values
        
        pass

    def test_full_parse(self):
        records = parse_xbrl_content(self.xml_content)
        
        # Should have 2 records: Annual (2024 Q0) and Quarterly (2024 Q4)
        self.assertEqual(len(records), 2)
        
        # Sort by quarter to distinguish
        annual = next(r for r in records if r["quarter"] == 0)
        quarterly = next(r for r in records if r["quarter"] == 4)

        # Check Annual
        self.assertEqual(annual["year"], 2024)
        self.assertEqual(annual["revenue"], 1000)
        self.assertEqual(annual["profit_before_tax"], 100)
        self.assertEqual(annual["operating_cash_flow"], 120)
        self.assertEqual(annual["total_debt"], 500) # BorrowingsLongTerm

        # Check Quarterly
        self.assertEqual(quarterly["year"], 2024)
        self.assertEqual(quarterly["revenue"], 250)
        self.assertEqual(quarterly["profit_before_tax"], 25)
        # OCF might be None for Quarterly if not tagged, or inherited if Instant?
        # OCF is duration context. If tagged only in Annual, expecting None in Quarterly.
        self.assertIsNone(quarterly.get("operating_cash_flow"))
        
        # Debt (Instant) should be in BOTH if date matches
        # Date is 2024-03-31 for matches both Annual end and Quarterly end
        self.assertEqual(quarterly["total_debt"], 500)

if __name__ == '__main__':
    unittest.main()
