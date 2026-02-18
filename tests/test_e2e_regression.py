import pytest
from playwright.sync_api import sync_playwright

def test_login_and_create_portfolio():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Login
        page.goto("http://localhost:5173/login")
        page.fill('input[type="email"]', "prmdsharma@gmail.com")
        page.fill('input[type="password"]', "123")
        page.click('button:has-text("Decrypt")')
        
        # 2. Wait for Dashboard
        try:
            # Look for any text that definitely exists on the dashboard
            page.wait_for_selector('text="Overall Capital Risk"', timeout=30000)
            assert "Overall Capital Risk" in page.content()
        except Exception as e:
            print(f"E2E Debug: Page content on failure: {page.content()[:500]}...")
            raise e
        
        # 3. Create Portfolio
        page.goto("http://localhost:5173/portfolio?new=true")
        page.fill('input[placeholder*="e.g."]', "E2E Test Portfolio")
        page.click('button:has-text("Initialize")')
        
        # 4. Verify Detail View
        page.wait_for_url("**/portfolio/*", timeout=10000)
        page.wait_for_selector('h1:has-text("E2E Test Portfolio")', timeout=10000)
        assert "Risk Score" in page.content()
        
        browser.close()
