import numpy as np
from backend.perception.engines.mall_security import MallSecurityEngine
from backend.core.models import Track, Event

def mock_track_with_pose(track_id, wrist_y_relative_to_hip="far"):
    # Generate mock keypoints for a person (17 keypoints x 3 [x,y,conf])
    # Hips are indices 11, 12. Wrists are 9, 10.
    # Screen coordinates: Y increases downwards.
    
    kpts = np.zeros((17, 3))
    kpts[:, 2] = 0.9 # High confidence
    
    # Hip position (approx center of image)
    hip_y = 500
    kpts[11] = [300, hip_y, 0.9] # L Hip
    kpts[12] = [400, hip_y, 0.9] # R Hip
    
    # Shoulders (above hips, so smaller Y)
    shoulder_y = 300
    kpts[5] = [300, shoulder_y, 0.9] # L Shoulder
    kpts[6] = [400, shoulder_y, 0.9] # R Shoulder
    
    # Wrists
    if wrist_y_relative_to_hip == "near":
        # Concealing: Wrist near hip Y
        wrist_y = hip_y - 10 # Just slightly above hip
        kpts[9] = [310, wrist_y, 0.9]
    elif wrist_y_relative_to_hip == "reaching":
        # Reaching: Wrist above shoulder
        wrist_y = shoulder_y - 50
        kpts[9] = [250, wrist_y, 0.9]
    else:
        # Normal: Hands down by side but not "hiding" (or just neutral)
        wrist_y = 400 # Between shoulder and hip
        kpts[9] = [250, wrist_y, 0.9]
        
    kpts[10] = [450, 400, 0.9] # Other hand neutral
    
    t = Track(id=track_id, label="person", confidence=0.8, bbox=(200, 200, 500, 800))
    t.keypoints = kpts
    t.persistent_id = track_id
    return t

def test_concealment():
    engine = MallSecurityEngine()
    print("Testing Mall Security - Concealment Logic")
    
    # Case 1: Neutral Pose
    t1 = mock_track_with_pose(1, "neutral")
    events = engine.process_frame(np.zeros((100,100,3)), [t1])
    print(f"Neutral Events: {[e.title for e in events]}")
    assert len(events) == 0, "Neutral pose caused event"
    
    # Case 2: Concealing (Hand near hip)
    t2 = mock_track_with_pose(2, "near")
    events = engine.process_frame(np.zeros((100,100,3)), [t2])
    print(f"Concealing Events: {[e.title for e in events]}")
    assert any("Concealment" in e.title for e in events), "Concealment not detected"
    assert t2.status == 'suspicious', "Status not updated to suspicious"
    
    # Case 3: Reaching (Hand above shoulder)
    t3 = mock_track_with_pose(3, "reaching")
    events = engine.process_frame(np.zeros((100,100,3)), [t3])
    print(f"Reaching Events: {[e.title for e in events]}")
    assert any("Interest" in e.title for e in events), "Reaching Interest not detected"
    
    print("\nSUCCESS: All pose logic tests passed.")

if __name__ == "__main__":
    test_concealment()
