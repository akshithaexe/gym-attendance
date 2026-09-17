"""
Pydantic schemas for User domain: registration, login, response, and JWT tokens.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


# ── Request schemas ───────────────────────────────────────────


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.CUSTOMER


class UserUpdate(BaseModel):
    full_name: str | None = None
    is_active: bool | None = None
    role: UserRole | None = None
    trainer_id: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Response schemas ──────────────────────────────────────────


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    trainer_id: int | None = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int


# ── JWT schemas ───────────────────────────────────────────────


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user id as string
    role: str
    jti: str | None = None
    exp: datetime | None = None
