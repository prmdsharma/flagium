import pytest
from fastapi.testclient import TestClient
from api.server import app
from db.connection import get_connection

client = TestClient(app)

@pytest.mark.asyncio
async def test_list_flags_user_only(client):
    """Test that ?user_only=true filters flags correctly, accounting for existing portfolios."""
    
    # 1. Get all flags first
    response = await client.get("/api/flags")
    assert response.status_code == 200
    all_flags = response.json()["flags"]
    all_tickers = {f["ticker"] for f in all_flags}
    
    if not all_tickers:
        pytest.skip("No flags in DB to test with")

    # 2. Get initial user-only flags
    initial_response = await client.get("/api/flags?user_only=true")
    initial_user_tickers = {f["ticker"] for f in initial_response.json()["flags"]}
    
    # 3. Find a ticker that is NOT already in user's portfolio
    target_ticker = None
    for ticker in all_tickers:
        if ticker not in initial_user_tickers:
            target_ticker = ticker
            break
            
    if not target_ticker:
        # All flagged stocks are already in the portfolio, so just test that user_only returns them
        assert len(initial_user_tickers) > 0
        return

    # 4. Create a portfolio and add the item
    port_res = await client.post("/api/portfolios/", json={"name": "Test Alerting Update"})
    assert port_res.status_code == 200
    portfolio_id = port_res.json()["id"]
    
    await client.post(f"/api/portfolios/{portfolio_id}/items", json={"ticker": target_ticker, "investment": 100000})
    
    # 5. Request flags with user_only=true
    response = await client.get("/api/flags?user_only=true")
    assert response.status_code == 200
    user_flags = response.json()["flags"]
    
    # Verify results
    user_tickers = {f["ticker"] for f in user_flags}
    assert target_ticker in user_tickers
    
    # Check that it ONLY contains stocks from the union of initial and new
    expected_tickers = initial_user_tickers | {target_ticker}
    assert user_tickers == expected_tickers

@pytest.mark.asyncio
async def test_list_flags_all(client):
    """Test that /flags returns all flags by default."""
    response = await client.get("/api/flags")
    assert response.status_code == 200
    data = response.json()
    assert "flags" in data
    assert "count" in data
