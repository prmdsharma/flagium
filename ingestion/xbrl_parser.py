"""
Flagium — XBRL Parser

Parses XBRL (XML) financial filings from NSE/BSE
and extracts structured financial data.

XBRL files from Indian exchanges follow the Indian GAAP / Ind AS
taxonomy with standard tag names for financial line items.
"""

from lxml import etree
from io import BytesIO
from datetime import datetime
import os
import logging
import sys


# ──────────────────────────────────────────────
# Module Logger
# ──────────────────────────────────────────────

_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)
_LOG_FORMAT = "[%(asctime)s], [%(levelname)s], [%(ticker)s], %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"


class _XBRLFilter(logging.Filter):
    def __init__(self, ticker="XBRL"):
        super().__init__()
        self.ticker = ticker
    def filter(self, record):
        record.ticker = self.ticker
        return True


def _get_xbrl_logger() -> logging.Logger:
    logger_name = "flagium.xbrl"
    logger = logging.getLogger(logger_name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.DEBUG)
    tf = _XBRLFilter()
    fmt = logging.Formatter(_LOG_FORMAT, datefmt=_LOG_DATEFMT)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    ch.addFilter(tf)
    logger.addHandler(ch)
    fh = logging.FileHandler(os.path.join(_LOG_DIR, "ingestion.log"), encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    fh.addFilter(tf)
    logger.addHandler(fh)
    logger.propagate = False
    return logger


_logger = _get_xbrl_logger()



# ──────────────────────────────────────────────
# XBRL Tag Mapping
# ──────────────────────────────────────────────
# Maps our internal field names to possible XBRL tag names.
# Indian filings use various taxonomies, so we check multiple
# possible tag names for each field.

XBRL_TAG_MAP = {
    "revenue": [
        "RevenueFromOperations",
        "InterestEarned", # Banking
        "TotalRevenue",
        "Revenue",
        "RevenueFromOperationsNet",
        "IncomeFromOperations",
        "TotalIncomeFromOperations",
        "GrossIncomeFromOperations",
        # Banking taxonomy
        "Income",
    ],
    # Other income is added to revenue to compute Total Income (matching NSE-reported figures)
    "other_income": [
        "OtherIncome",
        "OtherOperatingIncome",
        "OtherOperatingRevenues",
        "MiscellaneousIncome",
    ],
    "net_profit": [
        "ProfitLossAfterTaxesMinorityInterestAndShareOfProfitLossOfAssociates", # Banking headliner
        "ProfitOrLossAttributableToOwnersOfParent", # Standard headliner (Consolidated)
        "ProfitLossAttributableToOwnersOfParent", # Standard variant
        "ProfitLossForPeriod",   # Standard headliner (Standalone)
        "ProfitLossAfterTax",
        "NetProfitLossAfterTax",
        "ProfitAfterTax",
        "NetProfitAfterTaxes",
        "ProfitLoss",
        "ProfitLossForThePeriod",
        "ProfitLossFromOrdinaryActivitiesAfterTax",
    ],
    "profit_before_tax": [
        "ProfitLossBeforeTax",
        "ProfitBeforeTax",
        "NetProfitLossBeforeTax",
        # Banking taxonomy
        "ProfitLossFromOrdinaryActivitiesBeforeTax",
    ],
    "operating_cash_flow": [
        "NetCashFromOperatingActivities",
        "NetCashProvidedByUsedInOperatingActivities",
        "CashFlowFromOperatingActivities",
        "NetCashGeneratedFromOperatingActivities",
        "CashGeneratedFromOperations",
        "CashFlowsFromUsedInOperatingActivities",
    ],
    "free_cash_flow": [
        # FCF is rarely reported directly in XBRL;
        # we'll compute it as OCF - CapEx if needed
        "FreeCashFlow",
    ],
    "total_debt": [
        "TotalBorrowings",
        "TotalDebt",
        "Borrowings",
    ],
    "long_term_debt": [
        "LongTermBorrowings",
        "BorrowingsNonCurrent",
        "BorrowingsNoncurrent",
    ],
    "short_term_debt": [
        "ShortTermBorrowings",
        "BorrowingsCurrent",
        "CurrentMaturitiesOfLongTermDebt",
    ],
    "interest_expense": [
        "FinanceCosts",
        "InterestExpense",
        "FinanceCost",
        "InterestExpenses",
        "BorrowingCosts",
        "FinanceCostsInterestExpense",
        # Banking taxonomy
        "InterestExpended",
    ],
    # Additional tags for computing derived values
    "capex": [
        "PurchaseOfPropertyPlantAndEquipment",
        "CapitalExpenditure",
        "PurchaseOfTangibleAssets",
        "AdditionsToFixedAssets",
        "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities",
    ],
}

# Namespace prefixes commonly found in Indian XBRL filings
COMMON_NAMESPACES = {
    "xbrli": "http://www.xbrl.org/2003/instance",
    "in-gaap": "http://www.mca.gov.in/xbrl/taxonomy/in-gaap",
    "indas": "http://www.mca.gov.in/xbrl/taxonomy/indas",
}


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

def parse_xbrl_file(file_path):
    """Parse an XBRL file and extract financial data.

    Args:
        file_path: Path to the XBRL XML file.

    Returns:
        List of dicts, each containing:
        {
            "period_end": "2024-03-31",
            "year": 2024,
            "quarter": 4,
            "revenue": 235000,
            "net_profit": 18500,
            ...
        }
    """
    if not os.path.exists(file_path):
        _logger.error(f"File not found: {file_path}")
        return []

    with open(file_path, "rb") as f:
        return parse_xbrl_content(f.read())


def parse_xbrl_content(content):
    """Parse XBRL XML content (bytes) and extract financial data."""
    try:
        tree = etree.parse(BytesIO(content))
    except etree.XMLSyntaxError as e:
        _logger.error(f"Failed to parse XBRL XML: {e}")
        return []

    # Step 1: Extract all contexts (periods)
    contexts = _extract_contexts(tree)

    # Step 2: Extract financial values by tag
    raw_values = _extract_values(tree, contexts)

    # Step 3: Group by period and build records
    records = _build_records(raw_values, contexts)

    return records


# ──────────────────────────────────────────────
# Internal Helpers
# ──────────────────────────────────────────────

def _extract_contexts(tree):
    """Extract XBRL context definitions with their period info.

    Returns:
        dict mapping context_id -> {
            "type": "instant" | "duration",
            "date": "YYYY-MM-DD",      (for instant)
            "start": "YYYY-MM-DD",     (for duration)
            "end": "YYYY-MM-DD",       (for duration)
        }
    """
    ns = COMMON_NAMESPACES
    contexts = {}

    for ctx in tree.xpath("//*[local-name()='context']"):
        ctx_id = ctx.attrib.get("id", "")
        # Find period using local-name
        period_nodes = ctx.xpath("./*[local-name()='period']")
        if not period_nodes:
            continue
        period = period_nodes[0]

        # Use local-name() to be more robust against namespace variations
        instant = period.xpath("./*[local-name()='instant']")
        start = period.xpath("./*[local-name()='startDate']")
        end = period.xpath("./*[local-name()='endDate']")

        if instant:
            contexts[ctx_id] = {
                "type": "instant",
                "date": instant[0].text.strip() if instant[0].text else None,
            }
        elif start and end:
            contexts[ctx_id] = {
                "type": "duration",
                "start": start[0].text.strip() if start[0].text else None,
                "end": end[0].text.strip() if end[0].text else None,
                "date": end[0].text.strip() if end[0].text else None,
            }

    # Fallback for BSE-style filings where contexts might be referenced but not explicitly defined as xbrli:context
    # We look for metadata tags that define the period for a given contextRef
    # IMPORTANT: We prioritize Reporting Period over Financial Year for duration calc
    for tag_name, start_or_end in [
        ("DateOfStartOfReportingPeriod", "start"), 
        ("DateOfEndOfReportingPeriod", "end")
    ]:
        for node in tree.xpath(f"//*[local-name()='{tag_name}']"):
            ctx_id = node.attrib.get("contextRef")
            if not ctx_id: continue
            val = node.text.strip() if node.text else None
            if not val: continue
            
            if ctx_id not in contexts:
                contexts[ctx_id] = {"type": "duration", "start": None, "end": None, "date": None}
            
            contexts[ctx_id][start_or_end] = val
            if start_or_end == "end":
                contexts[ctx_id]["date"] = val

    return contexts


def _extract_values(tree, contexts):
    """Extract all financial values matching our tag map.

    Returns:
        List of dicts: [
            {
                "field": "revenue",
                "tag": "RevenueFromOperations",
                "value": 235000.0,
                "context_id": "ctx_1",
                "date": "2024-03-31"
            },
            ...
        ]
    """
    values = []

    for field, tags in XBRL_TAG_MAP.items():
        for tag in tags:
            # Search using local-name() to ignore namespace prefixes
            nodes = tree.xpath(f'//*[local-name()="{tag}"]')
            for node in nodes:
                ctx_ref = node.attrib.get("contextRef", "")
                ctx = contexts.get(ctx_ref)
                if not ctx:
                    continue

                raw_value = node.text
                if raw_value is None:
                    continue

                try:
                    # Parse numeric value (handle commas, spaces)
                    clean_value = raw_value.strip().replace(",", "")
                    num_value = float(clean_value)

                    # Check for unit/decimals attributes
                    decimals = node.attrib.get("decimals", "")
                    # INR values in XBRL are sometimes in lakhs or crores
                    # We store as-is and document the unit

                    values.append({
                        "field": field,
                        "tag": tag,
                        "value": num_value,
                        "context_id": ctx_ref,
                        "date": ctx.get("date", ""),
                        "period_type": ctx.get("type", ""),
                        "decimals": decimals,
                    })
                except (ValueError, TypeError):
                    continue

    return values


def _build_records(raw_values, contexts):
    """Group extracted values by period into financial records.
    
    Handles both Annual (>300 days) and Quarterly (<100 days) data.
    Balance sheet items (instant) are mapped to both if available.

    Returns:
        List of dicts, each representing one period's financials.
    """
    # Key: (date_str, is_annual_bool) -> dict of fields
    records_map = {}
    
    # Bucket to hold instant values to distribute later
    instant_values = []

    for v in raw_values:
        date = v["date"]
        ctx_id = v["context_id"]
        if not date or not ctx_id:
            continue
            
        ctx = contexts.get(ctx_id)
        if not ctx:
            continue
            
        if ctx["type"] == "duration":
            # Calculate duration to determine if Annual or Quarterly
            try:
                start = datetime.strptime(ctx["start"], "%Y-%m-%d")
                end = datetime.strptime(ctx["end"], "%Y-%m-%d")
                days = (end - start).days
            except (ValueError, TypeError):
                continue

            # Classify
            is_annual = days > 300
            is_quarterly = days < 100
            
            # We skip half-yearly or irregular periods for now
            if not (is_annual or is_quarterly):
                continue
                
            key = (date, is_annual)
            if key not in records_map:
                records_map[key] = {}
            
            # Add field (First match in XBRL_TAG_MAP wins)
            if v["field"] not in records_map[key]:
                records_map[key][v["field"]] = v["value"]
            
        elif ctx["type"] == "instant":
            instant_values.append(v)

    # Distribute instant values (Balance Sheet) to matching P&L periods
    for v in instant_values:
        date = v["date"]
        # Try both Annual and Quarterly buckets for this date
        for is_annual in [True, False]:
            key = (date, is_annual)
            if key in records_map:
                if v["field"] not in records_map[key]:
                    records_map[key][v["field"]] = v["value"]

    # Build final records list
    records = []
    for (date_str, is_annual), fields in records_map.items():
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            continue

        year = dt.year
        if is_annual:
            quarter = 0  # Annual
            # If financial year ends in March, the year is correct.
            # If not, standard practice is FY ending year.
        else:
            quarter = _date_to_quarter(dt)
            # Adjust year for Indian FY if needed?
            # Usually 'year' column implies FY ending.
            # For Q4 (Mar 2024), year=2024. Q1 (Jun 2023), year should be 2024?
            # Standard: Quarter belongs to the FY it falls in.
            # Q1 2024 (Jun 2023) -> FY24.
            # My _date_to_quarter logic: Jun->1, Sep->2, Dec->3, Mar->4.
            # Users usually expect Year to be the Fiscal Year End.
            # If month is 4,5,6 (Jun) -> Year is +1 ?
            # Date: 2023-06-30. _date_to_quarter -> 1.
            # If I store year=2023, that's wrong for FY24.
            # Logic: If month > 3, year = year + 1. If month <= 3, year = year.
            if dt.month > 3:
                year = year + 1

        # Total Income = RevenueFromOperations + OtherIncome (matches NSE-reported figures)
        if "revenue" in fields and "other_income" in fields:
            fields["revenue"] = (fields["revenue"] or 0) + (fields["other_income"] or 0)

        # Compute free_cash_flow if not directly available
        if "free_cash_flow" not in fields and "operating_cash_flow" in fields:
            capex = fields.get("capex", 0)
            # Capex is usually negative in CF statement (cash outflow)
            # We want OCF - Capex (absolute)
            if capex is not None:
                fields["free_cash_flow"] = fields["operating_cash_flow"] - abs(capex)

        record = {
            "period_end": date_str,
            "year": year,
            "quarter": quarter,
            "revenue": _to_int(fields.get("revenue")),
            "net_profit": _to_int(fields.get("net_profit")),
            "profit_before_tax": _to_int(fields.get("profit_before_tax")),
            "operating_cash_flow": _to_int(fields.get("operating_cash_flow")),
            "free_cash_flow": _to_int(fields.get("free_cash_flow")),
            "total_debt": _to_int(fields.get("total_debt")),
            "interest_expense": _to_int(fields.get("interest_expense")),
        }

        # Compute total_debt if missing but components exist
        if record["total_debt"] is None:
            ltd = _to_int(fields.get("long_term_debt")) or 0
            std = _to_int(fields.get("short_term_debt")) or 0
            if ltd or std:
                record["total_debt"] = ltd + std

        # Only include records that have at least revenue or net_profit or PBT
        if record["revenue"] is not None or record["net_profit"] is not None or record["profit_before_tax"] is not None:
            records.append(record)

    # Sort by date descending (most recent first)
    records.sort(key=lambda r: r["period_end"], reverse=True)
    return records


def _date_to_quarter(dt):
    """Convert a date to its financial quarter.

    Indian financial year: Apr-Mar
    Q1: Apr-Jun (period ending June)
    Q2: Jul-Sep (period ending September)
    Q3: Oct-Dec (period ending December)
    Q4: Jan-Mar (period ending March)
    """
    month = dt.month
    if month in (4, 5, 6):
        return 1
    elif month in (7, 8, 9):
        return 2
    elif month in (10, 11, 12):
        return 3
    else:  # 1, 2, 3
        return 4


def _to_int(value):
    """Convert a value to int, returning None if not possible."""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None
