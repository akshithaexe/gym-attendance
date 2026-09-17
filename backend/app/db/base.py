"""
Declarative base class for all SQLAlchemy models.

Import ``Base`` here so that Alembic and model modules share the
same metadata registry.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass
