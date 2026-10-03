"""Pytest configuration and shared fixtures."""
import pytest
import os


@pytest.fixture
def test_store_url():
    """Test WooCommerce store URL."""
    return "https://example.com"


@pytest.fixture
def test_consumer_key():
    """Test consumer key."""
    return "ck_test1234567890"


@pytest.fixture
def test_consumer_secret():
    """Test consumer secret."""
    return "cs_test0987654321"


@pytest.fixture
def test_store_id():
    """Test store ID."""
    return "test-store-uuid-1234"


@pytest.fixture
def test_merchant_id():
    """Test merchant ID."""
    return "test-merchant-uuid-5678"
