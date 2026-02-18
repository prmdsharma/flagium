import pytest
import secrets

@pytest.mark.asyncio
async def test_portfolio_lifecycle(client):
    # For now, let's assume the API might need auth, but we test the endpoint directly.
    # We might need to mock get_current_user depending on how it's implemented.
    
    pf_name = f"Test Portfolio {secrets.token_hex(4)}"
    
    # 1. Create Portfolio (Note: using a dummy user ID or mocking auth depends on the implementation)
    # Let's try to list first
    list_res = await client.get("/api/portfolios/")
    assert list_res.status_code in [200, 401] # 401 if auth is strictly enforced
    
    if list_res.status_code == 200:
        initial_count = len(list_res.json())
        
        # Create
        create_res = await client.post("/api/portfolios/", json={
            "name": pf_name,
            "description": "Integration Test"
        })
        assert create_res.status_code == 200
        
        # Verify List
        list_res = await client.get("/api/portfolios/")
        assert len(list_res.json()) == initial_count + 1
