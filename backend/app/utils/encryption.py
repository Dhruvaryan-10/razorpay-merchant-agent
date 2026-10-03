from cryptography.fernet import Fernet
from app.config import settings
import base64
import hashlib


def _get_encryption_key() -> bytes:
    """Get or generate encryption key"""
    key = settings.encryption_key
    if len(key) < 32:
        # Pad the key
        key = key.ljust(32, "0")

    # Create a Fernet-compatible key from the settings key
    key_hash = hashlib.sha256(key.encode()).digest()
    return base64.urlsafe_b64encode(key_hash)


def encrypt_secret(secret: str) -> bytes:
    """Encrypt a secret (WooCommerce Consumer Secret)"""
    cipher = Fernet(_get_encryption_key())
    return cipher.encrypt(secret.encode())


def decrypt_secret(encrypted_secret: bytes) -> str:
    """Decrypt a secret (WooCommerce Consumer Secret)"""
    cipher = Fernet(_get_encryption_key())
    return cipher.decrypt(encrypted_secret).decode()
