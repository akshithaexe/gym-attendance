"""
Attendance endpoints: QR generate, QR verify, attendance logs, manual mark.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.core.security import create_qr_token, decode_token
from app.models.user import User, UserRole
from app.models.attendance import Attendance
from app.models.token import UsedToken
from app.schemas.attendance import (
    AttendanceLog,
    AttendanceListResponse,
    CheckInRequest,
    PassTokenVerify,
    ManualMarkRequest,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ── QR Pass Generation ───────────────────────────────────────


@router.get("/qr-token")
def generate_qr_token(current_user: User = Depends(get_current_user)):
    """
    Generate a short-lived JWT for the customer's rotating QR pass.

    Only CUSTOMER role users can generate a QR pass.
    The token expires after 30 seconds by default.
    """
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can generate QR passes",
        )
    token = create_qr_token(current_user.id)
    return {"qr_token": token}


# ── QR Verification (Kiosk) ──────────────────────────────────


@router.post("/verify", response_model=PassTokenVerify)
def verify_qr_token(
    body: CheckInRequest,
    db: Session = Depends(get_db),
):
    """
    Verify a scanned QR pass token and record check-in.

    Security:
      1. Decode the JWT and validate expiry
      2. Check ``jti`` against UsedToken table → reject replays
      3. Persist jti to prevent future reuse
      4. Create an Attendance record with ``marked_by='qr_scan'``
    """
    # 1. Decode
    try:
        payload = decode_token(body.token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired QR token",
        )

    if payload.get("type") != "qr_pass":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is not a QR pass",
        )

    jti = payload.get("jti")
    user_id = int(payload["sub"])

    # 2. Replay check
    if db.query(UsedToken).filter(UsedToken.jti == jti).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="QR token has already been used (replay attack prevented)",
        )

    # 3. Mark jti as used
    used = UsedToken(
        jti=jti,
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )
    db.add(used)

    # 4. Record attendance
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    attendance = Attendance(user_id=user_id, marked_by="qr_scan")
    db.add(attendance)
    db.commit()

    return PassTokenVerify(
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        message="Check-in successful",
    )


# ── Manual Mark (Trainer / Admin) ────────────────────────────


@router.post("/manual-mark", response_model=AttendanceLog)
def manual_mark_attendance(
    body: ManualMarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        RoleChecker([UserRole.ADMIN, UserRole.TRAINER])
    ),
):
    """
    Manually mark a member's attendance (trainer or admin only).

    Trainers can only mark their assigned trainees.
    """
    target_user = db.query(User).filter(User.id == body.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Trainers can only mark their own trainees
    if (
        current_user.role == UserRole.TRAINER
        and target_user.trainer_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only mark attendance for your assigned trainees",
        )

    attendance = Attendance(
        user_id=body.user_id,
        marked_by="manual",
        marked_by_user_id=current_user.id,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return AttendanceLog(
        id=attendance.id,
        user_id=attendance.user_id,
        user_name=target_user.full_name,
        user_email=target_user.email,
        check_in=attendance.check_in,
        check_out=attendance.check_out,
        marked_by=attendance.marked_by,
        marked_by_user_id=attendance.marked_by_user_id,
    )


# ── Attendance Logs ───────────────────────────────────────────


@router.get("/logs", response_model=AttendanceListResponse)
def get_attendance_logs(
    skip: int = 0,
    limit: int = 50,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve attendance logs.

    - ADMIN  → all logs (optionally filtered by user_id)
    - TRAINER → logs for assigned trainees only
    - CUSTOMER → own logs only
    """
    query = db.query(Attendance)

    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(Attendance.user_id == current_user.id)
    elif current_user.role == UserRole.TRAINER:
        trainee_ids = [t.id for t in current_user.trainees]
        query = query.filter(Attendance.user_id.in_(trainee_ids))
    elif user_id is not None:
        # Admin filtering by specific user
        query = query.filter(Attendance.user_id == user_id)

    total = query.count()
    records = (
        query.order_by(Attendance.check_in.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    logs = []
    for r in records:
        logs.append(
            AttendanceLog(
                id=r.id,
                user_id=r.user_id,
                user_name=r.user.full_name if r.user else None,
                user_email=r.user.email if r.user else None,
                check_in=r.check_in,
                check_out=r.check_out,
                marked_by=r.marked_by,
                marked_by_user_id=r.marked_by_user_id,
            )
        )

    return AttendanceListResponse(records=logs, total=total)
