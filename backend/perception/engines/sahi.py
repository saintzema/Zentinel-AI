import numpy as np
import cv2
from typing import List, Dict, Any, Optional, Tuple
from ultralytics import YOLO
import logging

logger = logging.getLogger(__name__)

class SlicingDetector:
    """
    SAHI-inspired implementation for high-precision detection on small objects.
    Slices the image into overlapping patches, runs inference on each, 
    and merges the results.
    """
    
    def __init__(self, model: YOLO, slice_size: int = 640, overlap: float = 0.2):
        self.model = model
        self.slice_size = slice_size
        self.overlap = overlap

    def detect(self, img: np.ndarray, conf: float = 0.25) -> List[Dict[str, Any]]:
        h, w = img.shape[:2]
        all_results = []
        
        # Calculate stride
        stride = int(self.slice_size * (1 - self.overlap))
        
        slices = []
        coords = []
        
        # 1. Generate slices
        for y in range(0, h - self.slice_size + stride, stride):
            for x in range(0, w - self.slice_size + stride, stride):
                # Clamp to image boundaries
                y_end = min(y + self.slice_size, h)
                x_end = min(x + self.slice_size, w)
                y_start = max(0, y_end - self.slice_size)
                x_start = max(0, x_end - self.slice_size)
                
                slice_img = img[y_start:y_end, x_start:x_end]
                slices.append(slice_img)
                coords.append((x_start, y_start))

        # 2. Run inference in batches if possible, or sequentially
        # For simplicity, we run a single call if chunks are small, 
        # but for performance we should batch.
        results = self.model(slices, conf=conf, verbose=False)
        
        # 3. Project results back to original image space
        projected_boxes = []
        for i, res in enumerate(results):
            x_off, y_off = coords[i]
            if res.boxes:
                for box in res.boxes:
                    b = box.xyxy[0].cpu().numpy()
                    cls = int(box.cls[0])
                    score = float(box.conf[0])
                    
                    # Project box
                    projected_boxes.append({
                        'bbox': [b[0] + x_off, b[1] + y_off, b[2] + x_off, b[3] + y_off],
                        'class': cls,
                        'confidence': score,
                        'label': self.model.names[cls]
                    })

        # 4. Non-Maximum Suppression (NMS) on projected boxes
        merged_results = self._nms(projected_boxes, iou_threshold=0.5)
        
        return merged_results

    def _nms(self, boxes: List[Dict], iou_threshold: float) -> List[Dict]:
        if not boxes:
            return []
            
        # Convert to numpy format for cv2.dnn.NMSBoxes
        bboxes = [b['bbox'] for b in boxes]
        xywh_boxes = [[b[0], b[1], b[2]-b[0], b[3]-b[1]] for b in bboxes]
        scores = [b['confidence'] for b in boxes]
        
        indices = cv2.dnn.NMSBoxes(xywh_boxes, scores, score_threshold=0.0, nms_threshold=iou_threshold)
        
        if len(indices) == 0:
            return []
            
        return [boxes[i] for i in indices.flatten()]

class AdvancedDetector:
    """Wrapper that combines standard inference and SAHI optionally"""
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
        self.slicer = SlicingDetector(self.model)

    def predict(self, frame: np.ndarray, use_slicing: bool = False, conf: float = 0.25):
        if not use_slicing:
            return self.model(frame, conf=conf, verbose=False)[0]
        
        # Run SAHI
        sahi_results = self.slicer.detect(frame, conf=conf)
        return self._wrap_sahi_results(sahi_results, frame)

    def _wrap_sahi_results(self, results: List[Dict], frame: np.ndarray):
        """Convert SAHI dicts into a structure compatible with the orchestrator"""
        class SAHIWrapper:
            def __init__(self, results, orig_img, names):
                self.custom_tracks = []
                self.orig_img = orig_img
                self.names = names
                self.boxes = [] # Placeholder to avoid index errors
                
                for i, r in enumerate(results):
                    self.custom_tracks.append({
                        'box': r['bbox'],
                        'label': r['label'],
                        'id': i + 1000, # Offset to avoid collision with standard tracker IDs
                        'disappeared': 0,
                        'centroid': [int((r['bbox'][0]+r['bbox'][2])/2), int((r['bbox'][1]+r['bbox'][3])/2)]
                    })
            
            def plot(self):
                # Custom plotting for SAHI results
                annotated = self.orig_img.copy()
                for t in self.custom_tracks:
                    x1, y1, x2, y2 = map(int, t['box'])
                    status = t.get('status', 'normal')
                    color = (0, 0, 255) if status == 'suspicious' else (0, 255, 255) # Red if sus, else Cyan
                    
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    label = f"SAHI:{t['label']}"
                    if status == 'suspicious': label += " [SUSPICIOUS]"
                    
                    cv2.putText(annotated, label, (x1, y1-10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                return annotated

        return SAHIWrapper(results, frame, self.model.names)
