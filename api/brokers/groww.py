import os
from growwapi import GrowwAPI
from .broker_base import BaseBroker
from typing import List, Dict

class GrowwBroker(BaseBroker):
    def __init__(self, api_key: str = None, api_secret: str = None):
        # App-Level Credentials (from .env or config)
        self.api_key = api_key or os.getenv("GROWW_API_KEY")
        self.api_secret = api_secret or os.getenv("GROWW_API_SECRET")
        
        # Initialize GrowwAPI with App credentials
        self.client = GrowwAPI(api_key=self.api_key, api_secret=self.api_secret)
        self.session_token = None

    def get_login_url(self) -> str:
        if not self.api_key:
            raise Exception("GROWW_API_KEY is not set in environment variables. Please set the Flagium App credentials in .env")
            
        # Groww standard OAuth login URL construction
        # Official libraries often use a redirect link like this
        return f"https://groww.in/oauth/login?client_id={self.api_key}&redirect_uri=http://localhost:5173/portfolio"

    def authenticate(self, auth_code: str) -> str:
        """
        Exchange authorize code for access token using App-Level credentials.
        """
        if not self.api_secret:
            raise Exception("GROWW_API_SECRET is not set in environment variables.")
            
        try:
            data = self.client.get_access_token(auth_code)
            self.session_token = data.get("access_token")
            return self.session_token
        except Exception as e:
            raise Exception(f"Groww authentication failed: {str(e)}")

    def get_holdings(self) -> List[Dict]:
        if not self.session_token:
            raise Exception("Broker not authenticated. Please complete the login flow.")
            
        try:
            holdings = self.client.get_holdings_for_user()
            # Map to common format: ticker, quantity, average_price
            return [
                {
                    "ticker": h.get("symbol") or h.get("tradingsymbol"),
                    "quantity": h.get("quantity", 0),
                    "average_price": h.get("average_price", 0.0)
                }
                for h in holdings
            ]
        except Exception as e:
            raise Exception(f"Failed to fetch Groww holdings: {str(e)}")
