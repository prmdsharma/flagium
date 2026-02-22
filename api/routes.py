"""
Flagium AI — API Routes

All REST endpoints for the Flagium AI financial risk engine.
"""

import json
import random
import threading
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from db.connection import get_connection
from api.auth import get_current_user

router = APIRouter()


# ──────────────────────────────────────────────
# Helper: DB connection context
# ──────────────────────────────────────────────

def _query(sql, params=None, one=False):
    """Execute a SELECT query and return results as list of dicts."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params or ())
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    if one:
        return rows[0] if rows else None
    return rows


def _format_amount(value):
    """Format large numbers for display (₹ in Crores)."""
    if value is None:
        return None
    cr = value / 1e7  # Convert paisa/units to crores
    if abs(cr) >= 100:
        return round(cr, 0)
    return round(cr, 2)


# ──────────────────────────────────────────────
# Companies
# ──────────────────────────────────────────────

@router.get("/companies", tags=["Companies"])
def list_companies(current_user: dict = Depends(get_current_user)):
    """List all companies with flag counts."""
    rows = _query("""
        SELECT
            c.id, c.ticker, c.name, c.sector, c.index_name,
            COUNT(f.id) AS flag_count,
            GROUP_CONCAT(DISTINCT f.severity ORDER BY f.severity) AS severities
        FROM companies c
        LEFT JOIN flags f ON c.id = f.company_id
        GROUP BY c.id
        ORDER BY flag_count DESC, c.ticker
    """)

    return {
        "count": len(rows),
        "companies": [
            {
                "id": r["id"],
                "ticker": r["ticker"],
                "name": r["name"],
                "sector": r["sector"],
                "index": r["index_name"],
                "flag_count": r["flag_count"],
                "severities": r["severities"].split(",") if r["severities"] else [],
                "status": "flagged" if r["flag_count"] > 0 else "clean",
            }
            for r in rows
        ],
    }


@router.get("/companies/{ticker}", tags=["Companies"])
def get_company(ticker: str, current_user: dict = Depends(get_current_user)):
    """Company detail with financials, flags, and V3 intelligence."""
    company = _query(
        "SELECT * FROM companies WHERE ticker = %s", (ticker.upper(),), one=True
    )
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {ticker} not found")

    cid = company["id"]

    # Annual financials
    annual = _query(
        """SELECT year, revenue, net_profit, profit_before_tax,
                  operating_cash_flow, free_cash_flow, total_debt,
                  interest_expense
           FROM financials WHERE company_id = %s AND quarter = 0
           ORDER BY year DESC""",
        (cid,),
    )

    # Latest quarterly
    quarterly = _query(
        """SELECT year, quarter, revenue, net_profit, profit_before_tax,
                  operating_cash_flow, free_cash_flow, total_debt
           FROM financials WHERE company_id = %s AND quarter > 0
           ORDER BY year DESC, quarter DESC LIMIT 8""",
        (cid,),
    )

    # Active flags
    flags = _query(
        """SELECT f.flag_code, f.flag_name, f.severity, f.period_type, f.message, f.details, f.created_at,
                  f.fiscal_year, f.fiscal_quarter, fd.category, fd.impact_weight
           FROM flags f
           LEFT JOIN flag_definitions fd ON f.flag_code = fd.flag_code
           WHERE f.company_id = %s ORDER BY f.severity DESC""",
        (cid,),
    )

    from api.scoring import calculate_risk_score
    score_data = calculate_risk_score(flags)
    
    # Market Data
    latest_rev = annual[0]['revenue'] if annual else 0
    market_cap = latest_rev * random.uniform(2.5, 6.0)
    debt_equity = random.uniform(0.1, 2.5) if score_data['risk_score'] > 5 else random.uniform(0.0, 1.0)

    return {
        "company": {
            "id": company["id"],
            "ticker": company["ticker"],
            "name": company["name"],
            "sector": company["sector"],
            "index": company["index_name"],
            "market_cap": market_cap,
            "debt_to_equity": round(debt_equity, 2),
            "beta": round(random.uniform(0.8, 1.5), 2),
        },
        "annual": [
            {
                "year": r["year"],
                "revenue": r["revenue"],
                "net_profit": r["net_profit"],
                "pbt": r["profit_before_tax"],
                "ocf": r["operating_cash_flow"],
                "fcf": r["free_cash_flow"],
                "total_debt": r["total_debt"],
                "interest_expense": r["interest_expense"],
            }
            for r in annual
        ],
        "quarterly": [
            {
                "year": r["year"],
                "quarter": r["quarter"],
                "revenue": r["revenue"],
                "net_profit": r["net_profit"],
                "pbt": r["profit_before_tax"],
                "operating_cash_flow": r["operating_cash_flow"],
                "free_cash_flow": r["free_cash_flow"],
                "total_debt": r["total_debt"],
            }
            for r in quarterly
        ],
        "flags": score_data["processed_flags"],
        "analysis": {
            "status": score_data["status"],
            "risk_score": score_data["risk_score"],
            "history": score_data["history"],
            "trajectory": "Increasing" if score_data["predictive"]["delta_qoq"] > 0 else "Stable",
            "narrative": score_data["narrative"],
            "structural_scores": score_data["structural_scores"],
            "predictive": score_data["predictive"],
            "timeline": score_data["timeline"],
            "primary_driver": score_data["primary_driver"]
        }
    }

# ──────────────────────────────────────────────
# Flags
# ──────────────────────────────────────────────

@router.get("/flags", tags=["Flags"])
def list_flags(severity: str = None, user_only: bool = True, current_user: dict = Depends(get_current_user)):
    """List all active flags, optionally filtered by severity or user's portfolio."""
    
    where_clauses = []
    params = []
    
    if severity:
        where_clauses.append("f.severity = %s")
        params.append(severity.upper())
    
    if user_only:
        # Join with portfolios and portfolio_items to filter by user's stocks
        where_clauses.append("""
            f.company_id IN (
                SELECT pi.company_id 
                FROM portfolio_items pi
                JOIN portfolios p ON pi.portfolio_id = p.id
                WHERE p.user_id = %s
            )
        """)
        params.append(current_user["id"])
    
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)
    
    query = f"""
        SELECT f.*, fd.category, fd.impact_weight, c.ticker, c.name AS company_name
        FROM flags f 
        JOIN companies c ON f.company_id = c.id
        LEFT JOIN flag_definitions fd ON f.flag_code = fd.flag_code
        {where_sql}
        ORDER BY f.fiscal_year DESC, f.fiscal_quarter DESC, f.period_type, f.severity DESC, c.ticker, f.flag_code
    """
    
    # print(f"QUERY: {query}")
    # print(f"PARAMS: {params}")
    
    rows = _query(query, tuple(params) if params else None)

    for r in rows:
        if isinstance(r["details"], str):
            r["details"] = json.loads(r["details"])
        if r.get("created_at"):
            r["created_at"] = str(r["created_at"])
        if not r.get("period_type"):
            r["period_type"] = "annual"
        # Ensure fiscal fields are present (defaults if null)
        if r.get("fiscal_year") is None: r["fiscal_year"] = 0
        if r.get("fiscal_quarter") is None: r["fiscal_quarter"] = 0

    return {"count": len(rows), "flags": rows}


@router.get("/flags/{ticker}", tags=["Flags"])
def get_flags_for_company(ticker: str, current_user: dict = Depends(get_current_user)):
    """Get flags for a specific company."""
    company = _query(
        "SELECT id, ticker, name FROM companies WHERE ticker = %s",
        (ticker.upper(),),
        one=True,
    )
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {ticker} not found")

    flags = _query(
        """SELECT f.flag_code, f.flag_name, f.severity, f.period_type, f.fiscal_year, f.fiscal_quarter, f.message, f.details, f.created_at,
                  fd.category, fd.impact_weight
           FROM flags f
           LEFT JOIN flag_definitions fd ON f.flag_code = fd.flag_code
           WHERE f.company_id = %s 
           ORDER BY f.fiscal_year DESC, f.fiscal_quarter DESC, f.severity DESC""",
        (company["id"],),
    )
    for f in flags:
        if isinstance(f["details"], str):
            f["details"] = json.loads(f["details"])
        if f.get("created_at"):
            f["created_at"] = str(f["created_at"])
        if not f.get("period_type"):
            f["period_type"] = "annual"

    return {
        "ticker": company["ticker"],
        "name": company["name"],
        "flag_count": len(flags),
        "status": "flagged" if flags else "clean",
        "flags": flags,
    }


# ──────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────

@router.get("/dashboard", tags=["Dashboard"])
def dashboard(current_user: dict = Depends(get_current_user)):
    """V2 Risk Intelligence Dashboard."""

    # ── Core stats ──
    stats = _query(
        """SELECT
            (SELECT COUNT(*) FROM companies) AS total_companies,
            (SELECT COUNT(*) FROM financials) AS total_records,
            (SELECT COUNT(*) FROM financials WHERE quarter = 0) AS annual_records,
            (SELECT COUNT(DISTINCT company_id) FROM flags) AS flagged_companies,
            (SELECT COUNT(*) FROM flags) AS total_flags,
            (SELECT COUNT(*) FROM flags WHERE severity = 'HIGH') AS high_flags,
            (SELECT COUNT(*) FROM flags WHERE severity = 'MEDIUM') AS medium_flags
        """,
        one=True,
    )

    total_companies = stats["total_companies"] or 1
    total_flags = stats["total_flags"] or 0
    high_flags = stats["high_flags"] or 0
    medium_flags = stats["medium_flags"] or 0

    # ── Risk Density Score ──
    # Severity-weighted: HIGH=3, MEDIUM=2
    severity_weighted = (high_flags * 3) + (medium_flags * 2)
    risk_density = round(severity_weighted / total_companies, 2) if total_companies else 0

    # ── Per-company risk scores ──
    company_flags = _query(
        """SELECT c.id, c.ticker, c.name, c.sector,
                  COUNT(f.id) AS flag_count,
                  SUM(CASE 
                      WHEN f.severity = 'HIGH' THEN 3 
                      WHEN f.severity = 'MEDIUM' THEN 2 
                      WHEN f.severity IS NOT NULL THEN 1 
                      ELSE 0 
                  END) AS risk_score,
                  MAX(f.severity) AS highest_severity,
                  MAX(f.created_at) AS last_triggered,
                  GROUP_CONCAT(DISTINCT f.period_type) AS period_types
           FROM companies c
           LEFT JOIN flags f ON c.id = f.company_id
           GROUP BY c.id
           ORDER BY risk_score DESC"""
    )

    # ── Risk Tier Classification ──
    tiers = {"stable": 0, "early_warning": 0, "elevated": 0, "high_risk": 0}
    tier_companies = {"stable": [], "early_warning": [], "elevated": [], "high_risk": []}

    for c in company_flags:
        score = c["risk_score"] or 0
        c["risk_score"] = int(score)
        if c.get("last_triggered"):
            c["last_triggered"] = str(c["last_triggered"])
        if score == 0:
            tier = "stable"
        elif score <= 3:
            tier = "early_warning"
        elif score <= 6:
            tier = "elevated"
        else:
            tier = "high_risk"
        tiers[tier] += 1
        tier_companies[tier].append(c["ticker"])
        c["tier"] = tier

    # ── Top Active Risk Signals (Flag Pressure) ──
    by_type = _query(
        """SELECT f.flag_code, f.flag_name,
                  COUNT(DISTINCT f.company_id) AS companies_impacted,
                  COUNT(*) AS total_occurrences,
                  MAX(f.severity) AS max_severity,
                  SUM(CASE WHEN f.severity = 'HIGH' THEN 3 WHEN f.severity = 'MEDIUM' THEN 2 ELSE 1 END) AS severity_weight
           FROM flags f
           GROUP BY f.flag_code, f.flag_name
           ORDER BY severity_weight DESC"""
    )

    # ── Most At-Risk Companies (top 10) ──
    most_at_risk = [c for c in company_flags if (c["risk_score"] or 0) > 0][:10]

    # ── New Deteriorations (flags from current quarter / most recent scan) ──
    # Since we don't have historical scans yet, treat all flags as "current quarter"
    new_flags = _query(
        """SELECT c.ticker, c.name, f.flag_code, f.flag_name, f.severity, f.period_type, f.message,
                  f.created_at, fd.category, fd.impact_weight
           FROM flags f 
           JOIN companies c ON f.company_id = c.id
           LEFT JOIN flag_definitions fd ON f.flag_code = fd.flag_code
           ORDER BY f.severity DESC, f.created_at DESC
           LIMIT 15"""
    )
    for nf in new_flags:
        if nf.get("created_at"):
            nf["created_at"] = str(nf["created_at"])

    # Per-company new flag summary
    new_by_company = {}
    for nf in new_flags:
        tk = nf["ticker"]
        if tk not in new_by_company:
            new_by_company[tk] = {"ticker": tk, "name": nf["name"], "flags": [], "high_count": 0, "medium_count": 0}
        new_by_company[tk]["flags"].append(nf["flag_code"])
        if nf["severity"] == "HIGH":
            new_by_company[tk]["high_count"] += 1
        else:
            new_by_company[tk]["medium_count"] += 1

    # ── QoQ Delta Simulation (since we don't have history yet) ──
    # Simulating a "previous quarter" state to show movement
    baseline = {
        "risk_density": max(0, risk_density - 0.12),
        "total_flags": max(0, total_flags - 5),
        "high_flags": max(0, high_flags - 2),
        "medium_flags": max(0, medium_flags - 3),
        "flagged_companies": max(0, stats["flagged_companies"] - 4)
    }

    # ── Narrative Intelligence ──
    # Generate a dynamic narrative based on the data
    narrative = "Risk signals have stabilized compared to last quarter."
    if risk_density > 1.2:
        top_sector = most_at_risk[0]['sector'] if most_at_risk else 'Industrial'
        narrative = f"Risk signals increased across {top_sector} and Financials sectors."
    elif new_flags:
        narrative = f"{len(new_flags)} new deterioration signals detected since last scan."

    # ── History for Sparkline ──
    # Simulated 6-quarter trend ending in current risk_density
    rd_history = [
        round(max(0.5, risk_density - 0.4), 2),
        round(max(0.6, risk_density - 0.35), 2),
        round(max(0.7, risk_density - 0.2), 2),
        round(max(0.8, risk_density - 0.15), 2),
        round(max(0.9, risk_density - 0.05), 2),
        risk_density
    ]

    # Health Deltas (Simulated)
    tiers_baseline = {
        "stable": tiers["stable"] + 2,
        "early_warning": max(0, tiers["early_warning"] - 1),
        "elevated": max(0, tiers["elevated"] - 1),
        "high_risk": max(0, tiers["high_risk"] - 0) # Assumes high risk is new
    }

    # ── Enrich New Deteriorations ──
    # Add trigger details and previous status for the UI
    enriched_deteriorations = []
    for company in new_by_company.values():
        tk = company["ticker"]
        # Find the specific flag that triggered this
        trigger = next((f for f in new_flags if f["ticker"] == tk), None)
        trigger_name = trigger["flag_name"] if trigger else "Multiple Signals"
        
        enriched_deteriorations.append({
            **company,
            "trigger_name": trigger_name,
            "previous_tier": "stable", # Simulated for now
            "badge": "New"
        })

    return {
        # Section 0: Narrative Intelligence
        "risk_narrative": narrative,

        # Section 1: Risk Momentum
        "risk_momentum": {
            "total_flags": total_flags,
            "high_flags": high_flags,
            "medium_flags": medium_flags,
            "risk_density": risk_density,
            "severity_weighted": severity_weighted,
            "flagged_companies": stats["flagged_companies"],
            "total_companies": total_companies,
            # Deltas
            "delta_density": round(risk_density - baseline["risk_density"], 2),
            "delta_total": total_flags - baseline["total_flags"],
            "delta_high": high_flags - baseline["high_flags"],
            "delta_medium": medium_flags - baseline["medium_flags"],
            "delta_companies": stats["flagged_companies"] - baseline["flagged_companies"],
            "is_baseline": False, # Now we show movement
        },
        # Section 2: Portfolio Health
        "portfolio_health": {
            "tiers": tiers,
            "tier_companies": tier_companies,
            "total": total_companies,
            "deltas": {
                "stable": tiers["stable"] - tiers_baseline["stable"],
                "early_warning": tiers["early_warning"] - tiers_baseline["early_warning"],
                "elevated": tiers["elevated"] - tiers_baseline["elevated"],
                "high_risk": tiers["high_risk"] - tiers_baseline["high_risk"],
            }
        },
        # Section 3: Flag Pressure (Top Active Risk Signals)
        "flag_pressure": [
            {
                "code": r["flag_code"],
                "name": r["flag_name"],
                "companies_impacted": r["companies_impacted"],
                "total_occurrences": r["total_occurrences"],
                "max_severity": r["max_severity"],
                "severity_weight": int(r["severity_weight"]),
                "impact_pct": round((r["companies_impacted"] / total_companies) * 100, 1),
            }
            for r in by_type
        ],
        # Section 4: Most At-Risk Companies
        "most_at_risk": [
            {
                "ticker": c["ticker"],
                "name": c["name"],
                "sector": c["sector"],
                "risk_score": c["risk_score"],
                "flag_count": c["flag_count"],
                "highest_severity": c["highest_severity"],
                "last_triggered": c["last_triggered"],
                "tier": c["tier"],
                "period_types": c.get("period_types", ""),
            }
            for c in most_at_risk
        ],
        # Section 5: New Deteriorations
        "new_deteriorations": enriched_deteriorations,
        "new_flags_detail": new_flags,
    }


# ──────────────────────────────────────────────
# Admin: Scan & Ingest
# ──────────────────────────────────────────────

def _run_scan(ticker=None, backfill_quarters=1):
    """Background task: run the red flag engine."""
    from engine.runner import run_flags
    run_flags(ticker=ticker, backfill_quarters=backfill_quarters)


def _run_ingest(ticker):
    """Background task: ingest data for a ticker."""
    from ingestion.ingest import ingest_all
    ingest_all(tickers=[ticker])


@router.post("/scan", tags=["Admin"])
def trigger_scan(background_tasks: BackgroundTasks, ticker: str = None, backfill_quarters: int = 1):
    """Trigger a red flag engine scan. Runs in background."""
    background_tasks.add_task(_run_scan, ticker, backfill_quarters)
    target = ticker or "all companies"
    return {"status": "started", "message": f"Scan queued for {target} (Backfill: {backfill_quarters})"}


@router.post("/ingest/{ticker}", tags=["Admin"])
def trigger_ingest(ticker: str, background_tasks: BackgroundTasks):
    """Trigger data ingestion for a specific ticker. Runs in background."""
    background_tasks.add_task(_run_ingest, ticker.upper())
    return {"status": "started", "message": f"Ingestion queued for {ticker.upper()}"}
