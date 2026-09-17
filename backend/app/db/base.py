"""
Declarative base class for all SQLAlchemy models.

Import ``Base`` here so that Alembic and model modules share the
same metadata registry.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# Import all models here so Base.metadata includes them
from app.models.user import User  # noqa: F401
from app.models.attendance import Attendance  # noqa: F401
from app.models.token import UsedToken  # noqa: F401

