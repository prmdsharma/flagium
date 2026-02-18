from abc import ABC, abstractmethod
from typing import List, Dict

class BaseBroker(ABC):
    @abstractmethod
    def get_login_url(self) -> str:
        """Return the URL to initiate the OAuth login flow with the broker."""
        pass

    @abstractmethod
    def authenticate(self, code: str) -> str:
        """Exchange the authorization code for an access token and return it."""
        pass

    @abstractmethod
    def get_holdings(self) -> List[Dict]:
        """Fetch and return the user's current stock holdings."""
        pass
