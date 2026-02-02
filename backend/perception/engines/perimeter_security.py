from typing import List, Dict, Any, Tuple
import time
import numpy as np
import cv2
from backend.perception.engines.base import IntelligenceEngine
from backend.core.models import Track, Event

class PerimeterSecurityEngine(IntelligenceEngine):
    def __init__(self):
        super().__init__("Home_Sentry_V1")
        self.state = {
            'tripwires': [
                # Default Demo Tripwire (diagonal across frame)
                {'id': 'driveway_1', 'p1': (0.2, 0.7), 'p2': (0.8, 0.7), 'direction': 'both', 'color': (0, 0, 255)} 
            ],
            'track_history': {}, # track_id -> list of positions
            'breach_cooldowns': {}
        }
        self.config = {
            'min_confidence': 0.6,
            'history_len': 5
        }

    def process_frame(self, frame: np.ndarray, tracks: List[Track]) -> List[Event]:
        events = []
        height, width = frame.shape[:2]
        now = time.time()
        
        # Draw tripwires for visualization (in a real app this might be separate)
        for tw in self.state['tripwires']:
            pt1 = (int(tw['p1'][0] * width), int(tw['p1'][1] * height))
            pt2 = (int(tw['p2'][0] * width), int(tw['p2'][1] * height))
            cv2.line(frame, pt1, pt2, tw['color'], 2)
            cv2.putText(frame, f"TRIPWIRE: {tw['id']}", (pt1[0], pt1[1]-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, tw['color'], 1)

        targets = [t for t in tracks if t.label in ['person', 'car', 'truck']]
        
        for t in targets:
            # Update history
            center = ((t.bbox[0] + t.bbox[2])/2, (t.bbox[1] + t.bbox[3])/2)
            
            if t.id not in self.state['track_history']:
                self.state['track_history'][t.id] = []
            
            self.state['track_history'][t.id].append(center)
            if len(self.state['track_history'][t.id]) > self.config['history_len']:
                self.state['track_history'][t.id].pop(0)

            # Check crossings
            if len(self.state['track_history'][t.id]) >= 2:
                prev_pos = self.state['track_history'][t.id][-2]
                curr_pos = center
                
                for tw in self.state['tripwires']:
                    # Normalize positions
                    p1_n = (prev_pos[0]/width, prev_pos[1]/height)
                    p2_n = (curr_pos[0]/width, curr_pos[1]/height)
                    
                    if self._check_line_crossing(p1_n, p2_n, tw['p1'], tw['p2']):
                        if self._should_alert(t.id, tw['id'], now):
                            # Visual Feedback
                            cv2.circle(frame, (int(curr_pos[0]), int(curr_pos[1])), 10, (0, 0, 255), -1)
                            
                            events.append(Event(
                                id=f"breach-{t.id}-{int(now)}",
                                severity="critical",
                                title="Perimeter Breach Detected",
                                description=f"{t.label.title()} crossed {tw['id']}.",
                                track_id=t.id,
                                metadata={"zone": tw['id']}
                            ))

        # Cleanup
        active_ids = {t.id for t in targets}
        self.state['track_history'] = {k: v for k, v in self.state['track_history'].items() if k in active_ids}
        
        return events

    def _ccw(self, A, B, C):
        return (C[1]-A[1]) * (B[0]-A[0]) > (B[1]-A[1]) * (C[0]-A[0])

    def _check_line_crossing(self, A, B, C, D):
        # A,B is movement vector. C,D is tripwire.
        return self._ccw(A,C,D) != self._ccw(B,C,D) and self._ccw(A,B,C) != self._ccw(A,B,D)

    def _should_alert(self, track_id: int, zone_id: str, now: float) -> bool:
        key = f"{track_id}_{zone_id}"
        if key not in self.state['breach_cooldowns'] or now - self.state['breach_cooldowns'][key] > 10.0:
            self.state['breach_cooldowns'][key] = now
            return True
        return False

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "active_tripwires": len(self.state['tripwires']),
            "breach_events": len(self.state['breach_cooldowns'])
        }
