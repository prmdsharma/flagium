from .zerodha import ZerodhaBroker
from .groww import GrowwBroker
from .broker_base import BaseBroker

class BrokerFactory:
    @staticmethod
    def get_broker(broker_type: str) -> BaseBroker:
        """
        Factory method to return a broker instance based on type.
        """
        if broker_type.lower() == "zerodha":
            return ZerodhaBroker()
        elif broker_type.lower() == "groww":
            return GrowwBroker()
        else:
            raise ValueError(f"Unsupported broker type: {broker_type}")
