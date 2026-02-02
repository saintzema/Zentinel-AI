from typing import List, Dict, Any
import time
import numpy as np
from backend.perception.engines.base import IntelligenceEngine
from backend.core.models import Track, Event

class MallSecurityEngine(IntelligenceEngine):
    def __init__(self):
        super().__init__("Mall_Protector_V1")
        self.state = {
            'track_history': {}, # track_id -> list of positions (for velocity)
            'suspicious_ids': set(),
            'alert_cooldowns': {},
            'action_states': {} # track_id -> "Walking" | "Standing" | "Concealing"
        }
        self.config = {
            'suspicious_velocity': 15.0, # pixel/frame movement
            'min_confidence': 0.4, # LOWERED from 0.6 to catch obscured limbs (hoodies)
            'conceal_thresh_factor': 0.35 # wrist to hip distance factor
        }

    def process_frame(self, frame: np.ndarray, tracks: List[Track]) -> List[Event]:
        events = []
        persons = [t for t in tracks if t.label == 'person']
        now = time.time()
        
        for p in persons:
            # 1. Velocity & Action Classification
            center = ((p.bbox[0] + p.bbox[2])/2, (p.bbox[1] + p.bbox[3])/2)
            if p.id not in self.state['track_history']:
                self.state['track_history'][p.id] = []
            
            self.state['track_history'][p.id].append(center)
            if len(self.state['track_history'][p.id]) > 10:
                self.state['track_history'][p.id].pop(0)

            velocity = 0.0
            if len(self.state['track_history'][p.id]) >= 2:
                p1 = self.state['track_history'][p.id][0]
                p2 = self.state['track_history'][p.id][-1]
                dist = np.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)
                velocity = dist / len(self.state['track_history'][p.id]) # avg pixels per frame
            
            # Classify Action
            action = "Standing" if velocity < 2.0 else "Walking"
            p.action = action # Attach to track object for rendering
            
            # 2. Pose Analysis: Concealment Detection (Item in Pocket)
            is_concealing = False
            if hasattr(p, 'keypoints') and p.keypoints is not None:
                try:
                    kpts = p.keypoints
                    # Keypoints: 0=Nose, 5=L_Shoulder, 6=R_Shoulder, 9=L_Wrist, 10=R_Wrist, 11=L_Hip, 12=R_Hip
                    if len(kpts) >= 13:
                        def dist(kpt1_coords, kpt2_coords): 
                            return np.sqrt((kpt1_coords[0]-kpt2_coords[0])**2 + (kpt1_coords[1]-kpt2_coords[1])**2)
                        
                        # Extract keypoints with confidence check
                        l_wrist = kpts[9][:2] if kpts[9][2] > self.config['min_confidence'] else None
                        r_wrist = kpts[10][:2] if kpts[10][2] > self.config['min_confidence'] else None
                        l_hip = kpts[11][:2] if kpts[11][2] > self.config['min_confidence'] else None
                        r_hip = kpts[12][:2] if kpts[12][2] > self.config['min_confidence'] else None
                        l_shoulder = kpts[5][:2] if kpts[5][2] > self.config['min_confidence'] else None
                        r_shoulder = kpts[6][:2] if kpts[6][2] > self.config['min_confidence'] else None

                        # Ensure essential keypoints are present for calculations
                        if all(k is not None for k in [l_hip, r_hip, l_shoulder, r_shoulder, l_wrist, r_wrist]):
                            # 4b. Concealment Logic V2 (Pocket + Hoodie + Waist)
                            # Define Body Zones
                            mid_hip = ((l_hip[0]+r_hip[0])/2, (l_hip[1]+r_hip[1])/2)
                            mid_shoulder = ((l_shoulder[0]+r_shoulder[0])/2, (l_shoulder[1]+r_shoulder[1])/2)
                            mid_chest = ((mid_hip[0]+mid_shoulder[0])/2, (mid_hip[1]+mid_shoulder[1])/2)
                            
                            torso_height = dist(mid_shoulder, mid_hip)
                            pocket_thresh = torso_height * 0.45 
                            hoodie_thresh = torso_height * 0.50 # INCREASED from 0.35 to catch mid-chest concealment
                            
                            # Check 1: Hands near Hips/Pockets
                            near_pocket = (dist(l_wrist, l_hip) < pocket_thresh) or \
                                          (dist(r_wrist, r_hip) < pocket_thresh) or \
                                          (dist(l_wrist, r_hip) < pocket_thresh) or \
                                          (dist(r_wrist, l_hip) < pocket_thresh)

                            # Check 2: Hands near Chest/Hoodie (Center Mass)
                            near_hoodie = (dist(l_wrist, mid_chest) < hoodie_thresh) or \
                                          (dist(r_wrist, mid_chest) < hoodie_thresh)

                            is_concealing = near_pocket or near_hoodie

                            # Check 3: "Looking Around" (Head Orientation Jitter)
                            # Heuristic: Nose position relative to shoulders changes rapidly
                            # (Requires nose keypoint 0)
                            if len(kpts) > 0 and kpts[0][2] > 0.5:
                                nose = kpts[0][:2]
                                shoulder_center_x = mid_shoulder[0]
                                # Check if nose is significantly off-center from shoulders, implying head turn
                                alert_look = abs(nose[0] - shoulder_center_x) > (dist(l_shoulder, r_shoulder) * 0.8)
                                if alert_look and action == "Standing":
                                     # Looking over shoulder while standing
                                    is_concealing = True # Treat as suspicious context

                except Exception:
                    pass

            # 3. Decision Logic
            if is_concealing:
                p.status = 'suspicious'
                p.action = "Concealing"
                self.state['suspicious_ids'].add(p.id)
                
                # Immediate Alert for Theft
                if self._should_alert(p.id, 'concealment', now):
                    events.append(Event(
                        id=f"theft-{p.id}-{int(now)}",
                        severity="critical",
                        title="Potential Theft Detected",
                        description=f"Subject {p.persistent_id} concealing item in pocket.",
                        track_id=p.id,
                        metadata={"action": "concealment", "confidence": 0.88}
                    ))
            elif action == "Walking" and velocity > self.config['suspicious_velocity']:
                # Running?
                pass # Optional running check

            # Mark rendering status
            if p.id in self.state['suspicious_ids']:
                p.status = 'suspicious'

        # Cleanup
        active_ids = {p.id for p in persons}
        self.state['track_history'] = {k: v for k, v in self.state['track_history'].items() if k in active_ids}
        self.state['suspicious_ids'] = self.state['suspicious_ids'].intersection(active_ids)
        
        return events

    def _should_alert(self, track_id: int, alert_type: str, now: float) -> bool:
        key = f"{track_id}_{alert_type}"
        # Cooldown 15s to avoid spam but alert frequently enough for repeated actions
        if key not in self.state['alert_cooldowns'] or now - self.state['alert_cooldowns'][key] > 15.0:
            self.state['alert_cooldowns'][key] = now
            return True
        return False

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "mode": "ACTIVE_THEFT_PREVENTION",
            "active_targets": len(self.state['track_history'])
        }
