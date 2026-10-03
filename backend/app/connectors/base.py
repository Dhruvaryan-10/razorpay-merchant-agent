from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseMerchantConnector(ABC):
    """Base interface for merchant connectors (WooCommerce, Shopify, etc)"""

    @abstractmethod
    async def verify_connection(self) -> bool:
        """Verify the connection is valid"""
        pass

    @abstractmethod
    async def list_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List orders with pagination and filters"""
        pass

    @abstractmethod
    async def get_order(self, order_id: int) -> Dict[str, Any]:
        """Get a single order"""
        pass

    @abstractmethod
    async def search_orders(
        self, query: str, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """Search orders"""
        pass

    @abstractmethod
    async def list_products(
        self,
        page: int = 1,
        per_page: int = 20,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List products with pagination"""
        pass

    @abstractmethod
    async def get_product(self, product_id: int) -> Dict[str, Any]:
        """Get a single product"""
        pass

    @abstractmethod
    async def search_products(
        self, query: str, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """Search products"""
        pass

    @abstractmethod
    async def list_customers(
        self, page: int = 1, per_page: int = 20, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """List customers"""
        pass

    @abstractmethod
    async def get_customer(self, customer_id: int) -> Dict[str, Any]:
        """Get a single customer"""
        pass

    @abstractmethod
    async def get_store_info(self) -> Dict[str, Any]:
        """Get store information"""
        pass
