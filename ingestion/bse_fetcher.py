"""
Flagium — BSE Data Fetcher (Playwright Edition)

Handles data fetching from BSE India (bseindia.com).
Uses Playwright to bypass robust anti-bot protections and TLS fingerprinting.
"""

import time
import os
import json
from playwright.sync_api import sync_playwright

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────

BSE_SITE_URL = "https://www.bseindia.com"

# Map of common tickers to BSE scrip codes
TICKER_TO_BSE_CODE = {
    "RELIANCE": "500325",
    "TCS": "532540",
    "HDFCBANK": "500180",
    "INFY": "500209",
    "ICICIBANK": "532174",
    "HINDUNILVR": "500696",
    "SBIN": "500112",
    "BHARTIARTL": "532454",
    "ITC": "500875",
    "KOTAKBANK": "500247",
    "LT": "500510",
    "AXISBANK": "532215",
    "BAJFINANCE": "500034",
    "ASIANPAINT": "500820",
    "MARUTI": "532500",
    "HCLTECH": "532281",
    "TITAN": "500114",
    "SUNPHARMA": "524715",
    "WIPRO": "507685",
    "TATAMOTORS": "500570",
    "TATASTEEL": "500470",
    "NTPC": "532555",
    "POWERGRID": "532898",
    "ONGC": "500312",
    "COALINDIA": "533278",
    "JSWSTEEL": "500228",
    "M&M": "500520",
    "NESTLEIND": "500790",
    "ULTRACEMCO": "532538",
}


class BSESession:
    """Manages a Playwright browser session for BSE."""

    def __init__(self):
        self._playwright = None
        self._browser = None
        self._context = None
        self._page = None

    def _ensure_browser(self):
        """Launch browser if not running."""
        if not self._playwright:
            self._playwright = sync_playwright().start()
            self._browser = self._playwright.chromium.launch(headless=True)
            self._context = self._browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 720}
            )
            self._page = self._context.new_page()

    def close(self):
        """Clean up resources."""
        if self._browser:
            self._browser.close()
        if self._playwright:
            self._playwright.stop()
        self._playwright = None
        self._browser = None

    def get_page(self):
        self._ensure_browser()
        return self._page


def get_bse_scrip_code(ticker):
    """Look up BSE scrip code for a ticker.

    Args:
        ticker: NSE ticker symbol.

    Returns:
        BSE scrip code string or None.
    """
    return TICKER_TO_BSE_CODE.get(ticker)


def get_financial_results_bse(session, scrip_code):
    """Fetch financial results from BSE for a scrip code using Playwright.

    Navigates to the corporate announcements page and intercepts the API response.

    Args:
        session: Active BSESession.
        scrip_code: BSE scrip code (e.g., '500325').

    Returns:
        List of financial filing records.
    """
    page = session.get_page()
    url = f"https://www.bseindia.com/corporates/ann.html?scrip={scrip_code}"
    print(f"  🌍 Navigating to BSE announcements for {scrip_code}...")

    filings = []

    # Intercept the JSON response from the API
    def handle_response(response):
        if "AnnGetData" in response.url and response.status == 200:
            try:
                data = response.json()
                if isinstance(data, dict) and "Table" in data:
                    filings.extend(data["Table"])
            except Exception:
                pass

    page.on("response", handle_response)
    
    try:
        page.goto(url, timeout=30000)
        # Wait for table to load
        page.wait_for_selector("table#lblann", timeout=10000)
        # Give a little extra time for the JSON to be fully captured
        page.wait_for_timeout(2000)
    except Exception as e:
        print(f"  ⚠️  BSE navigation error: {e}")
    finally:
        page.remove_listener("response", handle_response)

    # Filter for 'Financial Results'
    financials = [
        f for f in filings
        if "Result" in f.get("NEWSSUB", "") or "Financial" in f.get("NEWSSUB", "")
    ]
    
    # If API interception failed, try scraping the DOM
    if not financials:
        # Fallback: Scrape the visible table rows
        rows = page.query_selector_all("table#lblann tr")
        pass # To be implemented if API fails consistently
        
    return financials


def scrape_announcement_feed(session, scrip_codes=None):
    """Scrape BSE corporate announcement feed.

    Args:
        session: Active BSESession.
        scrip_codes: List of BSE scrip codes.

    Returns:
        List of announcements with metadata.
    """
    # For now, just alias to get_financial_results as it fetches announcements
    # In a real comprehensive scraper, we'd loop through all codes.
    # The current usage in ingest.py passes a list with 1 code.
    if not scrip_codes:
        return []
    
    all_ann = []
    for code in scrip_codes:
        ann = get_financial_results_bse(session, code)
        for a in ann:
            a["scrip_code"] = code
            subject = a.get("NEWSSUB", "").lower()
            a["is_revision"] = any(w in subject for w in [
                "revised", "revision", "correction", "corrigendum",
                "amended", "restated", "erratum"
            ])
        all_ann.extend(ann)
        
    return all_ann


def download_xbrl_from_bse(session, scrip_code, save_path):
    """Download XBRL filing from BSE using Playwright.

    Args:
        session: Active BSESession.
        scrip_code: BSE scrip code.
        save_path: Local path to save the XBRL file.

    Returns:
        True if download successful.
    """
    page = session.get_page()
    
    # Direct XBRL search URL on BSE
    # Note: Requires navigating and clicking
    try:
        # We can try to guess the XBRL link from the announcement text/attachment
        # But BSE usually puts XBRLs on a separate page:
        # https://www.bseindia.com/corporates/XBRLInput.aspx?scripcd={scrip_code}
        
        url = f"https://www.bseindia.com/corporates/XBRLInput.aspx?scripcd={scrip_code}"
        print(f"  🌍 Navigating to BSE XBRL page: {url}")
        
        response = page.goto(url, timeout=30000)
        
        # Check if page loaded (sometimes 404 for companies without recent XBRL)
        if response.status == 404:
            print(f"  ⚠️  No XBRL page found for {scrip_code}")
            return False

        # Find XML/XBRL links
        # Selector for the anchor tags in the grid
        # Usually inside a table
        try:
             # Wait for the table/links to appear
            page.wait_for_selector("a[href*='.xml'], a[href*='.xbrl']", timeout=5000)
        except:
            print(f"  ⚠️  No XBRL links found on page")
            return False

        # Get the first link
        xbrl_element = page.query_selector("a[href*='.xml'], a[href*='.xbrl']")
        
        if xbrl_element:
            href = xbrl_element.get_attribute("href")
            if href:
                if href.startswith("../"):
                    href = href.replace("../", "https://www.bseindia.com/")
                elif href.startswith("/"):
                    href = f"https://www.bseindia.com{href}"
                
                print(f"  ⬇️  Downloading XBRL: {href}")
                
                # Fetch content
                # We can use page.request (APIRequestContext) which shares cookies
                file_resp = page.request.get(href)
                if file_resp.ok:
                    with open(save_path, "wb") as f:
                        f.write(file_resp.body())
                    return True
                else:
                    print(f"  ❌ Download failed: {file_resp.status} {file_resp.status_text}")

    except Exception as e:
        print(f"  ❌ BSE XBRL download error: {e}")

    return False
