from typing import List, Dict, Any, Tuple
import time
import numpy as np
from backend.perception.engines.base import IntelligenceEngine
from backend.core.models import Track, Event

class TrafficEngine(IntelligenceEngine):
    def __init__(self):
        super().__init__("Traffic_Intelligence_V2")
        self.state = {
            'vehicle_count': 0,
            'density': 0.0,
            'last_check': time.time(),
            'congestion_timer': 0.0,
            'lane_occupancy': [0] * 4 # Mock lanes
        }
        self.config = {
            'congestion_threshold': 5, # vehicles in view
            'alert_delay': 10.0 # seconds before raising congestion alert
        }

    def process_frame(self, frame: np.ndarray, tracks: List[Track]) -> List[Event]:
        events = []
        vehicles = [t for t in tracks if t.label in ['car', 'truck', 'bus', 'motorcycle', 'vehicle']]
        num_vehicles = len(vehicles)
        
        # 1. Update Count
        self.state['vehicle_count'] = num_vehicles
        
        # 2. Logic: Congestion Detection
        if num_vehicles >= self.config['congestion_threshold']:
            if self.state['congestion_timer'] == 0:
                self.state['congestion_timer'] = time.time()
            
            elapsed = time.time() - self.state['congestion_timer']
            if elapsed > self.config['alert_delay']:
                events.append(Event(
                    id=f"traffic-buildup-{int(time.time())}",
                    severity="warning",
                    title="Traffic Congestion",
                    description=f"Persistent buildup detected: {num_vehicles} vehicles currently stalled in monitored sector.",
                    track_id=None
                ))
                # Reset timer to avoid spamming
                self.state['congestion_timer'] = time.time()
        else:
            self.state['congestion_timer'] = 0
            
        # 3. Logic: Excessive Speed (Mock implementation based on bbox movement)
        # In a real system we'd use calibrated pixels-to-meters
        
        return events

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "active_vehicles": self.state['vehicle_count'],
            "density_index": f"{min(100, (self.state['vehicle_count']/10)*100):.1f}%",
            "status": "CONGESTED" if self.state['congestion_timer'] > 0 else "FLUID"
        }
