from sqlalchemy.orm import Session
from app.models import Merchant, Store, WooCommerceConnection
from app.utils import encrypt_secret, decrypt_secret
import uuid


class StoreService:
    """Service for managing merchants and stores"""

    @staticmethod
    def get_or_create_merchant(db: Session, merchant_id: str = None) -> Merchant:
        """Get or create a default merchant"""
        if merchant_id:
            merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
            if merchant:
                return merchant

        # Get or create default merchant
        merchant = db.query(Merchant).filter(Merchant.name == "Default Merchant").first()
        if not merchant:
            merchant = Merchant(id=uuid.uuid4(), name="Default Merchant")
            db.add(merchant)
            db.commit()

        return merchant

    @staticmethod
    def create_demo_store(db: Session, merchant_id: str) -> Store:
        """Create a demo store"""
        store = Store(
            id=uuid.uuid4(),
            merchant_id=uuid.UUID(merchant_id) if isinstance(merchant_id, str) else merchant_id,
            name="Pranav Store",
            store_url="https://demo.woocommerce.local",
            provider="woocommerce",
            mode="demo",
            status="connected",
        )
        db.add(store)
        db.commit()
        return store

    @staticmethod
    def create_live_store(
        db: Session,
        merchant_id: str,
        store_url: str,
        consumer_key: str,
        consumer_secret: str,
    ) -> Store:
        """Create a live WooCommerce store connection"""
        store = Store(
            id=uuid.uuid4(),
            merchant_id=uuid.UUID(merchant_id) if isinstance(merchant_id, str) else merchant_id,
            name="WooCommerce Store",
            store_url=store_url,
            provider="woocommerce",
            mode="live",
            status="connected",
        )
        db.add(store)
        db.flush()

        # Create encrypted connection
        connection = WooCommerceConnection(
            id=uuid.uuid4(),
            store_id=store.id,
            consumer_key=consumer_key,
            encrypted_consumer_secret=encrypt_secret(consumer_secret),
        )
        db.add(connection)
        db.commit()

        return store

    @staticmethod
    def get_store(db: Session, store_id: str) -> Store:
        """Get a store by ID"""
        return db.query(Store).filter(Store.id == store_id).first()

    @staticmethod
    def get_stores(db: Session, merchant_id: str) -> list:
        """Get all stores for a merchant"""
        return db.query(Store).filter(Store.merchant_id == merchant_id).all()

    @staticmethod
    def delete_store(db: Session, store_id: str) -> bool:
        """Delete a store"""
        store = db.query(Store).filter(Store.id == store_id).first()
        if store:
            db.delete(store)
            db.commit()
            return True
        return False

    @staticmethod
    def get_connection(db: Session, store_id: str) -> WooCommerceConnection:
        """Get WooCommerce connection for a store"""
        return db.query(WooCommerceConnection).filter(
            WooCommerceConnection.store_id == store_id
        ).first()

    @staticmethod
    def get_decrypted_secret(db: Session, store_id: str) -> str:
        """Get decrypted consumer secret"""
        connection = StoreService.get_connection(db, store_id)
        if connection:
            return decrypt_secret(connection.encrypted_consumer_secret)
        return None
