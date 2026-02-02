import logging
from backend.core.models import Track, Event
from backend.perception.engines.mall_security import MallSecurityEngine
from unittest.mock import MagicMock
import time

def test_mall_security_reaching_detection():
    engine = MallSecurityEngine()
    
    # Mock track with reaching pose (Wrist above shoulder)
    # Keypoints: 5=L_Shoulder, 7=L_Elbow, 9=L_Wrist, ...
    # Y increases downwards. Smaller Y = Higher.
    
    mock_track = MagicMock(spec=Track)
    mock_track.id = 1
    mock_track.persistent_id = "person001"
    mock_track.label = "person"
    mock_track.bbox = (100, 100, 200, 300)
    mock_track.status = "active"
    
    # [x, y, conf]
    # L_Shoulder at y=150, L_Wrist at y=100 (Reaching Up)
    kpts = [
        [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], # 0-4
        [150, 150, 0.9], # 5 L_Shoulder
        [160, 150, 0.9], # 6 R_Shoulder
        [0,0,0], [0,0,0], # 7-8 Elbows
        [150, 100, 0.9], # 9 L_Wrist (Reaching UP!)
        [160, 200, 0.9], # 10 R_Wrist (Down)
    ]
    # Fill rest to avoid index error
    while len(kpts) < 17:
        kpts.append([0,0,0])
        
    mock_track.keypoints = kpts
    
    # Process Frame
    frame = MagicMock()
    events = engine.process_frame(frame, [mock_track])
    
    # Check if suspicious status was set
    assert mock_track.status == "suspicious"
    assert mock_track.action == "reaching"
    
    # Check if event was generated
    assert len(events) >= 1
    assert "Suspicious Action: Reaching" in events[0].title
    print("Pose Estimation Verification: SUCCESS")

if __name__ == "__main__":
    test_mall_security_reaching_detection()
