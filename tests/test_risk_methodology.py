import pytest
import datetime
from db.connection import get_connection

@pytest.mark.asyncio
async def test_risk_score_methodology_consistency(client):
    """
    Regression test to ensure that both Portfolio Detail and Dashboard Health
    use Capital-Weighted Averaging for Risk Score calculation.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Setup Test Companies
        # Using specific tickers to avoid collision
        cursor.execute("INSERT INTO companies (name, ticker, sector) VALUES ('Safe Test Co', 'T_SAFE_RG', 'Test') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)")
        safe_id = cursor.lastrowid
        cursor.execute("INSERT INTO companies (name, ticker, sector) VALUES ('Risky Test Co', 'T_RISKY_RG', 'Test') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)")
        risky_id = cursor.lastrowid
        
        # 2. Setup Flags (Known Scores)
        cursor.execute("DELETE FROM flags WHERE company_id IN (%s, %s)", (safe_id, risky_id))
        
        # Weights: {"Critical": 15, "High": 10, "Medium": 5, "Low": 2}
        
        # Safe Co: 1 High Flag (Score = 10)
        cursor.execute("INSERT INTO flags (company_id, severity, flag_name) VALUES (%s, 'High', 'Regression Test Flag')", (safe_id,))
        
        # Risky Co: 4 Critical (60) + 2 High (20) = Score 80
        for _ in range(4):
            cursor.execute("INSERT INTO flags (company_id, severity, flag_name) VALUES (%s, 'Critical', 'Risky Flag')", (risky_id,))
        for _ in range(2):
            cursor.execute("INSERT INTO flags (company_id, severity, flag_name) VALUES (%s, 'High', 'Risky Flag')", (risky_id,))
            
        # 3. Create Portfolio
        cursor.execute("DELETE FROM portfolios WHERE name = 'Methodology Regression Test'")
        cursor.execute("INSERT INTO portfolios (user_id, name) VALUES (1, 'Methodology Regression Test')")
        portfolio_id = cursor.lastrowid
        
        # 4. Add Items with Skewed Investments
        # $1,000 in Safe (10), $100,000 in Risky (80)
        # Simple Avg = (10 + 80) / 2 = 45
        # Capital-Weighted Avg = ((10 * 1000) + (80 * 100000)) / 101000 = 79.3... -> 79
        cursor.execute("INSERT INTO portfolio_items (portfolio_id, company_id, investment) VALUES (%s, %s, 1000)", (portfolio_id, safe_id))
        cursor.execute("INSERT INTO portfolio_items (portfolio_id, company_id, investment) VALUES (%s, %s, 100000)", (portfolio_id, risky_id))
        
        conn.commit()
        
        # --- EXECUTION & ASSERTION ---
        
        # A. Check Dashboard Health (Aggregated)
        health_res = await client.get("/api/portfolios/aggregated/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        pf_health = next((p for p in health_data["summaries"] if p["id"] == portfolio_id), None)
        assert pf_health is not None, "Portfolio missing from dashboard summaries"
        assert pf_health["score"] == 79, f"Dashboard score mismatch (Equal weighted?). Expected 79, got {pf_health['score']}"
        
        # B. Check Portfolio Detail
        detail_res = await client.get(f"/api/portfolios/{portfolio_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["risk_score"] == 79, f"Portfolio Detail score mismatch (Equal weighted?). Expected 79, got {detail_data['risk_score']}"

    finally:
        # Cleanup
        cursor.execute("DELETE FROM portfolio_items WHERE portfolio_id = %s", (portfolio_id,))
        cursor.execute("DELETE FROM portfolios WHERE id = %s", (portfolio_id,))
        cursor.execute("DELETE FROM flags WHERE company_id IN (%s, %s)", (safe_id, risky_id))
        cursor.execute("DELETE FROM companies WHERE id IN (%s, %s)", (safe_id, risky_id))
        conn.commit()
        cursor.close()
        conn.close()
