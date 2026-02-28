import math
from uuid import UUID
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.person import Person
from app.models.photo import PhotoGallery
from app.models.user import User
from app.models.site_settings import SiteSettings
from app.schemas import (
    PersonCreate, PersonUpdate, PersonResponse,
    PersonListResponse, PhotoGalleryCreate, StatsResponse,
)
from app.schemas.stats import EraCount
from app.services.auth import get_current_user


class WelcomeSettingsUpdate(BaseModel):
    welcome_image: str | None = None
    welcome_title: str | None = None
    welcome_text: str | None = None
    welcome_btn1_text: str | None = None
    welcome_btn1_url: str | None = None
    welcome_btn2_text: str | None = None
    welcome_btn2_url: str | None = None

router = APIRouter()


@router.get("/persons", response_model=PersonListResponse)
async def list_persons(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=255),
    era: str = Query(""),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = select(Person).options(selectinload(Person.photos))

    if search:
        query = query.where(Person.name.ilike(f"%{search}%"))
    if era:
        query = query.where(Person.era == era)

    count_query = select(func.count(Person.id))
    if search:
        count_query = count_query.where(Person.name.ilike(f"%{search}%"))
    if era:
        count_query = count_query.where(Person.era == era)

    total = (await db.execute(count_query)).scalar() or 0
    pages = math.ceil(total / per_page) if total else 1

    result = await db.execute(
        query.order_by(Person.birth_year)
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    items = result.scalars().all()

    return PersonListResponse(items=items, total=total, page=page, per_page=per_page, pages=pages)


@router.post("/persons", response_model=PersonResponse, status_code=201)
async def create_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    person = Person(**data.model_dump())
    db.add(person)
    await db.flush()
    await db.refresh(person, attribute_names=["photos"])
    return person


@router.get("/persons/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Person).options(selectinload(Person.photos)).where(Person.id == person_id)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.put("/persons/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: UUID,
    data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Person).options(selectinload(Person.photos)).where(Person.id == person_id)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(person, key, value)

    await db.flush()
    await db.refresh(person, attribute_names=["photos"])
    return person


@router.delete("/persons/{person_id}", status_code=204)
async def delete_person(
    person_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    await db.delete(person)


@router.post("/persons/{person_id}/photos", response_model=PersonResponse)
async def add_photo(
    person_id: UUID,
    data: PhotoGalleryCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Person).options(selectinload(Person.photos)).where(Person.id == person_id)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    photo = PhotoGallery(person_id=person_id, **data.model_dump())
    db.add(photo)
    await db.flush()
    await db.refresh(person, attribute_names=["photos"])
    return person


@router.delete("/persons/{person_id}/photos/{photo_id}", status_code=204)
async def delete_photo(
    person_id: UUID,
    photo_id: UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PhotoGallery).where(PhotoGallery.id == photo_id, PhotoGallery.person_id == person_id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    await db.delete(photo)


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    total = (await db.execute(select(func.count(Person.id)))).scalar() or 0
    published = (await db.execute(
        select(func.count(Person.id)).where(Person.is_published == True)
    )).scalar() or 0

    era_rows = (await db.execute(
        select(Person.era, func.count(Person.id))
        .where(Person.era.isnot(None))
        .group_by(Person.era)
    )).all()

    cat_rows = (await db.execute(
        select(Person.category, func.count(Person.id))
        .where(Person.category.isnot(None))
        .group_by(Person.category)
    )).all()

    return StatsResponse(
        total_persons=total,
        total_published=published,
        by_era=[EraCount(era=row[0], count=row[1]) for row in era_rows],
        by_category=[EraCount(era=row[0], count=row[1]) for row in cat_rows],
    )


@router.get("/settings/welcome", response_model=Dict[str, str])
async def admin_get_welcome(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SiteSettings).where(SiteSettings.key.like("welcome_%"))
    )
    rows = result.scalars().all()
    return {row.key: row.value for row in rows}


@router.put("/settings/welcome", response_model=Dict[str, str])
async def admin_update_welcome(
    data: WelcomeSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    for key, value in updates.items():
        result = await db.execute(
            select(SiteSettings).where(SiteSettings.key == key)
        )
        row = result.scalar_one_or_none()
        if row:
            row.value = value
        else:
            db.add(SiteSettings(key=key, value=value))

    result = await db.execute(
        select(SiteSettings).where(SiteSettings.key.like("welcome_%"))
    )
    rows = result.scalars().all()
    return {row.key: row.value for row in rows}
