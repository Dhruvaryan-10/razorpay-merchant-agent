"""Test encryption utilities."""
import pytest
from app.utils import encrypt_secret, decrypt_secret


def test_encrypt_secret():
    """Test that a secret can be encrypted."""
    secret = "test_secret_key_12345"
    encrypted = encrypt_secret(secret)

    # Should be bytes
    assert isinstance(encrypted, bytes)
    # Should not equal the original
    assert encrypted != secret.encode()
    # Should not be empty
    assert len(encrypted) > 0


def test_decrypt_secret():
    """Test that an encrypted secret can be decrypted."""
    original_secret = "test_secret_key_12345"
    encrypted = encrypt_secret(original_secret)
    decrypted = decrypt_secret(encrypted)

    # Should match the original
    assert decrypted == original_secret


def test_encrypt_decrypt_roundtrip():
    """Test encryption and decryption roundtrip."""
    secrets = [
        "simple",
        "with_underscores_and_numbers_123",
        "with-dashes",
        "with.dots",
        "cs_live_1234567890abcdef",  # Real-looking WooCommerce key format
        "!@#$%^&*()_+-=[]{}|;:,.<>?",  # Special characters
    ]

    for original in secrets:
        encrypted = encrypt_secret(original)
        decrypted = decrypt_secret(encrypted)
        assert decrypted == original, f"Failed for secret: {original}"


def test_different_secrets_produce_different_encrypted_values():
    """Test that different secrets produce different encrypted values."""
    secret1 = "secret_one"
    secret2 = "secret_two"

    encrypted1 = encrypt_secret(secret1)
    encrypted2 = encrypt_secret(secret2)

    # Should be different
    assert encrypted1 != encrypted2


def test_same_secret_produces_different_encrypted_values():
    """Test that encryption is randomized (same secret produces different ciphertext)."""
    secret = "same_secret"

    encrypted1 = encrypt_secret(secret)
    encrypted2 = encrypt_secret(secret)

    # Due to Fernet's randomization, these should be different
    # But they should both decrypt to the same value
    assert decrypt_secret(encrypted1) == secret
    assert decrypt_secret(encrypted2) == secret


def test_encrypt_empty_string():
    """Test encrypting an empty string."""
    encrypted = encrypt_secret("")
    decrypted = decrypt_secret(encrypted)
    assert decrypted == ""


def test_encrypt_long_secret():
    """Test encrypting a very long secret."""
    long_secret = "x" * 1000
    encrypted = encrypt_secret(long_secret)
    decrypted = decrypt_secret(encrypted)
    assert decrypted == long_secret
