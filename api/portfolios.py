from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from db.connection import get_connection
from api.auth import get_current_user
from api.brokers.factory import BrokerFactory
import datetime
import csv
import io

router = APIRouter()

@router.get("/brokers/zerodha/login")
def get_zerodha_login():
    """Get the Zerodha login URL."""
    broker = BrokerFactory.get_broker("zerodha")
    return {"url": broker.get_login_url()}

class SyncRequest(BaseModel):
    request_token: str

async def sync_portfolio_holdings(portfolio_id: int, broker_type: str, request_token: str, user_id: int):
    """Generic helper to sync holdings from any broker."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Verify Ownership
    cursor.execute("SELECT id FROM portfolios WHERE id = %s AND user_id = %s", (portfolio_id, user_id))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Portfolio not found")

    try:
        broker = BrokerFactory.get_broker(broker_type)
        broker.authenticate(request_token)
        holdings = broker.get_holdings()
        
        success_count = 0
        failed_tickers = []
        
        for item in holdings:
            ticker = item.get("ticker")
            if ticker:
                ticker = ticker.strip().upper()
            
            if not ticker: continue
            
            # Use average_price if available, fallback to 100 for simulation if null
            avg_price = item.get("average_price") or 100
            investment = (item["quantity"]) * avg_price
            
            # Find Company
            cursor.execute("SELECT id FROM companies WHERE ticker = %s", (ticker,))
            company = cursor.fetchone()
            
            if not company:
                failed_tickers.append(ticker)
                continue
                
            # Add/Update in portfolio
            try:
                cursor.execute(
                    "INSERT INTO portfolio_items (portfolio_id, company_id, investment) VALUES (%s, %s, %s)",
                    (portfolio_id, company["id"], investment)
                )
            except:
                cursor.execute(
                    "UPDATE portfolio_items SET investment = %s WHERE portfolio_id = %s AND company_id = %s",
                    (investment, portfolio_id, company["id"])
                )
            success_count += 1
        
        conn.commit()
        return {
            "success_count": success_count,
            "failed_tickers": list(set(failed_tickers)),
            "total_processed": len(holdings)
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Broker sync error ({broker_type}): {str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.post("/{portfolio_id}/sync/zerodha")
async def sync_zerodha_portfolio(
    portfolio_id: int,
    req: SyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """Sync holdings from Zerodha Kite."""
    return await sync_portfolio_holdings(portfolio_id, "zerodha", req.request_token, current_user["id"])

@router.get("/brokers/groww/login")
def get_groww_login():
    """Get the Groww login URL."""
    broker = BrokerFactory.get_broker("groww")
    return {"url": broker.get_login_url()}

@router.post("/{portfolio_id}/sync/groww")
async def sync_groww_portfolio(
    portfolio_id: int,
    req: SyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """Sync holdings from Groww."""
    return await sync_portfolio_holdings(portfolio_id, "groww", req.request_token, current_user["id"])

class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class PortfolioItemAdd(BaseModel):
    ticker: str
    investment: Optional[int] = 100000

class PortfolioItemUpdate(BaseModel):
    investment: int

class PortfolioMetadata(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: str
    holdings_count: Optional[int] = 0

class PortfolioIntelligence(BaseModel):
    id: int
    name: str
    description: Optional[str]
    
    # Aggregate Stats
    risk_score: int
    risk_delta: int
    active_flags_count: int
    escalating_count: int
    
    # Holdings
    holdings: List[dict]
    
    # Escalations (Feed)
    escalations: List[dict]
    
    # Concentration
    concentration: List[dict]

# --- Endpoints ---

@router.get("/", response_model=List[PortfolioMetadata])
def list_portfolios(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.name, p.description, p.created_at, COUNT(pi.id) as holdings_count
        FROM portfolios p
        LEFT JOIN portfolio_items pi ON p.id = pi.portfolio_id
        WHERE p.user_id = %s
        GROUP BY p.id
    """, (current_user["id"],))
    portfolios = cursor.fetchall()
    # Convert datetime to string
    for p in portfolios:
        p["created_at"] = str(p["created_at"])
    
    cursor.close()
    conn.close()
    return portfolios

@router.post("/", response_model=PortfolioMetadata)
def create_portfolio(item: PortfolioCreate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO portfolios (user_id, name, description) VALUES (%s, %s, %s)",
            (current_user["id"], item.name, item.description)
        )
        conn.commit()
        pid = cursor.lastrowid
        return {
            "id": pid,
            "name": item.name,
            "description": item.description,
            "created_at": str(datetime.datetime.now())
        }
    finally:
        cursor.close()
        conn.close()

@router.post("/{portfolio_id}/upload")
async def upload_portfolio_csv(
    portfolio_id: int, 
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    """Upload a CSV to add multiple stocks to a portfolio."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Verify Ownership
    cursor.execute("SELECT id FROM portfolios WHERE id = %s AND user_id = %s", (portfolio_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Portfolio not found")

    try:
        content = await file.read()
        # Decode and handle possible BOM
        decoded_content = content.decode("utf-8-sig")
        stream = io.StringIO(decoded_content)
        
        # Robust Header Detection: Skip empty lines or metadata lines
        lines = [line.strip() for line in stream.readlines() if line.strip()]
        if not lines:
            raise ValueError("Empty CSV file")
            
        # Find the header line (first line that contains "ticker" or "instrument" or common fields)
        header_index = 0
        common_fields = {"ticker", "instrument", "symbol", "stock", "qty", "quantity", "invested", "amount"}
        for i, line in enumerate(lines):
            # Simple check: does this line look like a header?
            line_lower = line.lower()
            if any(field in line_lower for field in common_fields):
                header_index = i
                break
        
        # Re-read from header line
        header_line = lines[header_index]
        data_lines = lines[header_index+1:]
        
        reader = csv.DictReader(io.StringIO("\n".join([header_line] + data_lines)))
        
        # Mapping dictionaries
        TICKER_KEYS = ["ticker", "instrument", "symbol", "stock", "company", "name"]
        INVESTMENT_KEYS = ["investment", "invested", "amount", "total", "value", "cur. val"]
        QTY_KEYS = ["qty.", "qty", "quantity", "shares"]
        PRICE_KEYS = ["avg. cost", "avg cost", "average price", "cost price", "buy price", "ltp"]

        def get_val(row, keys, default=None):
            for k in row.keys():
                if not k: continue
                k_clean = k.strip().lower().replace("\"", "").replace("'", "")
                if k_clean in keys:
                    return row[k]
            return default

        success_count = 0
        failed_tickers = []
        
        for row in reader:
            # 1. Extract Ticker
            ticker_raw = get_val(row, TICKER_KEYS)
            if not ticker_raw:
                continue
            
            # 2. Extract Investment or Calculate
            investment_raw = get_val(row, INVESTMENT_KEYS)
            investment = None
            
            if investment_raw:
                try:
                    # Clean currency symbols and commas
                    investment = float(str(investment_raw).replace("₹", "").replace(",", "").replace("$", "").strip())
                except:
                    pass
            
            # Fallback to Qty * Price
            if investment is None or investment <= 0:
                qty_raw = get_val(row, QTY_KEYS)
                price_raw = get_val(row, PRICE_KEYS)
                if qty_raw and price_raw:
                    try:
                        qty = float(str(qty_raw).replace(",", "").strip())
                        price = float(str(price_raw).replace(",", "").strip())
                        investment = qty * price
                    except:
                        pass
            
            # Final fallback
            if investment is None:
                investment = 100000
                
            # Clean Ticker (Remove .NS, .BO synonyms)
            ticker = str(ticker_raw).strip().upper().split(".")[0]
            
            # Find Company
            cursor.execute("SELECT id FROM companies WHERE ticker = %s", (ticker,))
            company = cursor.fetchone()
            
            if not company:
                failed_tickers.append(ticker)
                continue
                
            # Add or Update
            cursor.execute(
                "INSERT INTO portfolio_items (portfolio_id, company_id, investment) "
                "VALUES (%s, %s, %s) "
                "ON DUPLICATE KEY UPDATE investment = VALUES(investment)",
                (portfolio_id, company["id"], investment)
            )
            success_count += 1
        
        conn.commit()
        return {
            "success_count": success_count,
            "failed_tickers": list(set(failed_tickers)),
            "total_processed": success_count + len(set(failed_tickers))
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"CSV processing error: {str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.get("/{portfolio_id}", response_model=PortfolioIntelligence)
def get_portfolio_detail(portfolio_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Verify Ownership
    cursor.execute("SELECT * FROM portfolios WHERE id = %s AND user_id = %s", (portfolio_id, current_user["id"]))
    pf = cursor.fetchone()
    if not pf:
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    # 2. Get Holdings
    cursor.execute("""
        SELECT c.id, c.ticker, c.name, c.sector, pi.investment 
        FROM portfolio_items pi
        JOIN companies c ON pi.company_id = c.id
        WHERE pi.portfolio_id = %s
    """, (portfolio_id,))
    companies = cursor.fetchall()
    
    # --- Intelligence & Intelligence Logic ---
    
    # 1. Determine Quarters
    today = datetime.date.today()
    current_month = today.month
    q_start_month = ((current_month - 1) // 3) * 3 + 1
    current_quarter_start = datetime.date(today.year, q_start_month, 1)
    previous_quarter_end = current_quarter_start - datetime.timedelta(days=1)
    
    # Helpers
    weights = {"Critical": 15, "High": 10, "Medium": 5, "Low": 2}
    
    holdings = []
    total_weighted_current = 0
    total_weighted_previous = 0
    total_investment = 0
    total_flags_active = 0
    escalating = []
    concentration_map = {}
    
    for c in companies:
        # Fetch ALL flags to determine history vs current
        cursor.execute("""
            SELECT f.flag_code, f.flag_name, f.severity, f.period_type, f.message, f.details, f.fiscal_year, f.fiscal_quarter, f.created_at, fd.category, fd.impact_weight
            FROM flags f
            LEFT JOIN flag_definitions fd ON f.flag_code = fd.flag_code
            WHERE f.company_id = %s
            ORDER BY f.created_at DESC
        """, (c["id"],))
        all_flags = cursor.fetchall()
        
        # --- Company Risk Calculation ---
        from .scoring import calculate_risk_score
        
        # Latest Date
        latest_flag_date = all_flags[0]["created_at"] if all_flags else None
        
        # 1. Current Score
        current_score_data = calculate_risk_score(all_flags)
        c_current_score = current_score_data["risk_score"]
        c_active_flags_count = len(current_score_data["processed_flags"])
        c_drivers = {}
        
        # 2. Previous Score & Escalations
        previous_flags = []
        
        for f in all_flags:
            # Parse Date matches DB types (datetime or date) or string
            f_date_raw = f["created_at"]
            if isinstance(f_date_raw, datetime.datetime):
                f_date = f_date_raw.date()
            elif isinstance(f_date_raw, datetime.date):
                f_date = f_date_raw
            elif isinstance(f_date_raw, str):
                try:
                    f_date = datetime.datetime.strptime(f_date_raw[:10], "%Y-%m-%d").date()
                except ValueError:
                    f_date = datetime.date.today()
            else:
                f_date = datetime.date.today()

            if f_date <= previous_quarter_end:
                previous_flags.append(f)
            
            # 3. Escalations (New This Quarter)
            if f_date >= current_quarter_start:
                urgency = "Normal"
                event_type = "Flag"
                
                # Type 3: Severity Impact (New Critical Flag)
                if (f["severity"] or "").upper() == "CRITICAL":
                    urgency = "High"
                    
                escalating.append({
                    "ticker": c["ticker"],
                    "flag": f["flag_name"],
                    "severity": f["severity"],
                    "date": str(f["created_at"]),
                    "year": f["fiscal_year"],
                    "quarter": f["fiscal_quarter"],
                    "is_new": True,
                    "event_type": event_type,
                    "urgency": urgency
                })

        previous_score_data = calculate_risk_score(previous_flags)
        c_previous_score = previous_score_data["risk_score"]

        # 4. Driver Mapping
        for f in current_score_data["processed_flags"]:
            driver = f.get("category", "Operational")
            c_drivers[driver] = c_drivers.get(driver, 0) + 1
        
        # Delta & Momentum
        delta = c_current_score - c_previous_score
        
        if delta > 0: momentum = "Increasing"
        elif delta < 0: momentum = "Improving"
        else: momentum = "Stable"
        
        # Type 2: Risk Jump (Sudden Deterioration)
        if delta > 8:
            escalating.append({
                "ticker": c["ticker"],
                "flag": f"Risk Score Jump (+{delta})",
                "severity": "CRITICAL",
                "date": str(datetime.date.today()), # Detected now
                "year": today.year,
                "quarter": (today.month - 1) // 3 + 1,
                "is_new": True,
                "event_type": "Jump",
                "urgency": "High"
            })
        
        # Primary Driver
        primary_driver = max(c_drivers, key=c_drivers.get) if c_drivers else "None"
        if primary_driver != "None":
            concentration_map[primary_driver] = concentration_map.get(primary_driver, 0) + 1
            
        holdings.append({
            "ticker": c["ticker"],
            "name": c["name"],
            "sector": c["sector"],
            "risk_score": c_current_score,
            "risk_delta": delta,
            "momentum": momentum,
            "investment": c["investment"],
            "active_flags": c_active_flags_count,
            "primary_driver": primary_driver,
            "latest_flag_date": str(latest_flag_date) if latest_flag_date else None
        })
        
        # Capital-Weighted Aggregates
        investment = c["investment"] or 0
        total_weighted_current += (c_current_score * investment)
        total_weighted_previous += (c_previous_score * investment)
        total_investment += investment
        total_flags_active += c_active_flags_count
        
    # --- Portfolio Aggregates ---
    
    # 1. Avg Risk Score (Capital-Weighted)
    if total_investment > 0:
        pf_current_score = round(total_weighted_current / total_investment)
        pf_previous_score = round(total_weighted_previous / total_investment)
    else:
        pf_current_score = 0
        pf_previous_score = 0
        
    pf_delta = pf_current_score - pf_previous_score

    # Concentration List
    concentration_list = []
    for k, v in concentration_map.items():
        pct = round((v / len(companies)) * 100) if companies else 0
        concentration_list.append({"driver": k, "percent": pct, "count": v})
    concentration_list.sort(key=lambda x: x["percent"], reverse=True)

    cursor.close()
    conn.close()
    
    # Deduplicate escalations by (ticker, flag, year, quarter)
    unique_escalating = {}
    for esc in escalating:
        key = (esc["ticker"], esc["flag"], esc["year"], esc["quarter"])
        if key not in unique_escalating:
            unique_escalating[key] = esc
    
    escalating = list(unique_escalating.values())

    # Sort Escalations by Date DESC
    escalating.sort(key=lambda x: x["date"], reverse=True)
    
    return {
        "id": pf["id"],
        "name": pf["name"],
        "description": pf["description"],
        "risk_score": pf_current_score,
        "risk_delta": pf_delta,
        "active_flags_count": total_flags_active,
        "escalating_count": len(escalating),
        "holdings": holdings,
        "escalations": escalating, # Now contains real recent flags
        "concentration": concentration_list
    }

@router.get("/aggregated/health")
def get_aggregated_health(current_user: dict = Depends(get_current_user)):
    """GET health across all portfolios, capital-weighted."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Get all portfolios for user
    cursor.execute("SELECT id, name FROM portfolios WHERE user_id = %s", (current_user["id"],))
    pfs = cursor.fetchall()
    
    if not pfs:
        return {
            "risk_score": 0,
            "risk_delta": 0,
            "total_capital": 0,
            "portfolio_count": 0,
            "summaries": [],
            "escalations": [],
            "status": "Stable",
            "escalation_prob": 0,
            "acceleration": "Stable"
        }

    all_portfolio_details = []
    total_weighted_score = 0
    total_capital = 0
    all_escalations = []
    
    for pf in pfs:
        # We reuse the logic or just fetch enough to calc
        # For efficiency, let's fetch holdings and their risk scores directly
        cursor.execute("""
            SELECT pi.investment, c.id as company_id, c.ticker
            FROM portfolio_items pi
            JOIN companies c ON pi.company_id = c.id
            WHERE pi.portfolio_id = %s
        """, (pf["id"],))
        items = cursor.fetchall()
        
        pf_total_investment = sum(item["investment"] for item in items)
        pf_weighted_sum = 0
        
        # Determine each company's score using the centralized logic
        from .scoring import calculate_risk_score
        
        for item in items:
            cursor.execute("SELECT f.flag_code, f.flag_name, f.severity, f.period_type, f.message, f.details, f.created_at, f.fiscal_year, f.fiscal_quarter, fd.category, fd.impact_weight FROM flags f LEFT JOIN flag_definitions fd ON f.flag_code = fd.flag_code WHERE f.company_id = %s", (item["company_id"],))
            flags = cursor.fetchall()
            
            c_score = calculate_risk_score(flags)["risk_score"]
            
            pf_weighted_sum += (c_score * item["investment"])
            
            # Also collect recent escalations (last 30 days)
            thirty_days_ago = datetime.date.today() - datetime.timedelta(days=30)
            for f in flags:
                f_date_raw = f["created_at"]
                if isinstance(f_date_raw, datetime.datetime): f_date = f_date_raw.date()
                elif isinstance(f_date_raw, datetime.date): f_date = f_date_raw
                else: f_date = datetime.date.today()
                
                if f_date >= thirty_days_ago:
                    all_escalations.append({
                        "portfolio_name": pf["name"],
                        "ticker": item["ticker"],
                        "flag": f["flag_name"],
                        "severity": f["severity"],
                        "date": str(f["created_at"]),
                        "year": f["fiscal_year"],
                        "quarter": f["fiscal_quarter"]
                    })

        pf_score = round(pf_weighted_sum / pf_total_investment) if pf_total_investment > 0 else 0
        
        # Tier logic
        if pf_score < 30: tier = "stable"
        elif pf_score < 60: tier = "elevated"
        else: tier = "high_risk"
        
        all_portfolio_details.append({
            "id": pf["id"],
            "name": pf["name"],
            "score": pf_score,
            "tier": tier,
            "capital": pf_total_investment
        })
        
        total_weighted_score += pf_weighted_sum
        total_capital += pf_total_investment

    avg_weighted_score = round(total_weighted_score / total_capital) if total_capital > 0 else 0
    
    # Status Tiers
    if avg_weighted_score < 25: status = "Stable"
    elif avg_weighted_score < 50: status = "Monitoring"
    else: status = "High Risk"

    # Deduplicate escalations by (ticker, flag, year, quarter)
    unique_escalations = {}
    for esc in all_escalations:
        key = (esc["ticker"], esc["flag"], esc["year"], esc["quarter"])
        if key not in unique_escalations:
            unique_escalations[key] = esc
            
    # Aggregated Response
    return {
        "risk_score": avg_weighted_score,
        "risk_delta": 2, # Sim for now
        "total_capital": total_capital,
        "portfolio_count": len(pfs),
        "summaries": all_portfolio_details,
        "escalations": sorted(unique_escalations.values(), key=lambda x: x["date"], reverse=True)[:10],
        "status": status,
        "escalation_prob": min(99, int(avg_weighted_score * 0.8 + 10)),
        "acceleration": "Moderate" if avg_weighted_score > 30 else "Stable"
    }

@router.post("/{portfolio_id}/items")
def add_portfolio_item(portfolio_id: int, item: PortfolioItemAdd, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify Owner
    cursor.execute("SELECT id FROM portfolios WHERE id=%s AND user_id=%s", (portfolio_id, current_user["id"]))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    # Find Company
    cursor.execute("SELECT id FROM companies WHERE ticker=%s", (item.ticker,))
    company = cursor.fetchone()
    if not company:
         raise HTTPException(status_code=404, detail="Company not found")
         
    try:
        cursor.execute(
            "INSERT INTO portfolio_items (portfolio_id, company_id, investment) VALUES (%s, %s, %s)",
            (portfolio_id, company[0], item.investment)
        )
        conn.commit()
    except Exception as e:
        # Ignore duplicate
        pass
    finally:
        cursor.close()
        conn.close()
    
    return {"status": "added", "ticker": item.ticker}


@router.put("/{portfolio_id}/items/{ticker}")
def update_portfolio_item(portfolio_id: int, ticker: str, item: PortfolioItemUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify Owner
    cursor.execute("SELECT id FROM portfolios WHERE id=%s AND user_id=%s", (portfolio_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    try:
        # Get Company ID
        cursor.execute("SELECT id FROM companies WHERE ticker=%s", (ticker,))
        company = cursor.fetchone()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
            
        cursor.execute(
            "UPDATE portfolio_items SET investment = %s WHERE portfolio_id = %s AND company_id = %s",
            (item.investment, portfolio_id, company[0])
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return {"status": "updated", "ticker": ticker, "investment": item.investment}


@router.delete("/{portfolio_id}/items/{ticker}")
def remove_portfolio_item(portfolio_id: int, ticker: str, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify Owner
    cursor.execute("SELECT id FROM portfolios WHERE id=%s AND user_id=%s", (portfolio_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    try:
        # Get Company ID
        cursor.execute("SELECT id FROM companies WHERE ticker=%s", (ticker,))
        company = cursor.fetchone()
        if company:
            cursor.execute(
                "DELETE FROM portfolio_items WHERE portfolio_id=%s AND company_id=%s",
                (portfolio_id, company[0])
            )
            conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return {"status": "removed", "ticker": ticker}

@router.patch("/{portfolio_id}")
def update_portfolio(portfolio_id: int, item: PortfolioUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify Owner
    cursor.execute("SELECT id FROM portfolios WHERE id=%s AND user_id=%s", (portfolio_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    try:
        updates = []
        values = []
        if item.name is not None:
            updates.append("name = %s")
            values.append(item.name.strip())
        if item.description is not None:
            updates.append("description = %s")
            values.append(item.description.strip())
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(portfolio_id)
        cursor.execute(
            f"UPDATE portfolios SET {', '.join(updates)} WHERE id = %s",
            tuple(values)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return {"status": "updated", "id": portfolio_id, "name": item.name}

@router.delete("/{portfolio_id}")
def delete_portfolio(portfolio_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verify Owner
    cursor.execute("SELECT id FROM portfolios WHERE id=%s AND user_id=%s", (portfolio_id, current_user["id"]))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Portfolio not found")
        
    try:
        # Delete items first (foreign key cascade might handle this but explicit is safer/clearer)
        cursor.execute("DELETE FROM portfolio_items WHERE portfolio_id=%s", (portfolio_id,))
        # Delete portfolio
        cursor.execute("DELETE FROM portfolios WHERE id=%s", (portfolio_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    
    return {"status": "deleted", "id": portfolio_id}

