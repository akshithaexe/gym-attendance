"""
SQLAlchemy User model.

Roles:
  - ADMIN    → Full access (manage users, view all attendance, assign trainers)
  - TRAINER  → View assigned trainees, manually mark attendance
  - CUSTOMER → Generate QR pass, view own attendance history
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TRAINER = "TRAINER"
    CUSTOMER = "CUSTOMER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    member_code = Column(String(20), unique=True, index=True, nullable=True)
    membership_type = Column(String(50), nullable=True)
    membership_expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Self-referential FK: a CUSTOMER may be assigned to a TRAINER
    trainer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # ── Relationships ─────────────────────────────────────────
    trainer = relationship(
        "User",
        remote_side=[id],
        backref="trainees",
        foreign_keys=[trainer_id],
    )

    # Attendance records for this user
    attendances = relationship(
        "Attendance",
        back_populates="user",
        foreign_keys="Attendance.user_id",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
