from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Any
from datetime import datetime
import time
from enum import Enum
import time
from enum import Enum

class ObjectType(str, Enum):
    PERSON = "person"
    VEHICLE = "vehicle"
    BOAT = "boat"
    UNKNOWN = "unknown"

class ZoneType(str, Enum):
    RESTRICTED = "restricted"
    MONITORED = "monitored"
    TRANSIT = "transit"
    SAFE = "safe"

class Point(BaseModel):
    x: int
    y: int

class Zone(BaseModel):
    id: str
    name: str
    type: ZoneType
    polygon: List[Point]  # List of (x, y)
    active: bool = True
    # simple rule: list of disallowed object types
    disallowed_types: List[ObjectType] = [ObjectType.PERSON] 

class Track(BaseModel):
    id: int
    label: str # e.g., 'person'
    confidence: float
    bbox: Tuple[int, int, int, int] # x1, y1, x2, y2
    velocity: Optional[Tuple[float, float]] = None # dx, dy
    history: List[Point] = []
    first_seen: Optional[float] = None
    last_seen: float = Field(default_factory=time.time)
    
    # Persistence Fields
    persistent_id: Optional[str] = None
    status: str = "active" # active, locked, lost
    lock_strength: float = 0.0
    should_announce: bool = False
    avg_confidence: float = 0.0
    avg_confidence: float = 0.0
    detection_count: int = 1
    
    # V2.2 Pose Estimation Support
    keypoints: Optional[Any] = None # numpy array or list of [x,y,conf]
    action: Optional[str] = None # e.g. "reaching", "concealing"

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class Event(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    severity: AlertSeverity
    title: str
    description: str
    zone_id: Optional[str] = None
    track_id: Optional[int] = None
    snapshot_path: Optional[str] = None # Path to image file
