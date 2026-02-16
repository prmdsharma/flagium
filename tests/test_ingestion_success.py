import os
from ingestion.ingest import ingest_company
from ingestion.nse_fetcher import NSESession
from db.connection import get_connection

def test_ingestion_and_cleanup():
    ticker = "RELIANCE" # Use a stable ticker
    session = NSESession()
    conn = get_connection()
    
    try:
        # 1. Run ingestion
        result = ingest_company(session, conn, ticker)
        
        assert result["status"] in ["success", "partial"]
        
        # 2. Check DB
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM financials WHERE company_id = (SELECT id FROM companies WHERE ticker=%s)", (ticker,))
        count = cursor.fetchone()[0]
        assert count > 0, f"No records found in DB for {ticker}"
        
        # 3. Verify files are NOT in the data/xbrl dir (if success)
        if result["status"] == "success":
            xbrl_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "xbrl")
            files = [f for f in os.listdir(xbrl_dir) if f.startswith(ticker)]
            assert len(files) == 0, f"XBRL files still exist for {ticker}: {files}"
            print(f"✅ Cleanup verified for {ticker}")
            
    finally:
        session.close()
        conn.close()

if __name__ == "__main__":
    # For quick manual run
    os.environ["REAL_INGEST"] = "1"
    test_ingestion_and_cleanup()
