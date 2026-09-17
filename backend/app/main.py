"""
FastAPI application entrypoint.

- Configures CORS middleware
- Mounts the v1 API router
- Creates database tables on startup (dev convenience)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.api.v1.router import api_v1_router

# Ensure all models are imported so Base.metadata knows about them
from app.models import User, Attendance, UsedToken  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed demo accounts on startup."""
    Base.metadata.create_all(bind=engine)

    # Seed demo users if they don't exist yet
    from app.db.session import SessionLocal
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    db = SessionLocal()
    try:
        demo_users = [
            {"email": "admin@gmail.com", "full_name": "Demo Admin", "password": "admin123", "role": UserRole.ADMIN},
            {"email": "trainer@gmail.com", "full_name": "Demo Trainer", "password": "trainer123", "role": UserRole.TRAINER},
            {"email": "member@gmail.com", "full_name": "Demo Customer", "password": "member123", "role": UserRole.CUSTOMER},
        ]
        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True,
                )
                db.add(user)
        db.commit()
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────

app.add_router = None  # type: ignore
app.include_router(api_v1_router)


@app.get("/health", tags=["Health"])
def health_check():
    """Simple health-check endpoint."""
    return {"status": "healthy", "app": settings.APP_NAME}
