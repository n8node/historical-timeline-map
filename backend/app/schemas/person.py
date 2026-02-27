from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PhotoGalleryCreate(BaseModel):
    photo_url: str
    caption: Optional[str] = None
    display_order: int = 0


class PhotoGalleryResponse(BaseModel):
    id: UUID
    photo_url: str
    caption: Optional[str] = None
    display_order: int

    model_config = {"from_attributes": True}


class PersonCreate(BaseModel):
    name: str
    name_original: Optional[str] = None
    birth_year: int
    death_year: int
    birth_year_approximate: bool = False
    death_year_approximate: bool = False
    birth_lat: Optional[float] = None
    birth_lon: Optional[float] = None
    death_lat: Optional[float] = None
    death_lon: Optional[float] = None
    birth_place_name: Optional[str] = None
    death_place_name: Optional[str] = None
    main_photo_url: str
    description: str
    activity_description: Optional[str] = None
    short_bio: Optional[str] = None
    era: Optional[str] = None
    category: Optional[str] = None


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    name_original: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    birth_year_approximate: Optional[bool] = None
    death_year_approximate: Optional[bool] = None
    birth_lat: Optional[float] = None
    birth_lon: Optional[float] = None
    death_lat: Optional[float] = None
    death_lon: Optional[float] = None
    birth_place_name: Optional[str] = None
    death_place_name: Optional[str] = None
    main_photo_url: Optional[str] = None
    description: Optional[str] = None
    activity_description: Optional[str] = None
    short_bio: Optional[str] = None
    era: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class PersonResponse(BaseModel):
    id: UUID
    name: str
    name_original: Optional[str] = None
    birth_year: int
    death_year: int
    birth_year_approximate: bool
    death_year_approximate: bool
    birth_lat: Optional[float] = None
    birth_lon: Optional[float] = None
    death_lat: Optional[float] = None
    death_lon: Optional[float] = None
    birth_place_name: Optional[str] = None
    death_place_name: Optional[str] = None
    main_photo_url: str
    description: str
    activity_description: Optional[str] = None
    short_bio: Optional[str] = None
    era: Optional[str] = None
    category: Optional[str] = None
    is_published: bool
    created_at: datetime
    updated_at: datetime
    photos: list[PhotoGalleryResponse] = []

    model_config = {"from_attributes": True}


class PersonListResponse(BaseModel):
    items: list[PersonResponse]
    total: int
    page: int
    per_page: int
    pages: int


class PersonMapResponse(BaseModel):
    """Lightweight person data for map markers."""
    id: UUID
    name: str
    birth_year: int
    death_year: int
    birth_lat: Optional[float] = None
    birth_lon: Optional[float] = None
    main_photo_url: str
    activity_description: Optional[str] = None
    era: Optional[str] = None
    category: Optional[str] = None

    model_config = {"from_attributes": True}


class PersonYearRangeResponse(BaseModel):
    """Minimal birth/death years for timeline visualization."""
    id: UUID
    name: str
    birth_year: int
    death_year: int
    era: Optional[str] = None

    model_config = {"from_attributes": True}
