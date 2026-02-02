from typing import List, Dict, Any
import time
import numpy as np
from backend.perception.engines.base import IntelligenceEngine
from backend.core.models import Track, Event

class IndustrialEngine(IntelligenceEngine):
    def __init__(self):
        super().__init__("Industrial_Drone_Intelligence")
        self.state = {
            'intruder_count': 0,
            'geofence_violations': 0
        }
        self.config = {
            'target_classes': ['person', 'truck', 'tool', 'oil_drum'],
            'enable_sahi': True
        }

    def process_frame(self, frame: np.ndarray, tracks: List[Track]) -> List[Event]:
        events = []
        # Drone-specific logic: detect unauthorized vehicles near the pipeline
        targets = [t for t in tracks if t.label in self.config['target_classes']]
        
        if len(targets) > 0:
            for t in targets:
                if t.label == 'oil_drum': # Priority detection
                     events.append(Event(
                        id=f"theft-attempt-{int(time.time())}",
                        severity="critical",
                        title="Pipeline Theft Suspected",
                        description=f"Unauthorized extraction equipment detected via drone link.",
                        track_id=t.id
                    ))
        
        return events

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "operational_altitude": "120m",
            "search_grid": "Active",
            "sahi_status": "Enabled (High Precision)"
        }
