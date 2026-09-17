"""
V1 API router — combines all endpoint sub-routers under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.attendance import router as attendance_router
from app.api.v1.endpoints.users import router as users_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(attendance_router)
api_v1_router.include_router(users_router)
