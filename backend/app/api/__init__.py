from fastapi import APIRouter

from .auth import router as auth_router
from .public import router as public_router
from .admin import router as admin_router
from .upload import router as upload_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(public_router, tags=["public"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(upload_router, prefix="/admin", tags=["upload"])
