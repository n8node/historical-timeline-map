from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.person import Person
from app.schemas import PersonResponse, PersonMapResponse, PersonYearRangeResponse, EraResponse

router = APIRouter()

ERAS = [
    EraResponse(name="Древний Египет", start_year=-3000, end_year=-30, color="#8B4513"),
    EraResponse(name="Античность", start_year=-800, end_year=476, color="#CD853F"),
    EraResponse(name="Средневековье", start_year=476, end_year=1500, color="#4A5568"),
    EraResponse(name="Возрождение", start_year=1300, end_year=1600, color="#2D8659"),
    EraResponse(name="Новое время", start_year=1500, end_year=1900, color="#2B6CB0"),
    EraResponse(name="Новейшее время", start_year=1900, end_year=2026, color="#E53E3E"),
]


@router.get("/persons", response_model=list[PersonMapResponse])
async def get_persons_by_year(
    year: int = Query(..., ge=-5000, le=2026, description="Year to filter persons"),
    db: AsyncSession = Depends(get_db),
):
    """Return all published persons alive in the given year (lightweight for map markers)."""
    result = await db.execute(
        select(Person)
        .where(
            Person.is_published == True,
            Person.birth_year <= year,
            Person.death_year >= year,
            Person.birth_lat.isnot(None),
            Person.birth_lon.isnot(None),
        )
        .order_by(Person.name)
    )
    return result.scalars().all()


@router.get("/persons/{person_id}", response_model=PersonResponse)
async def get_person_detail(person_id: UUID, db: AsyncSession = Depends(get_db)):
    """Return full person details including photo gallery."""
    result = await db.execute(
        select(Person)
        .options(selectinload(Person.photos))
        .where(Person.id == person_id, Person.is_published == True)
    )
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.get("/timeline/eras", response_model=list[EraResponse])
async def get_eras():
    """Return list of historical eras for timeline markers."""
    return ERAS


@router.get("/timeline/person-markers", response_model=list[PersonYearRangeResponse])
async def get_person_markers(db: AsyncSession = Depends(get_db)):
    """Return birth/death year ranges for all published persons (for timeline heat indicators)."""
    result = await db.execute(
        select(Person)
        .where(Person.is_published == True)
        .order_by(Person.birth_year)
    )
    return result.scalars().all()
