from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from datetime import datetime
from .database import Base

class EventModel(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String, index=True)
    title = Column(String)
    description = Column(Text)
    zone_id = Column(String, nullable=True)
    track_id = Column(Integer, nullable=True)
    
    # Snapshot path for evidence
    snapshot_path = Column(String, nullable=True)

class VideoAssetModel(Base):
    __tablename__ = "video_assets"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    upload_time = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    duration_sec = Column(Float, nullable=True)
    detection_count = Column(Integer, default=0)

class ZoneModel(Base):
    __tablename__ = "zones"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    points_json = Column(Text) # Stored as JSON string
    active = Column(Boolean, default=True)
