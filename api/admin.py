from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from db.connection import get_connection
from api.auth import get_current_user

router = APIRouter()

@router.get("/ingestion-status")
def get_ingestion_status(current_user: dict = Depends(get_current_user)):
    # RBAC: Only admin can access
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Ingestion Stats - Refined for Recency
        # Get count AND latest available quarter for each company
        cursor.execute("""
            SELECT c.ticker, COUNT(f.id) as q_count, MAX(f.year) as max_year, MAX(f.quarter) as max_quarter
            FROM companies c
            LEFT JOIN financials f ON c.id = f.company_id AND f.quarter > 0
            GROUP BY c.ticker
        """)
        rows = cursor.fetchall()
        total_companies = len(rows)
        
        # Determine strict "current" quarter from DB max to avoid clock issues
        max_db_year = 0
        max_db_quarter = 0
        for r in rows:
            if r["max_year"] and r["max_year"] > max_db_year:
                max_db_year = r["max_year"]
                max_db_quarter = r["max_quarter"]
            elif r["max_year"] == max_db_year and r["max_quarter"] and r["max_quarter"] > max_db_quarter:
                max_db_quarter = r["max_quarter"]

        min_quarters = 8
        at_risk = []
        
        for r in rows:
            ticker = r["ticker"]
            count = r["q_count"]
            last_year = r["max_year"] or 0
            last_q = r["max_quarter"] or 0
            
            # A company is "at risk" (needs backfill) ONLY if:
            # 1. It has < 8 quarters AND
            # 2. It is NOT a new listing (defined as having data for the latest available quarter in DB)
            # Actually, even simpler: If it has data for the *latest* quarter, we can't backfill more (it doesn't exist).
            # So, if (last_year, last_q) matches (max_db_year, max_db_quarter) or close to it, it's fine.
            
            is_uptodate = False
            if last_year == max_db_year:
                if last_q >= max_db_quarter - 1: # Allow 1 quarter lag
                    is_uptodate = True
            elif last_year == max_db_year - 1 and max_db_quarter == 1 and last_q == 4:
                 # Case: Current is Q1, Last was Q4 prev year
                 is_uptodate = True

            if count < min_quarters and not is_uptodate:
                at_risk.append({"ticker": ticker, "quarters": count})
        
        # 2. Flag Engine Status
        # Get latest flag creation time
        cursor.execute("SELECT MAX(created_at) as last_run FROM flags")
        last_run_row = cursor.fetchone()
        last_run = last_run_row["last_run"] if last_run_row else None

        # Get total active flags
        cursor.execute("SELECT COUNT(*) as total_flags FROM flags")
        total_flags_row = cursor.fetchone()
        total_flags = total_flags_row["total_flags"] if total_flags_row else 0
        
        # 3. System Job Statuses
        cursor.execute("SELECT job_name, status, last_run_start, last_run_end, message FROM system_jobs")
        jobs_rows = cursor.fetchall()
        jobs_status = {r["job_name"]: r for r in jobs_rows}

        return {
            "ingestion": {
                "total_companies": total_companies,
                "companies_with_data_gaps": len(at_risk),
                "coverage_target": min_quarters,
                "at_risk_list": at_risk
            },
            "flag_engine": {
                "last_run": last_run,
                "total_active_flags": total_flags
            },
            "system_jobs": jobs_status
        }

    finally:
        cursor.close()
        conn.close()

@router.get("/sanity-report")
def get_sanity_report(current_user: dict = Depends(get_current_user)):
    # RBAC: Only admin can access
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Fetch the latest automated daily sanity report
        cursor.execute("SELECT report_data FROM system_reports WHERE report_type = 'daily_sanity'")
        row = cursor.fetchone()
        
        if row and row["report_data"]:
            import json
            data = json.loads(row["report_data"]) if isinstance(row["report_data"], str) else row["report_data"]
            return data
            
        # Fallback if the cron job hasn't run yet
        return {
            "total_anomalies": 0,
            "details": {
                "duplicates": [],
                "missing_data": [],
                "missing_profit": [],
                "synthesis_discrepancies": [],
                "negative_revenue": [],
                "orphaned_flags": []
            }
        }

    finally:
        cursor.close()
        conn.close()

@router.post("/trigger-ingestion")
def trigger_full_ingestion(background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    # RBAC: Only admin can access
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    # Check if already running
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT status FROM system_jobs WHERE job_name = 'Ingestion Job'")
        row = cursor.fetchone()
        if row and row["status"] == "running":
            raise HTTPException(status_code=409, detail="Ingestion job is already running")
    finally:
        cursor.close()
        conn.close()

    from ingestion.ingest import ingest_all
    background_tasks.add_task(ingest_all)
    
    return {"message": "Full ingestion job triggered in background"}
