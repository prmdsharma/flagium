"""
Flagium — NSE Data Fetcher (System Curl Edition)

Handles data fetching from NSE India (nseindia.com).
Uses system `curl` command via subprocess to bypass Python SSL/TLS issues 
and architecture mismatches. Robust fallback method.
"""

import subprocess
import json
import time
import os
import tempfile
from urllib.parse import quote

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────

NSE_BASE_URL = "https://www.nseindia.com"

# Nifty 50 tickers (complete list)
NIFTY50_TICKERS = [
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
    "HINDUNILVR", "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK",
    "LT", "AXISBANK", "BAJFINANCE", "ASIANPAINT", "MARUTI",
    "HCLTECH", "TITAN", "SUNPHARMA", "ULTRACEMCO", "NESTLEIND",
    "WIPRO", "NTPC", "TMPV", "M&M", "POWERGRID",
    "TATASTEEL", "TECHM", "ADANIPORTS", "BAJAJFINSV", "ONGC",
    "JSWSTEEL", "COALINDIA", "LTIM", "HDFCLIFE", "INDUSINDBK",
    "HINDALCO", "SBILIFE", "GRASIM", "DIVISLAB", "DRREDDY",
    "CIPLA", "APOLLOHOSP", "EICHERMOT", "TATACONSUM", "BPCL",
    "BAJAJ-AUTO", "BRITANNIA", "HEROMOTOCO", "ADANIENT", "SHRIRAMFIN",
]

COOKIES_FILE = os.path.join(tempfile.gettempdir(), "nse_cookies.txt")


class NSESession:
    """Manages an authenticated session with NSE India using system curl."""

    def __init__(self):
        self._initialized = False
        self._available = False

    def _curl(self, url, headers=None, output_file=None):
        """Execute curl command."""
        cmd = [
            "curl", "-s",  # Silent
            "-L",          # Follow redirects
            "--compressed", # Handle gzip
            "-c", COOKIES_FILE, # Write cookies
            "-b", COOKIES_FILE, # Read cookies
            "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "-H", "authority: www.nseindia.com",
            "-H", "accept: */*",
            "-H", "accept-language: en-US,en;q=0.9",
        ]

        if headers:
            for k, v in headers.items():
                cmd.extend(["-H", f"{k}: {v}"])
                
        # For API calls, need Referer
        if "api" in url:
            cmd.extend(["-H", "referer: https://www.nseindia.com/"])

        cmd.append(url)
        
        if output_file:
            cmd.extend(["-o", output_file])

        try:
            # print(f"  CMD: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                if output_file:
                    return True
                return result.stdout
            else:
                print(f"  ⚠️  Curl failed: {result.stderr}")
        except Exception as e:
            print(f"  ❌ Curl error: {e}")
        return None

    def _init_session(self):
        """Hit NSE homepage to establish session cookies."""
        print("  🌍 Connecting to NSE (system curl)...")
        # Remove old cookies
        if os.path.exists(COOKIES_FILE):
            try:
                os.remove(COOKIES_FILE)
            except:
                pass
                
        resp = self._curl(NSE_BASE_URL)
        if resp:
            self._initialized = True
            self._available = True
            print("  ✅ NSE session initialized")
        else:
            self._available = False

    def _ensure_session(self):
        if not self._initialized:
            self._init_session()

    @property
    def is_available(self):
        self._ensure_session()
        return self._available
        
    def close(self):
        """Cleanup."""
        pass

    def get_json(self, url):
        """Fetch JSON via curl."""
        self._ensure_session()
        if not self._available:
            return None
            
        json_str = self._curl(url)
        if json_str:
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                 # Check if we got HTML (blocked)
                 if "<html" in json_str.lower():
                     print("  ⚠️  NSE blocked API request (HTML response)")
                 else:
                     pass
        return None
        
    def download(self, url, path):
        """Download binary file."""
        return self._curl(url, output_file=path)


def get_company_info(session, ticker):
    """Fetch basic company info from NSE."""
    url = f"{NSE_BASE_URL}/api/quote-equity?symbol={quote(ticker)}"
    data = session.get_json(url)
    if data:
        return {
            "ticker": ticker,
            "name": data.get("info", {}).get("companyName", ticker),
            "sector": data.get("metadata", {}).get("industry", ""),
            "index": "NIFTY50" if ticker in NIFTY50_TICKERS else "",
        }
    return None


def get_financial_results(session, ticker, period="Quarterly"):
    """Fetch corporate financial results listing."""
    url = (
        f"{NSE_BASE_URL}/api/corporates-financial-results?"
        f"index=equities&symbol={quote(ticker)}&period={period}"
    )
    data = session.get_json(url)
    if data:
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and "results" in data:
            return data["results"]
    return []


def download_xbrl_file(session, xbrl_url, save_path):
    """Download an XBRL file from NSE."""
    if xbrl_url.startswith("/"):
        xbrl_url = NSE_BASE_URL + xbrl_url
        
    return session.download(xbrl_url, save_path)


def fetch_nifty50_tickers():
    return NIFTY50_TICKERS.copy()


def fetch_nifty500_tickers(session=None):
    """Fetch Nifty 500 tickers from NiftyIndices CSV.

    Returns:
        List of tickers (e.g. ['RELIANCE', 'TCS', ...])
    """
    url = "https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv"
    print(f"  🌍 Fetching Nifty 500 list from {url}...")

    # Use session if provided, else create temporary one
    local_session = False
    if not session:
        session = NSESession()
        local_session = True

    try:
        csv_content = session._curl(url)
        if not csv_content or "Symbol" not in csv_content:
            print("  ⚠️  Failed to fetch Nifty 500 CSV (or blocked)")
            # Fallback to Nifty 50 for now if 500 fails
            # But better to return empty list so caller knows
            return []

        # Parse CSV
        import csv
        import io
        
        tickers = []
        # Skip header logic handled by DictReader
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            # Column name is usually "Symbol"
            symbol = row.get("Symbol")
            if symbol:
                tickers.append(symbol.strip())
        
        print(f"  ✅ Fetched {len(tickers)} tickers from Nifty 500")
        return tickers

    except Exception as e:
        print(f"  ❌ Error fetching Nifty 500: {e}")
        return []
    finally:
        if local_session:
            session.close()
