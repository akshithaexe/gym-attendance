"""
Pydantic schemas for Attendance domain: check-in, QR pass verification, logs.
"""

from datetime import datetime
from pydantic import BaseModel


# ── Request schemas ───────────────────────────────────────────


class CheckInRequest(BaseModel):
    """Body sent when scanning a QR code at the kiosk."""
    token: str  # The short-lived JWT from the QR pass


class PassTokenVerify(BaseModel):
    """Response after successfully verifying a QR pass token."""
    user_id: int
    full_name: str
    email: str
    message: str = "Check-in successful"


class ManualMarkRequest(BaseModel):
    """Body sent by a trainer / admin to manually mark attendance."""
    user_id: int
    status: str = "present"  # "present" | "absent"


# ── Response schemas ──────────────────────────────────────────


class AttendanceLog(BaseModel):
    id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    check_in: datetime
    check_out: datetime | None = None
    marked_by: str  # "qr_scan" | "manual"
    marked_by_user_id: int | None = None

    model_config = {"from_attributes": True}


class AttendanceListResponse(BaseModel):
    records: list[AttendanceLog]
    total: int
