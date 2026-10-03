import httpx
import asyncio
from typing import Dict, Any, Optional
from app.config import settings
from .base import BaseMerchantConnector


class WooCommerceConnector(BaseMerchantConnector):
    """Real WooCommerce REST API connector"""

    def __init__(
        self, store_url: str, consumer_key: str, consumer_secret: str
    ):
        self.store_url = store_url.rstrip("/")
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.base_url = f"{self.store_url}/wp-json/wc/v3"
        self.timeout = settings.woocommerce_request_timeout
        self.max_retries = settings.max_retries

    async def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make authenticated request to WooCommerce API with retry logic"""
        url = f"{self.base_url}{endpoint}"

        auth = (self.consumer_key, self.consumer_secret)

        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(
                    timeout=self.timeout,
                    auth=auth
                ) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        params=params,
                        json=json,
                    )

                    if response.status_code == 429:
                        # Rate limited - wait and retry
                        retry_after = int(response.headers.get("Retry-After", 5))
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(retry_after)
                            continue
                        response.raise_for_status()

                    response.raise_for_status()
                    return response.json()

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise Exception("WooCommerce authentication failed. Check credentials.")
                elif e.response.status_code == 403:
                    raise Exception("WooCommerce access forbidden. Check API permissions.")
                elif e.response.status_code >= 500:
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    raise Exception(f"WooCommerce server error: {e.response.status_code}")
                else:
                    raise Exception(f"WooCommerce API error: {e.response.status_code}")
            except httpx.TimeoutException:
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise Exception("WooCommerce request timeout")
            except Exception as e:
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise

    async def verify_connection(self) -> bool:
        """Verify the connection is valid by calling settings endpoint"""
        try:
            await self._request("GET", "/settings")
            return True
        except Exception:
            return False

    async def get_store_info(self) -> Dict[str, Any]:
        """Get store information"""
        try:
            response = await self._request("GET", "/settings")

            # Extract store info
            store_info = {
                "name": "WooCommerce Store",
                "url": self.store_url,
            }

            # Try to get from settings if available
            for setting in response:
                if setting.get("id") == "blogname":
                    store_info["name"] = setting.get("value", "WooCommerce Store")

            return store_info
        except Exception:
            return {
                "name": "WooCommerce Store",
                "url": self.store_url,
            }

    async def list_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List orders from WooCommerce"""
        params = {
            "page": page,
            "per_page": per_page,
            "orderby": "date",
            "order": "desc",
        }

        if status:
            params["status"] = status
        if search:
            params["search"] = search

        data = await self._request("GET", "/orders", params=params)

        if not isinstance(data, list):
            return {
                "orders": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
            }

        return {
            "orders": data,
            "total": len(data),
            "page": page,
            "per_page": per_page,
        }

    async def get_order(self, order_id: int) -> Dict[str, Any]:
        """Get a single order"""
        return await self._request("GET", f"/orders/{order_id}")

    async def search_orders(
        self, query: str, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """Search orders"""
        params = {
            "search": query,
            "page": page,
            "per_page": per_page,
            "orderby": "date",
            "order": "desc",
        }

        data = await self._request("GET", "/orders", params=params)

        if not isinstance(data, list):
            return {
                "orders": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
            }

        return {
            "orders": data,
            "total": len(data),
            "page": page,
            "per_page": per_page,
        }

    async def list_products(
        self,
        page: int = 1,
        per_page: int = 20,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List products from WooCommerce"""
        params = {
            "page": page,
            "per_page": per_page,
            "orderby": "date",
            "order": "desc",
        }

        if stock_status:
            params["stock_status"] = stock_status
        if search:
            params["search"] = search

        data = await self._request("GET", "/products", params=params)

        if not isinstance(data, list):
            return {
                "products": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
            }

        return {
            "products": data,
            "total": len(data),
            "page": page,
            "per_page": per_page,
        }

    async def get_product(self, product_id: int) -> Dict[str, Any]:
        """Get a single product"""
        return await self._request("GET", f"/products/{product_id}")

    async def search_products(
        self, query: str, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """Search products"""
        params = {
            "search": query,
            "page": page,
            "per_page": per_page,
            "orderby": "date",
            "order": "desc",
        }

        data = await self._request("GET", "/products", params=params)

        if not isinstance(data, list):
            return {
                "products": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
            }

        return {
            "products": data,
            "total": len(data),
            "page": page,
            "per_page": per_page,
        }

    async def list_customers(
        self, page: int = 1, per_page: int = 20, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """List customers from WooCommerce"""
        params = {
            "page": page,
            "per_page": per_page,
            "orderby": "name",
            "order": "asc",
        }

        if search:
            params["search"] = search

        data = await self._request("GET", "/customers", params=params)

        if not isinstance(data, list):
            return {
                "customers": [],
                "total": 0,
                "page": page,
                "per_page": per_page,
            }

        return {
            "customers": data,
            "total": len(data),
            "page": page,
            "per_page": per_page,
        }

    async def get_customer(self, customer_id: int) -> Dict[str, Any]:
        """Get a single customer"""
        return await self._request("GET", f"/customers/{customer_id}")
