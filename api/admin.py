from fastapi import APIRouter, Depends, HTTPException
from db.connection import get_connection
from api.auth import get_current_user
from ingestion.validate_data import get_data_counts

router = APIRouter()

@router.get("/ingestion-status")
def get_ingestion_status(current_user: dict = Depends(get_current_user)):
    # RBAC: Only admin can access
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Ingestion Stats
        counts = get_data_counts(conn)
        total_companies = len(counts)
        # Assuming MIN_QUARTERS is 8, import it or hardcode? 
        # Better to match validate_data.py logic. 
        # Let's peek validate_data to see if MIN_QUARTERS is exportable.
        # It is defined as a constant. I should probably import it if possible, 
        # or just use 8 as per requirement.
        min_quarters = 8
        
        at_risk = []
        for ticker, count in counts.items():
            if count < min_quarters:
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
            }
        }

    finally:
        cursor.close()
        conn.close()
