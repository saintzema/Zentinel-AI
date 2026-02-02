from ultralytics import YOLO
import logging
import cv2
import numpy as np
from backend.core.config import settings
from backend.perception.tracker import CentroidTracker
from backend.perception.engines.sahi import AdvancedDetector
from backend.perception.engines.traffic import TrafficEngine
from backend.perception.engines.security import SecurityEngine
from backend.perception.engines.industrial import IndustrialEngine
from backend.perception.engines.mall_security import MallSecurityEngine
from backend.perception.engines.perimeter_security import PerimeterSecurityEngine

logger = logging.getLogger(__name__)

class MotionDetector:
    def __init__(self):
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(detectShadows=True)
        self.tracker = CentroidTracker(max_disappeared=45, max_distance=200)
        
    def track(self, frame):
        fg_mask = self.bg_subtractor.apply(frame)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        rects = []
        labels = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 500:
                x, y, w, h = cv2.boundingRect(contour)
                rects.append([x, y, x + w, y + h])
                labels.append("vehicle")
        
        tracks = self.tracker.update(rects, labels)
        return self.wrap_tracks(tracks, frame)

    def wrap_tracks(self, tracks, frame):
        class MotionResults:
            def __init__(self, tracks, orig_img):
                self.custom_tracks = tracks
                self.orig_img = orig_img
                self.boxes = []
                self.names = {0: "vehicle"}
            def plot(self, mode="default"):
                annotated = self.orig_img.copy()
                for t in self.custom_tracks:
                    x1, y1, x2, y2 = map(int, t['box'])
                    status = getattr(t, 'status', 'normal')
                    color = (0, 0, 255) if status == 'suspicious' else (0, 255, 0) if t['disappeared'] == 0 else (0, 165, 255)
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    label = f"OBJ_{t['id']} " + (f"[{status.upper()}]" if status != 'normal' else "")
                    cv2.putText(annotated, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                return annotated
        return MotionResults(tracks, frame)

class ObjectDetector:
    def __init__(self, model_path: str = settings.MODEL_PATH):
        logger.info(f"Loading Advanced YOLO model with SAHI support...")
        try:
            self.advanced_model = AdvancedDetector(model_path)
            # INCREASED PERSISTENCE: 40 frames memory, 200px max move
            self.tracker = CentroidTracker(max_disappeared=40, max_distance=200)
            self.names = self.advanced_model.model.names
            self.motion_detector = MotionDetector()
            
            # Engine Registry
            self.engines = {
                "traffic": TrafficEngine(),
                "security": SecurityEngine(),
                "industrial": IndustrialEngine(),
                "mall_cctv": MallSecurityEngine(),
                "perimeter": PerimeterSecurityEngine(),
                "general": None
            }
            self.active_engine = self.engines["general"]
            self.use_sahi = False
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise e

    def set_use_case(self, use_case: str):
        if use_case not in self.engines:
            logger.warning(f"Unknown use case: {use_case}")
            return

        logger.info(f"Activating engine: {use_case}")
        self.active_engine = self.engines[use_case]
        
        # Specialized Model Loading
        if use_case == "industrial":
            self.use_sahi = True
            logger.info("Industrial Mode: SAHI Enabled")
        elif use_case == "mall_cctv":
            self.use_sahi = False
            # Load Pose Model if not already loaded
            if not str(self.advanced_model.model.ckpt_path).endswith("-pose.pt"):
                 logger.info("Mall Mode: Loading Pose Estimation Model...")
                 self.advanced_model = AdvancedDetector("yolov8n-pose.pt")
        else:
            self.use_sahi = False
            # Revert to standard model if currently using pose
            if str(self.advanced_model.model.ckpt_path).endswith("-pose.pt"):
                logger.info("Reverting to Standard Object Detection Model...")
                self.advanced_model = AdvancedDetector("yolov8n.pt")
            self.use_sahi = False

    def track(self, frame, conf: float = settings.CONFIDENCE_THRESHOLD, mode="yolo"):
        if mode == "motion":
            return self.motion_detector.track(frame)
            
        try:
            results = self.advanced_model.predict(frame, use_slicing=self.use_sahi, conf=conf)
            
            # Process with custom tracker to maintain IDs
            rects = []
            labels = []
            
            # results might be YOLO native or SAHI wrapper
            if hasattr(results, 'boxes') and results.boxes:
                for box in results.boxes:
                    b = box.xyxy[0].cpu().numpy()
                    cls = int(box.cls[0])
                    label = self.names[cls]
                    
                    # Strict filtering for Mall Mode (People Only)
                    if self.active_engine and getattr(self.active_engine, 'name', '') == 'Mall_Protector_V1':
                        if label != 'person':
                            continue

                    rects.append(b)
                    labels.append(label)
            elif hasattr(results, 'custom_tracks'):
                # Already tracked by SAHI or motion, just pass through
                return results

            tracks = self.tracker.update(rects, labels)
            
            # Match keypoints to tracks if available
            if hasattr(results, 'keypoints') and results.keypoints is not None:
                raw_kpts = results.keypoints.data.cpu().numpy() # [N, 17, 3] (x,y,conf)
                # Map based on index since rects were appended in order
                # NOTE: This assumes CentroidTracker didn't reorder too much, but it creates new track objects.
                # We need to map raw_rects[i] -> tracks.
                
                # A simple distance match is safer since tracker might drop/add
                for track in tracks:
                    tx, ty = track['centroid']
                    best_dist = 9999
                    best_idx = -1
                    
                    for i, rect in enumerate(rects):
                        rx = (rect[0] + rect[2]) / 2
                        ry = (rect[1] + rect[3]) / 2
                        dist = ((tx-rx)**2 + (ty-ry)**2)**0.5
                        if dist < best_dist:
                            best_dist = dist
                            best_idx = i
                    
                    if best_idx != -1 and best_dist < 50: # Threshold
                        if best_idx < len(raw_kpts):
                            track['keypoints'] = raw_kpts[best_idx]
            
            class TrackingResults:
                def __init__(self, tracks, orig_img, names):
                    self.custom_tracks = tracks
                    self.orig_img = orig_img
                    self.names = names
                    self.boxes = [] 
                def plot(self, mode="default"):
                    # Check if B&W mode requested (Mall Security)
                    if mode == "mall_cctv":
                        gray = cv2.cvtColor(self.orig_img, cv2.COLOR_BGR2GRAY)
                        # High contrast adaptation
                        gray = cv2.equalizeHist(gray)
                        annotated = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
                    else:
                        annotated = self.orig_img.copy()

                    for t in self.custom_tracks:
                        x1, y1, x2, y2 = map(int, t['box'])
                        status = t.get('status', 'normal')
                        
                        # --- MALL CCTV: FORENSIC STATUS BARS ---
                        if mode == "mall_cctv":
                            # Action State (Walking vs Standing)
                            action = getattr(t, 'action', 'Standing')
                            is_concealing = getattr(t, 'action', '') == 'Concealing'
                            
                            # Draw Skeleton & "Filled Mask" Simulation
                            if 'keypoints' in t and t['keypoints'] is not None:
                                kpts = t['keypoints']
                                if len(kpts) >= 13:
                                    # Simulate Semantic Mask: Polygon (L_Shoulder -> R_Shoulder -> R_Hip -> L_Hip)
                                    # Use safe indexing with bounds check
                                    def get_pt(idx): return [int(kpts[idx][0]), int(kpts[idx][1])]
                                    
                                    # Create "Body Core" polygon
                                    if kpts[5][2] > 0.5 and kpts[6][2] > 0.5 and kpts[12][2] > 0.5 and kpts[11][2] > 0.5:
                                        pts = np.array([get_pt(5), get_pt(6), get_pt(12), get_pt(11)], np.int32)
                                        pts = pts.reshape((-1, 1, 2))
                                        
                                        # Overlay filled shape
                                        overlay = annotated.copy()
                                        mask_color = (255, 0, 255) # Magenta
                                        cv2.fillPoly(overlay, [pts], mask_color)
                                        cv2.addWeighted(overlay, 0.4, annotated, 0.6, 0, annotated) # 40% opacity

                                    # Draw Bones (Multi-Color Forensic Mode)
                                    skeleton_limbs = [
                                        # (p1, p2, color_bgr)
                                        (5,7, (255, 100, 0)), (7,9, (255, 100, 0)), # Left Arm (Blueish)
                                        (6,8, (0, 255, 255)), (8,10, (0, 255, 255)), # Right Arm (Yellow)
                                        (5,6, (255, 0, 255)), # Shoulders (Magenta)
                                        (5,11, (255, 0, 255)), (6,12, (255, 0, 255)), # Torso
                                        (11,12, (255, 0, 255)), # Hips
                                        (11,13, (0, 255, 0)), (13,15, (0, 255, 0)), # Left Leg (Green)
                                        (12,14, (0, 100, 255)), (14,16, (0, 100, 255)) # Right Leg (Orange)
                                    ]
                                    
                                    for p1, p2, b_color in skeleton_limbs:
                                        if p1 < len(kpts) and p2 < len(kpts):
                                            pt1, pt2 = (int(kpts[p1][0]), int(kpts[p1][1])), (int(kpts[p2][0]), int(kpts[p2][1]))
                                            if kpts[p1][2] > 0.4 and kpts[p2][2] > 0.4:
                                                cv2.line(annotated, pt1, pt2, b_color, 2)
                                                # Draw joints
                                                cv2.circle(annotated, pt1, 3, (255, 255, 255), -1)
                                                cv2.circle(annotated, pt2, 3, (255, 255, 255), -1)

                            # Bounding Box
                            color = (0, 0, 255) if is_concealing else (0, 255, 0)
                            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

                            # Status Bars (Right of Box)
                            bar_x = x2 + 5
                            bar_w = 160
                            bar_h = 25
                            
                            # 1. State Bar (Walking/Standing)
                            cv2.rectangle(annotated, (bar_x, y1), (bar_x+bar_w, y1+bar_h), (255, 0, 0), -1) # Blue
                            cv2.putText(annotated, f"{action}: 95%", (bar_x+5, y1+18), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

                            # 2. Normal/Safety Bar
                            cv2.rectangle(annotated, (bar_x, y1+30), (bar_x+bar_w, y1+30+bar_h), (0, 180, 0), -1) # Green
                            cv2.putText(annotated, "Normal: 80%", (bar_x+5, y1+48), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

                            # 3. Alert Bar (Only if concealing)
                            if is_concealing:
                                cv2.rectangle(annotated, (bar_x, y1+60), (bar_x+bar_w, y1+60+bar_h), (0, 0, 255), -1) # Red
                                cv2.putText(annotated, "Item in pocket!", (bar_x+5, y1+78), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

                        # --- STANDARD VISUALIZATION ---
                        else:
                            # RED for suspicious, GREEN for active, ORANGE for disappearing
                            if status == 'suspicious':
                                color = (0, 0, 255)
                            else:
                                color = (16, 185, 129) if t['disappeared'] == 0 else (245, 158, 11) 
                                
                            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                            
                            # Draw Skeleton if keypoints exist
                            if 'keypoints' in t and t['keypoints'] is not None:
                                kpts = t['keypoints']
                                # Define limits based on number of keypoints (17 for COCO)
                                if len(kpts) >= 11:
                                    # Limbs connections: (index1, index2)
                                    skeleton = [
                                        (5,7), (7,9), # Left Arm
                                        (6,8), (8,10), # Right Arm
                                        (5,6), # Shoulders
                                        (5,11), (6,12), # Torso sides
                                        (11,12) # Hips
                                    ]
                                    for p1, p2 in skeleton:
                                        if p1 < len(kpts) and p2 < len(kpts):
                                            pt1 = (int(kpts[p1][0]), int(kpts[p1][1]))
                                            pt2 = (int(kpts[p2][0]), int(kpts[p2][1]))
                                            # Draw if confidence > 0.5
                                            if kpts[p1][2] > 0.5 and kpts[p2][2] > 0.5:
                                                cv2.line(annotated, pt1, pt2, color, 2)

                            # Standard Label
                            label = f"{t.get('label','OBJ')} ID:{t['id']}"
                            if status == 'suspicious': label += " [SUSPICIOUS]"
                            cv2.putText(annotated, label, (x1, y1 - 10), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                    return annotated

            return TrackingResults(tracks, frame, self.names)

        except Exception as e:
            logger.error(f"Advanced tracking failed: {e}")
            return self.motion_detector.track(frame)

