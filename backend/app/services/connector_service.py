from sqlalchemy.orm import Session
from app.connectors import WooCommerceConnector, DemoConnector
from app.models import Store
from .store_service import StoreService


class ConnectorService:
    """Service for getting the right connector for a store"""

    @staticmethod
    def get_connector(db: Session, store_id: str):
        """Get the connector (Demo or WooCommerce) for a store"""
        store = StoreService.get_store(db, store_id)

        if not store:
            raise Exception("Store not found")

        if store.mode == "demo":
            return DemoConnector()

        if store.mode == "live":
            connection = StoreService.get_connection(db, store_id)
            if not connection:
                raise Exception("WooCommerce connection not found")

            secret = StoreService.get_decrypted_secret(db, store_id)

            return WooCommerceConnector(
                store_url=store.store_url,
                consumer_key=connection.consumer_key,
                consumer_secret=secret,
            )

        raise Exception("Unknown store mode")
