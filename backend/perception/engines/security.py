from typing import List, Dict, Any
import time
import numpy as np
from backend.perception.engines.base import IntelligenceEngine
from backend.core.models import Track, Event

class SecurityEngine(IntelligenceEngine):
    def __init__(self):
        super().__init__("Security_Sentry_V2")
        self.state = {
            'person_dwell_times': {}, # track_id -> first_seen_time
            'last_events': []
        }
        self.config = {
            'loitering_limit': 15.0, # seconds
            'suspicious_speed': 20 # pixels per frame movement
        }

    def process_frame(self, frame: np.ndarray, tracks: List[Track]) -> List[Event]:
        events = []
        persons = [t for t in tracks if t.label == 'person']
        current_time = time.time()
        
        for person in persons:
            # 1. Loitering Detection
            if person.id not in self.state['person_dwell_times']:
                self.state['person_dwell_times'][person.id] = current_time
            
            dwell_time = current_time - self.state['person_dwell_times'][person.id]
            if dwell_time > self.config['loitering_limit']:
                events.append(Event(
                    id=f"loitering-{person.id}-{int(current_time)}",
                    severity="warning",
                    title="Loitering Alert",
                    description=f"Person {person.persistent_id} has been stationary in restricted zone for >{int(dwell_time)}s",
                    track_id=person.id
                ))
                # Reset to avoid continuous spam
                self.state['person_dwell_times'][person.id] = current_time + 60 

            # 2. Intrusion Detection (If in specific exclusion zones)
            # Already handled by ZoneEngine, but could be enhanced here with pose data
            
        # Cleanup dwell times for lost tracks
        active_ids = {p.id for p in persons}
        self.state['person_dwell_times'] = {k: v for k, v in self.state['person_dwell_times'].items() if k in active_ids}
        
        return events

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "threat_level": "LOW" if not self.state['person_dwell_times'] else "ELEVATED",
            "active_monitors": len(self.state['person_dwell_times']),
            "mode": "ACTIVE_SENTRY"
        }
