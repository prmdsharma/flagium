import os
from kiteconnect import KiteConnect
from .broker_base import BaseBroker
from typing import List, Dict

class ZerodhaBroker(BaseBroker):
    def __init__(self, api_key: str = None, api_secret: str = None):
        # App-Level Credentials (from .env or config)
        self.api_key = api_key or os.getenv("KITE_API_KEY")
        self.api_secret = api_secret or os.getenv("KITE_API_SECRET")
        
        # Initialize KiteConnect with the App's API Key
        self.kite = KiteConnect(api_key=self.api_key)
        self.access_token = None

    def get_login_url(self) -> str:
        if not self.api_key:
            raise Exception("KITE_API_KEY is not set in environment variables. Please set the Flagium App credentials in .env")
        return self.kite.login_url()

    def authenticate(self, request_token: str) -> str:
        """
        Exchange the short-lived request_token for a long-lived access_token.
        This happens server-side using the App's API Secret.
        """
        if not self.api_secret:
            raise Exception("KITE_API_SECRET is not set in environment variables.")
            
        data = self.kite.generate_session(request_token, api_secret=self.api_secret)
        self.access_token = data["access_token"]
        self.kite.set_access_token(self.access_token)
        return self.access_token

    def get_holdings(self) -> List[Dict]:
        if not self.access_token:
            raise Exception("Broker not authenticated. Please complete the login flow.")
            
        holdings = self.kite.holdings()
        return [
            {
                "ticker": h["tradingsymbol"],
                "quantity": h["quantity"] + h["t1_quantity"],
                "average_price": h["average_price"]
            }
            for h in holdings
        ]
