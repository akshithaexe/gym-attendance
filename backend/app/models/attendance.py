"""
SQLAlchemy Attendance model.

Tracks gym check-in / check-out events.
``marked_by`` distinguishes QR-scanned entries from manual marks by a trainer.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False, index=True,
    )
    check_in = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    check_out = Column(DateTime(timezone=True), nullable=True)

    # "qr_scan" | "manual" – how the attendance was recorded
    marked_by = Column(String(50), default="qr_scan", nullable=False)

    # The user (trainer / admin) who marked attendance manually (NULL for QR)
    marked_by_user_id = Column(
        Integer, ForeignKey("users.id"), nullable=True,
    )

    # ── Relationships ─────────────────────────────────────────
    user = relationship(
        "User",
        back_populates="attendances",
        foreign_keys=[user_id],
    )
    marked_by_user = relationship(
        "User",
        foreign_keys=[marked_by_user_id],
    )

    def __repr__(self) -> str:
        return (
            f"<Attendance id={self.id} user_id={self.user_id} "
            f"check_in={self.check_in}>"
        )
