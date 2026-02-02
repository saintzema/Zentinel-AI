import cv2
import time
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_mov_read(file_path):
    print(f"Testing read on: {file_path}")
    if not os.path.exists(file_path):
        print("File not found!")
        return

    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        print("Failed to open video capture.")
        return

    frame_count = 0
    max_frames = 100
    
    # Check properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    print(f"FPS: {fps}, Total Frames: {total_frames}")

    while frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            print(f"Frame read failed at index {frame_count}. Attempting loop...")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                print("Loop failed. Exiting.")
                break
            print("Loop successful.")
            
        if frame_count % 10 == 0:
            print(f"Read frame {frame_count} successfully.")
        
        frame_count += 1
        
    cap.release()
    print("Test complete.")

if __name__ == "__main__":
    test_mov_read("mall_cctv.mov")
