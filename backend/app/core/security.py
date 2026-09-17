"""
Password hashing (bcrypt) and JWT token create / verify utilities.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# ── Password hashing ─────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Return bcrypt hash of *plain* password."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the bcrypt *hashed* value."""
    return pwd_context.verify(plain, hashed)


# ── JWT helpers ───────────────────────────────────────────────


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT access token.

    *data* must include ``sub`` (user id) and ``role``.
    A unique ``jti`` claim is added automatically for replay-attack tracking.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "jti": str(uuid4())})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_qr_token(user_id: int) -> str:
    """
    Create a short-lived JWT used inside the QR code pass.

    Token is valid for QR_TOKEN_EXPIRE_SECONDS (default 30 s).
    The ``jti`` is stored server-side after first use to prevent replays.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        seconds=settings.QR_TOKEN_EXPIRE_SECONDS,
    )
    return jwt.encode(
        {
            "sub": str(user_id),
            "exp": expire,
            "jti": str(uuid4()),
            "type": "qr_pass",
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.

    Raises ``JWTError`` on invalid / expired tokens.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
    )
