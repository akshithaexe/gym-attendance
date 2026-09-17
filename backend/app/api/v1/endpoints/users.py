"""
User management endpoints: list members, assign trainer, update/deactivate.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserListResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=UserListResponse)
def list_users(
    skip: int = 0,
    limit: int = 50,
    role: UserRole | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    List all users (admin only).

    Optionally filter by role.
    """
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.offset(skip).limit(limit).all()
    return UserListResponse(users=users, total=total)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """Get a single user by ID (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Update a user's profile (admin only).

    Can change name, role, active status, or assigned trainer.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = body.model_dump(exclude_unset=True)

    # Validate trainer assignment
    if "trainer_id" in update_data and update_data["trainer_id"] is not None:
        trainer = (
            db.query(User)
            .filter(
                User.id == update_data["trainer_id"],
                User.role == UserRole.TRAINER,
            )
            .first()
        )
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Trainer not found or user is not a trainer",
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/assign-trainer", response_model=UserResponse)
def assign_trainer(
    user_id: int,
    trainer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Assign a trainer to a customer (admin only).
    """
    customer = db.query(User).filter(User.id == user_id).first()
    if not customer or customer.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not a customer",
        )

    trainer = db.query(User).filter(User.id == trainer_id).first()
    if not trainer or trainer.role != UserRole.TRAINER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified trainer not found or invalid role",
        )

    customer.trainer_id = trainer_id
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/trainers/trainees", response_model=UserListResponse)
def get_my_trainees(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker([UserRole.TRAINER, UserRole.ADMIN])
    ),
):
    """
    Get the list of trainees assigned to the current trainer.
    Admins see all customers.
    """
    if current_user.role == UserRole.ADMIN:
        query = db.query(User).filter(User.role == UserRole.CUSTOMER)
    else:
        query = db.query(User).filter(User.trainer_id == current_user.id)

    users = query.all()
    return UserListResponse(users=users, total=len(users))


from app.schemas.user import MembershipUpdateRequest
from datetime import timezone
from dateutil.relativedelta import relativedelta

@router.put("/{user_id}/membership", response_model=UserResponse)
def update_membership(
    user_id: int,
    body: MembershipUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Update a user's membership plan (Admin only).
    Adds months_to_add to the current expiration date (or from today if expired/none).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    now = datetime.now(timezone.utc)
    
    # If extending an existing active membership, add to the current expiry
    if user.membership_expires_at and user.membership_expires_at > now:
        base_date = user.membership_expires_at
    else:
        base_date = now

    user.membership_expires_at = base_date + relativedelta(months=body.months_to_add)
    
    if body.membership_type:
        user.membership_type = body.membership_type

    db.commit()
    db.refresh(user)
    return user
