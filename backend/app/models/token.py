"""
SQLAlchemy UsedToken model.

Stores consumed JWT ``jti`` values to prevent QR replay attacks.
When a QR pass token is verified, its jti is persisted here;
subsequent attempts with the same jti are rejected.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime

from app.db.base import Base


class UsedToken(Base):
    __tablename__ = "used_tokens"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(255), unique=True, index=True, nullable=False)
    used_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    # Store expiry so a cleanup job can purge old rows
    expires_at = Column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<UsedToken jti={self.jti}>"
