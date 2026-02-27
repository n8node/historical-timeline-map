import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter()


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    ext = Path(file.filename or "image.jpg").suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extension {ext} is not allowed")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    filename = f"{uuid.uuid4()}{ext}"
    filepath = settings.UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        f.write(content)

    return JSONResponse({"url": f"/uploads/{filename}", "filename": filename})


@router.delete("/upload/{filename}", status_code=204)
async def delete_image(
    filename: str,
    _user: User = Depends(get_current_user),
):
    filepath = settings.UPLOAD_DIR / filename
    if filepath.exists():
        filepath.unlink()
