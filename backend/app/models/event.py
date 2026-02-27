import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    event_year = Column(Integer, nullable=False)
    location_lat = Column(Float)
    location_lon = Column(Float)
    location_name = Column(String(255))
    description = Column(Text)
    type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
