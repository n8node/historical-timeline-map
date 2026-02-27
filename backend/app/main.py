import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, func, text

from app.config import settings
from app.database import async_session
from app.models.user import User
from app.models.person import Person
from app.services.auth import hash_password
from app.api import api_router


async def create_admin_user():
    """Create or update admin user from environment variables."""
    try:
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
                print(f"[STARTUP] Admin user CREATED: {settings.ADMIN_EMAIL}")
            else:
                existing.password_hash = hash_password(settings.ADMIN_PASSWORD)
                existing.is_active = True
                await session.commit()
                print(f"[STARTUP] Admin user password UPDATED: {settings.ADMIN_EMAIL}")

            user_count = (await session.execute(select(func.count(User.id)))).scalar()
            person_count = (await session.execute(select(func.count(Person.id)))).scalar()
            print(f"[STARTUP] Database: {user_count} users, {person_count} persons")

    except Exception as e:
        print(f"[STARTUP ERROR] Failed to create admin user: {e}")
        traceback.print_exc()


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


@app.get("/api/debug")
async def debug():
    """Diagnostic endpoint — shows DB state without sensitive data."""
    try:
        async with async_session() as session:
            user_count = (await session.execute(select(func.count(User.id)))).scalar()
            person_count = (await session.execute(select(func.count(Person.id)))).scalar()

            users = (await session.execute(
                select(User.email, User.is_active, User.role)
            )).all()

            persons_sample = (await session.execute(
                select(Person.name, Person.birth_year, Person.death_year, Person.era, Person.birth_lat, Person.birth_lon)
                .limit(20)
            )).all()

            tables = (await session.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            )).all()

            return {
                "status": "ok",
                "tables": [t[0] for t in tables],
                "user_count": user_count,
                "person_count": person_count,
                "users": [
                    {"email": u[0], "is_active": u[1], "role": u[2]}
                    for u in users
                ],
                "persons_sample": [
                    {
                        "name": p[0], "birth_year": p[1], "death_year": p[2],
                        "era": p[3], "birth_lat": p[4], "birth_lon": p[5],
                    }
                    for p in persons_sample
                ],
                "admin_email_env": settings.ADMIN_EMAIL,
                "environment": settings.ENVIRONMENT,
            }
    except Exception as e:
        return {"status": "error", "detail": str(e), "traceback": traceback.format_exc()}
