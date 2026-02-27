import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class PhotoGallery(Base):
    __tablename__ = "photo_gallery"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    person_id = Column(UUID(as_uuid=True), ForeignKey("persons.id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    caption = Column(String(255))
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    person = relationship("Person", back_populates="photos")
