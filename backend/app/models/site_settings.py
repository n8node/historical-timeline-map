from sqlalchemy import Column, String, DateTime, func

from app.database import Base


class SiteSettings(Base):
    __tablename__ = "site_settings"

    key = Column(String(100), primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
