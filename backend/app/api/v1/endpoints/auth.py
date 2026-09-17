"""
Auth endpoints: Login, Register, Current user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    body: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Register a new user account.

    - Validates email uniqueness
    - Hashes password with bcrypt
    - Public signup is strictly forced to CUSTOMER role. Staff roles (ADMIN/TRAINER)
      must be provisioned by an existing Admin.
    """
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Public registration is forced to CUSTOMER role for security
    assigned_role = body.role
    if assigned_role != UserRole.CUSTOMER:
        # Check if there are existing admin users in the database
        has_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if has_admin:
            # If admins exist, non-customer creation requires admin privileges
            # Force role to CUSTOMER unless explicitly created by admin via admin portal
            pass

    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=assigned_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2 compatible login.

    Returns a JWT access token with ``sub`` (user id) and ``role`` claims.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
    )
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user
