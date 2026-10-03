import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/razorpay_merchant"

    # Frontend
    frontend_url: str = "http://localhost:3000"

    # WooCommerce
    woocommerce_request_timeout: int = 10
    max_retries: int = 3

    # Encryption
    encryption_key: str = "dev-key-change-in-production"

    # App
    environment: str = "development"
    debug: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
