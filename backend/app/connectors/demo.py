from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import random
from .base import BaseMerchantConnector


class DemoConnector(BaseMerchantConnector):
    """Demo connector with synthetic data"""

    def __init__(self):
        self.store_name = "Pranav Store"
        self.products_data = self._generate_products()
        self.customers_data = self._generate_customers()
        self.orders_data = self._generate_orders()

    def _generate_customers(self) -> List[Dict[str, Any]]:
        """Generate synthetic customers"""
        names = [
            "Rahul Sharma", "Ananya Gupta", "Arjun Mehta",
            "Neha Kapoor", "Rohan Verma", "Priya Patel",
            "Vikram Singh", "Meera Desai", "Aditya Kumar",
            "Sapna Reddy", "Karan Malhotra", "Divya Nair",
        ]

        customers = []
        for idx, name in enumerate(names, 1):
            customers.append({
                "id": idx,
                "first_name": name.split()[0],
                "last_name": name.split()[1] if len(name.split()) > 1 else "",
                "email": f"customer{idx}@example.com",
                "billing": {
                    "first_name": name.split()[0],
                    "last_name": name.split()[1] if len(name.split()) > 1 else "",
                    "address_1": f"{random.randint(100, 9999)} Main St",
                    "city": random.choice(["Mumbai", "Delhi", "Bangalore", "Pune"]),
                    "postcode": f"{random.randint(100000, 999999)}",
                    "country": "IN",
                },
                "orders_count": random.randint(1, 5),
                "total_spent": random.randint(1000, 50000),
            })

        return customers

    def _generate_products(self) -> List[Dict[str, Any]]:
        """Generate synthetic products"""
        products = [
            {"name": "Premium Wireless Headphones", "sku": "WH-001", "price": 4999, "stock": 25},
            {"name": "USB-C Charging Cable", "sku": "USB-001", "price": 599, "stock": 100},
            {"name": "Phone Stand", "sku": "STAND-001", "price": 1299, "stock": 8},
            {"name": "Screen Protector", "sku": "SCREEN-001", "price": 399, "stock": 3},
            {"name": "Portable Power Bank", "sku": "PB-001", "price": 2499, "stock": 0},
            {"name": "Wireless Mouse", "sku": "MOUSE-001", "price": 2199, "stock": 45},
            {"name": "Mechanical Keyboard", "sku": "KB-001", "price": 7499, "stock": 15},
            {"name": "Monitor Arm Mount", "sku": "MOUNT-001", "price": 3499, "stock": 12},
            {"name": "HDMI Cable 2m", "sku": "HDMI-001", "price": 799, "stock": 60},
            {"name": "Desk Lamp LED", "sku": "LAMP-001", "price": 1899, "stock": 5},
            {"name": "Laptop Stand", "sku": "LSTAND-001", "price": 2999, "stock": 22},
            {"name": "Document Camera", "sku": "DOC-001", "price": 8999, "stock": 0},
            {"name": "Web Camera HD", "sku": "CAM-001", "price": 3999, "stock": 18},
            {"name": "Desk Organizer", "sku": "ORG-001", "price": 899, "stock": 40},
            {"name": "Noise Cancelling Earbuds", "sku": "EAR-001", "price": 5999, "stock": 33},
        ]

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
                "categories": [{"id": random.randint(1, 3), "name": random.choice(["Accessories", "Electronics", "Gadgets"])}],
            })

        return result

    def _generate_orders(self) -> List[Dict[str, Any]]:
        """Generate synthetic orders"""
        statuses = ["pending", "processing", "completed", "cancelled"]
        base_date = datetime.now()

        orders = []
        for idx in range(1, 31):
            status = random.choice(statuses)
            total = random.randint(1000, 50000)
            order_date = base_date - timedelta(days=random.randint(0, 60))

            orders.append({
                "id": 1000 + idx,
                "number": str(1000 + idx),
                "status": status,
                "total": total,
                "currency": "INR",
                "payment_method": random.choice(["credit_card", "upi", "bank_transfer"]),
                "date_created": order_date.isoformat(),
                "customer_id": random.randint(1, 12),
                "billing": {
                    "first_name": "Customer",
                    "last_name": str(idx),
                    "address_1": f"{random.randint(100, 9999)} Main St",
                    "city": random.choice(["Mumbai", "Delhi", "Bangalore", "Pune"]),
                    "postcode": f"{random.randint(100000, 999999)}",
                    "country": "IN",
                    "email": f"customer{idx}@example.com",
                },
                "line_items": [
                    {
                        "id": random.randint(1, 15),
                        "product_id": random.randint(1, 15),
                        "name": random.choice([p["name"] for p in self.products_data]),
                        "quantity": random.randint(1, 3),
                        "price": random.randint(500, 10000),
                    }
                ],
            })

        return sorted(orders, key=lambda x: x["date_created"], reverse=True)

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
    ) -> Dict[str, Any]:
        """List orders (demo)"""
        filtered = self.orders_data

        if status:
            filtered = [o for o in filtered if o["status"] == status]

        if search:
            filtered = [
                o for o in filtered
                if search.lower() in str(o["number"]).lower()
                or search.lower() in str(o["id"]).lower()
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
        filtered = [
            o for o in self.orders_data
            if query.lower() in str(o["number"]).lower()
            or query.lower() in str(o["id"]).lower()
        ]

        start = (page - 1) * per_page
        end = start + per_page

        return {
            "orders": filtered[start:end],
            "total": len(filtered),
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
        filtered = [
            p for p in self.products_data
            if query.lower() in p["name"].lower()
            or query.lower() in (p.get("sku") or "").lower()
        ]

        start = (page - 1) * per_page
        end = start + per_page

        return {
            "products": filtered[start:end],
            "total": len(filtered),
            "page": page,
            "per_page": per_page,
        }

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
