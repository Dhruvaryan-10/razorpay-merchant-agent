from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import random
from .base import BaseMerchantConnector

# A fixed seed keeps the synthetic store identical across requests, so a record
# opened from a list is the same record the list showed.
DEMO_SEED = 1048

PAID_STATUSES = {"processing", "on-hold", "completed"}


class DemoConnector(BaseMerchantConnector):
    """Demo connector with deterministic, internally consistent synthetic data"""

    def __init__(self):
        self.store_name = "Pranav Store"
        self._rng = random.Random(DEMO_SEED)
        self._now = datetime.now().replace(second=0, microsecond=0)
        self.products_data = self._generate_products()
        self.customers_data = self._generate_customers()
        self.orders_data = self._generate_orders()
        self._derive_customer_totals()

    def _generate_customers(self) -> List[Dict[str, Any]]:
        """Generate synthetic customers"""
        people = [
            ("Rahul Sharma", "Mumbai"), ("Ananya Gupta", "Pune"), ("Arjun Mehta", "Mumbai"),
            ("Neha Kapoor", "Delhi"), ("Rohan Verma", "Delhi"), ("Priya Patel", "Bangalore"),
            ("Vikram Singh", "Delhi"), ("Meera Desai", "Pune"), ("Aditya Kumar", "Bangalore"),
            ("Sapna Reddy", "Bangalore"), ("Karan Malhotra", "Bangalore"), ("Divya Nair", "Mumbai"),
        ]
        rng = self._rng

        customers = []
        for idx, (name, city) in enumerate(people, 1):
            first, last = name.split()
            email = f"{first.lower()}.{last[0].lower()}@example.com"
            customers.append({
                "id": idx,
                "first_name": first,
                "last_name": last,
                "email": email,
                "date_created": (self._now - timedelta(days=rng.randint(90, 420))).isoformat(),
                "billing": {
                    "first_name": first,
                    "last_name": last,
                    "address_1": f"{rng.randint(100, 9999)} Main St",
                    "city": city,
                    "postcode": f"{rng.randint(110001, 560099)}",
                    "country": "IN",
                    "email": email,
                    "phone": f"+91 9{rng.randint(100000000, 999999999)}",
                },
                "orders_count": 0,
                "total_spent": 0,
            })

        return customers

    def _generate_products(self) -> List[Dict[str, Any]]:
        """Generate synthetic products"""
        products = [
            {"name": "Premium Wireless Headphones", "sku": "WH-001", "price": 4999, "stock": 25, "cat": "Electronics"},
            {"name": "USB-C Charging Cable", "sku": "USB-001", "price": 599, "stock": 100, "cat": "Accessories"},
            {"name": "Phone Stand", "sku": "STAND-001", "price": 1299, "stock": 8, "cat": "Accessories"},
            {"name": "Screen Protector", "sku": "SCREEN-001", "price": 399, "stock": 3, "cat": "Accessories"},
            {"name": "Portable Power Bank", "sku": "PB-001", "price": 2499, "stock": 0, "cat": "Gadgets"},
            {"name": "Wireless Mouse", "sku": "MOUSE-001", "price": 2199, "stock": 45, "cat": "Accessories"},
            {"name": "Mechanical Keyboard", "sku": "KB-001", "price": 7499, "stock": 15, "cat": "Accessories"},
            {"name": "Monitor Arm Mount", "sku": "MOUNT-001", "price": 3499, "stock": 12, "cat": "Accessories"},
            {"name": "HDMI Cable 2m", "sku": "HDMI-001", "price": 799, "stock": 60, "cat": "Accessories"},
            {"name": "Desk Lamp LED", "sku": "LAMP-001", "price": 1899, "stock": 5, "cat": "Gadgets"},
            {"name": "Laptop Stand", "sku": "LSTAND-001", "price": 2999, "stock": 22, "cat": "Accessories"},
            {"name": "Document Camera", "sku": "DOC-001", "price": 8999, "stock": 0, "cat": "Electronics"},
            {"name": "Web Camera HD", "sku": "CAM-001", "price": 3999, "stock": 18, "cat": "Electronics"},
            {"name": "Desk Organizer", "sku": "ORG-001", "price": 899, "stock": 40, "cat": "Gadgets"},
            {"name": "Noise Cancelling Earbuds", "sku": "EAR-001", "price": 5999, "stock": 33, "cat": "Electronics"},
        ]
        cat_ids = {"Electronics": 1, "Accessories": 2, "Gadgets": 3}

        result = []
        for idx, p in enumerate(products, 1):
            stock_status = "instock"
            if p["stock"] == 0:
                stock_status = "outofstock"
            elif p["stock"] < 10:
                stock_status = "lowstock"

            result.append({
                "id": idx,
                "name": p["name"],
                "sku": p["sku"],
                "price": p["price"],
                "stock_quantity": p["stock"],
                "stock_status": stock_status,
                "status": "publish",
                "description": f"High quality {p['name'].lower()}",
                "categories": [{"id": cat_ids[p["cat"]], "name": p["cat"]}],
                "images": [],
                "date_created": (self._now - timedelta(days=self._rng.randint(120, 500))).isoformat(),
            })

        return result

    def _generate_orders(self) -> List[Dict[str, Any]]:
        """Generate synthetic orders whose totals equal their line items"""
        rng = self._rng
        statuses = ["pending", "processing", "completed", "completed", "cancelled"]

        orders = []
        for idx in range(1, 31):
            status = rng.choice(statuses)
            order_date = self._now - timedelta(
                days=rng.randint(0, 59), hours=rng.randint(0, 11), minutes=rng.randint(0, 59)
            )
            customer = rng.choice(self.customers_data)

            line_items = []
            for product in rng.sample(self.products_data, rng.randint(1, 3)):
                quantity = rng.randint(1, 3)
                line_items.append({
                    "id": len(line_items) + 1,
                    "product_id": product["id"],
                    "sku": product["sku"],
                    "name": product["name"],
                    "quantity": quantity,
                    "price": product["price"],
                    "total": str(product["price"] * quantity),
                })
            total = sum(item["price"] * item["quantity"] for item in line_items)

            orders.append({
                "id": 1000 + idx,
                "number": str(1000 + idx),
                "status": status,
                "total": str(total),
                "currency": "INR",
                "payment_method": rng.choice(["upi", "credit_card", "bank_transfer"]),
                "payment_method_title": None,
                "date_created": order_date.isoformat(),
                "customer_id": customer["id"],
                "billing": dict(customer["billing"]),
                "shipping": {k: v for k, v in customer["billing"].items() if k not in ("email", "phone")},
                "line_items": line_items,
            })

        titles = {"upi": "UPI", "credit_card": "Credit card", "bank_transfer": "Bank transfer"}
        for order in orders:
            order["payment_method_title"] = titles[order["payment_method"]]

        return sorted(orders, key=lambda x: x["date_created"], reverse=True)

    def _derive_customer_totals(self) -> None:
        """Customer order counts and spend come from the generated orders"""
        for customer in self.customers_data:
            mine = [o for o in self.orders_data if o["customer_id"] == customer["id"]]
            customer["orders_count"] = len(mine)
            customer["total_spent"] = str(sum(
                float(o["total"]) for o in mine if o["status"] in PAID_STATUSES
            ))

    async def verify_connection(self) -> bool:
        """Demo always connects successfully"""
        return True

    async def get_store_info(self) -> Dict[str, Any]:
        """Get demo store info"""
        return {
            "name": self.store_name,
            "url": "https://demo.woocommerce.local",
        }

    async def list_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
        customer_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """List orders (demo)"""
        filtered = self.orders_data

        if status:
            filtered = [o for o in filtered if o["status"] == status]

        if customer_id:
            filtered = [o for o in filtered if o["customer_id"] == customer_id]

        if search:
            needle = search.lower()
            filtered = [
                o for o in filtered
                if needle in str(o["number"]).lower()
                or needle in f"{o['billing']['first_name']} {o['billing']['last_name']}".lower()
                or needle in o["billing"].get("email", "").lower()
            ]

        start = (page - 1) * per_page
        end = start + per_page

        return {
            "orders": filtered[start:end],
            "total": len(filtered),
            "page": page,
            "per_page": per_page,
        }

    async def get_order(self, order_id: int) -> Dict[str, Any]:
        """Get a single order (demo)"""
        for order in self.orders_data:
            if order["id"] == order_id or order["number"] == str(order_id):
                return order

        return {}

    async def search_orders(
        self, query: str, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """Search orders (demo)"""
        return await self.list_orders(page=page, per_page=per_page, search=query)

    async def list_products(
        self,
        page: int = 1,
        per_page: int = 20,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List products (demo)"""
        filtered = self.products_data

        if stock_status:
            filtered = [p for p in filtered if p["stock_status"] == stock_status]

        if search:
            filtered = [
                p for p in filtered
                if search.lower() in p["name"].lower()
                or search.lower() in (p.get("sku") or "").lower()
            ]

        start = (page - 1) * per_page
        end = start + per_page

        return {
            "products": filtered[start:end],
            "total": len(filtered),
            "page": page,
            "per_page": per_page,
        }

    async def get_product(self, product_id: int) -> Dict[str, Any]:
        """Get a single product (demo)"""
        for product in self.products_data:
            if product["id"] == product_id:
                return product

        return {}

    async def search_products(
        self, query: str, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """Search products (demo)"""
        return await self.list_products(page=page, per_page=per_page, search=query)

    async def list_customers(
        self, page: int = 1, per_page: int = 20, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """List customers (demo)"""
        filtered = self.customers_data

        if search:
            filtered = [
                c for c in filtered
                if search.lower() in c.get("first_name", "").lower()
                or search.lower() in c.get("last_name", "").lower()
                or search.lower() in c.get("email", "").lower()
            ]

        start = (page - 1) * per_page
        end = start + per_page

        return {
            "customers": filtered[start:end],
            "total": len(filtered),
            "page": page,
            "per_page": per_page,
        }

    async def get_customer(self, customer_id: int) -> Dict[str, Any]:
        """Get a single customer (demo)"""
        for customer in self.customers_data:
            if customer["id"] == customer_id:
                return customer

        return {}
