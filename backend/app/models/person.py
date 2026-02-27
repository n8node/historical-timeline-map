import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Person(Base):
    __tablename__ = "persons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    name_original = Column(String(255))

    birth_year = Column(Integer, nullable=False)
    death_year = Column(Integer, nullable=False)
    birth_year_approximate = Column(Boolean, default=False)
    death_year_approximate = Column(Boolean, default=False)

    birth_lat = Column(Float)
    birth_lon = Column(Float)
    death_lat = Column(Float)
    death_lon = Column(Float)
    birth_place_name = Column(String(255))
    death_place_name = Column(String(255))

    main_photo_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    activity_description = Column(String(500))
    short_bio = Column(Text)

    era = Column(String(100))
    category = Column(String(100))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_published = Column(Boolean, default=True)

    photos = relationship("PhotoGallery", back_populates="person", cascade="all, delete-orphan", order_by="PhotoGallery.display_order")
