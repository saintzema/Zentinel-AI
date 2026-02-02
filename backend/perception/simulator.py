import time
import random
import math
from typing import List
from backend.core.models import Track

class TrafficSimulator:
    """Generates simulated tracks for demo purposes"""
    def __init__(self, width=1920, height=1080):
        self.width = width
        self.height = height
        self.tracks = {} # id -> {x, y, dx, dy, type}
        self.next_id = 1000

    def update(self) -> List[Track]:
        # Spawn new entity occasionally
        if random.random() < 0.05: # 5% chance per frame
            tid = self.next_id
            self.next_id += 1
            # Start at random edge
            side = random.choice(['left', 'right'])
            y = random.randint(200, self.height - 200)
            if side == 'left':
                x = 0
                dx = random.uniform(2, 5)
            else:
                x = self.width
                dx = random.uniform(-5, -2)
            
            dy = random.uniform(-1, 1)
            obj_type = random.choice(['person', 'vehicle'])
            
            self.tracks[tid] = {
                'x': x, 'y': y, 
                'dx': dx, 'dy': dy, 
                'type': obj_type,
                'life': 0
            }

        # Update existing
        active_tracks = []
        dead_ids = []
        
        for tid, t in self.tracks.items():
            t['x'] += t['dx']
            t['y'] += t['dy']
            t['life'] += 1

            # Bounds check
            if t['x'] < -50 or t['x'] > self.width + 50 or t['y'] < -50 or t['y'] > self.height + 50:
                dead_ids.append(tid)
                continue

            # Create Track object
            # bbox center at x,y with size 40x100 for person, 100x60 for car
            if t['type'] == 'person':
                w, h = 40, 100
            else:
                w, h = 100, 60
                
            x1 = int(t['x'] - w/2)
            y1 = int(t['y'] - h/2)
            x2 = int(t['x'] + w/2)
            y2 = int(t['y'] + h/2)
            
            track = Track(
                id=tid,
                label=t['type'],
                confidence=0.95,
                bbox=(x1, y1, x2, y2)
            )
            active_tracks.append(track)

        for tid in dead_ids:
            del self.tracks[tid]
            
        # Generates a synthetic image frame with tracks drawn
        import numpy as np
        import cv2
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        # Draw tracks
        for track in active_tracks:
            x1, y1, x2, y2 = map(int, track.bbox)
            color = (0, 255, 0) if track.label == 'person' else (255, 0, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{track.id}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            
        return active_tracks, frame
