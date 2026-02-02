import numpy as np
import cv2
from ultralytics import YOLO
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from backend.perception.engines.sahi import AdvancedDetector
from backend.perception.detector import ObjectDetector

def test_sahi_loop():
    print("--- TESTING SAHI SLICING ---")
    # Use a dummy frame
    frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
    cv2.putText(frame, "TEST_OBJECT", (100, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    
    # Check if model exists
    model_path = "yolov8n.pt" # Default
    if not os.path.exists(model_path):
        print(f"Downloading {model_path}...")
        YOLO(model_path) # Auto-download
    
    detector = AdvancedDetector(model_path)
    
    print("Running standard prediction...")
    res_std = detector.predict(frame, use_slicing=False)
    print(f"Standard results: {len(res_std.boxes) if res_std.boxes else 0} objects")
    
    print("Running SAHI prediction...")
    res_sahi = detector.predict(frame, use_slicing=True)
    print(f"SAHI results: {len(res_sahi.custom_tracks)} objects")
    
    print("Testing Engine Switching...")
    obj_detector = ObjectDetector(model_path)
    
    obj_detector.set_use_case("industrial")
    print(f"Industrial case use_sahi: {obj_detector.use_sahi} (Expected: True)")
    
    obj_detector.set_use_case("traffic")
    print(f"Traffic case use_sahi: {obj_detector.use_sahi} (Expected: False)")
    
    print("--- VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    test_sahi_loop()
