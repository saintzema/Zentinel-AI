import cv2
import numpy as np
import logging
from typing import List, Optional
from backend.core.models import Zone, Track, Event, AlertSeverity, ObjectType
import uuid

logger = logging.getLogger(__name__)

class ZoneEngine:
    def __init__(self):
        self.zones: List[Zone] = []

    def add_zone(self, zone: Zone):
        self.zones.append(zone)
        logger.info(f"Added zone: {zone.name} ({zone.type})")

    def check_track(self, track: Track, frame_shape: tuple) -> Optional[Event]:
        """
        Check a single track against all zones.
        Returns an Event if a rule is violated, else None.
        """
        # Calculate centroid of track
        cx = int((track.bbox[0] + track.bbox[2]) / 2)
        cy = int((track.bbox[1] + track.bbox[3]) / 2)
        track_point = (cx, cy)

        for zone in self.zones:
            if not zone.active:
                continue

            # Check if point is inside polygon
            # Convert zone points to numpy array
            pts = np.array([[p.x, p.y] for p in zone.polygon], np.int32)
            pts = pts.reshape((-1, 1, 2))
            
            # measureDist=False returns +1 if inside, -1 if outside, 0 if on edge
            is_inside = cv2.pointPolygonTest(pts, track_point, False) >= 0

            if is_inside:
                # Check rules
                # 1. Disallowed Type
                # Map YOLO label (str) to ObjectType enum if possible, or string match
                if self._is_disallowed(track.label, zone.disallowed_types):
                     return self._create_alert(zone, track, "Intrusion Detected")
        
        return None

    def _is_disallowed(self, label: str, disallowed: List[ObjectType]) -> bool:
        # Normalize label
        label = label.lower()
        if label == "person" and ObjectType.PERSON in disallowed:
            return True
        if (label == "car" or label == "truck") and ObjectType.VEHICLE in disallowed:
            return True
        return False

    def _create_alert(self, zone: Zone, track: Track, title: str) -> Event:
        return Event(
            id=str(uuid.uuid4()),
            severity=AlertSeverity.CRITICAL if zone.type == "restricted" else AlertSeverity.WARNING,
            title=f"{title}: {track.label.upper()}",
            description=f"{track.label} detected in {zone.name}",
            zone_id=zone.id,
            track_id=track.id
        )
