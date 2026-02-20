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
import logging
import sys
from urllib.parse import quote


# ──────────────────────────────────────────────
# Module Logger
# ──────────────────────────────────────────────

_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(_LOG_DIR, exist_ok=True)

_LOG_FORMAT = "[%(asctime)s], [%(levelname)s], [%(ticker)s], %(message)s"
_LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"


class _NSETickerFilter(logging.Filter):
    def __init__(self, ticker="NSE"):
        super().__init__()
        self.ticker = ticker
    def filter(self, record):
        record.ticker = self.ticker
        return True


def _get_nse_logger(ticker="NSE") -> logging.Logger:
    logger_name = f"flagium.nse.{ticker}"
    logger = logging.getLogger(logger_name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.DEBUG)
    tf = _NSETickerFilter(ticker)
    fmt = logging.Formatter(_LOG_FORMAT, datefmt=_LOG_DATEFMT)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.INFO)
    ch.setFormatter(fmt)
    ch.addFilter(tf)
    logger.addHandler(ch)
    fh = logging.FileHandler(os.path.join(_LOG_DIR, "ingestion.log"), encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    fh.addFilter(tf)
    logger.addHandler(fh)
    logger.propagate = False
    return logger


_logger = _get_nse_logger()


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
    "WIPRO", "NTPC", "TMPV", "TMCV", "M&M", "POWERGRID",
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
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                if output_file:
                    return True
                return result.stdout
            else:
                _logger.warning(f"Curl failed: {result.stderr}")
        except Exception as e:
            _logger.error(f"Curl error: {e}")
        return None

    def _init_session(self):
        """Hit NSE homepage to establish session cookies."""
        _logger.info("Connecting to NSE (system curl)...")
        if os.path.exists(COOKIES_FILE):
            try:
                os.remove(COOKIES_FILE)
            except:
                pass
        resp = self._curl(NSE_BASE_URL)
        if resp:
            self._initialized = True
            self._available = True
            _logger.info("NSE session initialized")
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
                if "<html" in json_str.lower():
                    _logger.warning("NSE blocked API request (HTML response)")
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
    """Fetch Nifty 500 tickers from NiftyIndices CSV."""
    url = "https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv"
    _logger.info(f"Fetching Nifty 500 list from {url}")

    local_session = False
    if not session:
        session = NSESession()
        local_session = True

    try:
        csv_content = session._curl(url)
        if not csv_content or "Symbol" not in csv_content:
            _logger.warning("Failed to fetch Nifty 500 CSV (or blocked)")
            return []

        import csv
        import io

        if not isinstance(csv_content, str):
            _logger.warning("NSE 500 CSV content is not a string")
            return []

        tickers = []
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            # Column name is usually "Symbol"
            symbol = row.get("Symbol")
            if symbol:
                symbol = symbol.strip()
                # Remove TATAMOTORS (demerged)
                if symbol == "TATAMOTORS": continue
                tickers.append(symbol)
        
        # Ensure TMPV and TMCV are included if not present (as replacements)
        if "TMPV" not in tickers: tickers.append("TMPV")
        if "TMCV" not in tickers: tickers.append("TMCV")
        
        _logger.info(f"Fetched {len(tickers)} tickers from Nifty 500 (with Tata demerger logic)")
        return tickers

    except Exception as e:
        _logger.error(f"Error fetching Nifty 500: {e}")
        return []
        if local_session:
            session.close()


def fetch_equity_tickers(session=None):
    """Fetch all listed equity tickers from NSE via the official master CSV."""
    url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
    _logger.info(f"Fetching full NSE Equity list from {url}")

    local_session = False
    if not session:
        session = NSESession()
        local_session = True

    try:
        csv_content = session._curl(url)
        if not csv_content or not isinstance(csv_content, str) or "SYMBOL" not in csv_content.upper():
            _logger.warning("Failed to fetch NSE Equity CSV (or blocked)")
            return []

        import csv
        import io
        
        tickers = []
        reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in reader:
            # The column name in EQUITY_L.csv is "SYMBOL"
            symbol = row.get("SYMBOL") or row.get("symbol")
            if symbol:
                symbol = symbol.strip()
                # Skip demerged/suspended if needed, but for now we want coverage
                if symbol == "TATAMOTORS": continue
                tickers.append(symbol)
        
        # Ensure replacements are there
        if "TMPV" not in tickers: tickers.append("TMPV")
        if "TMCV" not in tickers: tickers.append("TMCV")
        
        _logger.info(f"Fetched {len(tickers)} tickers from NSE Equity Master")
        return sorted(tickers)

    except Exception as e:
        _logger.error(f"Error fetching NSE Equity Master: {e}")
        return []
    finally:
        if local_session:
            session.close()
