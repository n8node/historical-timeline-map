from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import settings
from app.database import async_session
from app.models.user import User
from app.services.auth import hash_password
from app.api import api_router


async def create_admin_user():
    """Create or update admin user from environment variables."""
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing is None:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                role="admin",
                is_active=True,
            )
            session.add(admin)
            await session.commit()
            print(f"Admin user created: {settings.ADMIN_EMAIL}")
        else:
            existing.password_hash = hash_password(settings.ADMIN_PASSWORD)
            existing.is_active = True
            await session.commit()
            print(f"Admin user password updated: {settings.ADMIN_EMAIL}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_admin_user()
    yield


app = FastAPI(
    title="Historical Timeline Map API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

app.include_router(api_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
