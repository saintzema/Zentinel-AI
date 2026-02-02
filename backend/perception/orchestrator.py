import asyncio
import logging
import cv2
import threading
import time
import hashlib
import numpy as np
from typing import List, Optional, Dict, Tuple
from collections import defaultdict
from backend.perception.sensor import VideoSensor, VideoSensorConfig, SensorPool
from backend.perception.detector import ObjectDetector
from backend.perception.zones import ZoneEngine
from backend.core.models import Track, Zone, Event
from backend.core.notifier import notifier
from backend.core.config import settings
import os

logger = logging.getLogger(__name__)

class IndustrialTracker:
    """Industrial-grade object tracking with persistent IDs and locking"""
    def __init__(self):
        self.object_registry: Dict[int, Dict] = {}  # track_id -> object info
        self.next_persistent_id = 1
        self.class_counters = defaultdict(int)  # class -> count
        self.locked_objects = set()  # Currently locked objects
        self.last_announcement = {}  # track_id -> last announcement time
        self.position_history: Dict[int, List[Tuple[float, float, float]]] = {}  # track_id -> [(x, y, time)]
        
    def register_object(self, track: Track) -> str:
        """Register or update object with persistent ID"""
        current_time = time.time()
        
        if track.id not in self.object_registry:
            # New object detected
            class_name = track.label.lower()
            self.class_counters[class_name] += 1
            persistent_id = f"{class_name}{self.class_counters[class_name]:03d}"
            
            self.object_registry[track.id] = {
                'persistent_id': persistent_id,
                'class': track.label,
                'first_seen': current_time,
                'last_seen': current_time,
                'detection_count': 1,
                'confidence_history': [track.confidence],
                'avg_confidence': track.confidence,
                'status': 'active',
                'lock_strength': 0.0,
                'last_bbox': track.bbox
            }
            
            # Initialize position history
            bbox_center = ((track.bbox[0] + track.bbox[2]) / 2, (track.bbox[1] + track.bbox[3]) / 2)
            self.position_history[track.id] = [(bbox_center[0], bbox_center[1], current_time)]
            
            return persistent_id
        else:
            # Update existing object
            obj = self.object_registry[track.id]
            obj['last_seen'] = current_time
            obj['detection_count'] += 1
            obj['confidence_history'].append(track.confidence)
            obj['confidence_history'].append(track.confidence)
            obj['avg_confidence'] = sum(obj['confidence_history'][-10:]) / min(len(obj['confidence_history']), 10)
            obj['last_bbox'] = track.bbox  # Store for coasting
            
            # Update position history
            bbox_center = ((track.bbox[0] + track.bbox[2]) / 2, (track.bbox[1] + track.bbox[3]) / 2)
            if track.id in self.position_history:
                self.position_history[track.id].append((bbox_center[0], bbox_center[1], current_time))
                # Keep only last 20 positions
                if len(self.position_history[track.id]) > 20:
                    self.position_history[track.id] = self.position_history[track.id][-20:]
            
            # Increase lock strength for consistent detections
            if obj['detection_count'] > 3:
                obj['lock_strength'] = min(obj['lock_strength'] + 0.05, 1.0)
                if obj['lock_strength'] > 0.7 and track.id not in self.locked_objects:
                    self.locked_objects.add(track.id)
                    obj['status'] = 'locked'
                    
            return obj['persistent_id']
    
    def should_announce(self, track_id: int) -> bool:
        """Check if object should be announced"""
        current_time = time.time()
        if track_id not in self.last_announcement:
            self.last_announcement[track_id] = current_time
            return True
        
        # Don't announce if recently announced (30 seconds) or object is locked
        if current_time - self.last_announcement[track_id] < 30:
            return False
            
        if track_id in self.locked_objects:
            return False
            
        self.last_announcement[track_id] = current_time
        return True
    
    def cleanup_lost_objects(self, current_time: float):
        """Remove objects that haven't been seen for a while"""
        lost_objects = []
        for track_id, obj in self.object_registry.items():
            if current_time - obj['last_seen'] > 5.0:  # 5 seconds timeout
                lost_objects.append(track_id)
        
        for track_id in lost_objects:
            del self.object_registry[track_id]
            if track_id in self.position_history:
                del self.position_history[track_id]
            if track_id in self.locked_objects:
                self.locked_objects.remove(track_id)
            if track_id in self.last_announcement:
                del self.last_announcement[track_id]

class PerceptionOrchestrator:
    def __init__(self):
        self.active = False
        self.sensor: Optional[VideoSensor] = None
        self.detector = ObjectDetector()
        self.zone_engine = ZoneEngine()
        self.tracker = IndustrialTracker()
        
        # Initialize placeholder frame (Green loading text)
        self.blank_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        cv2.putText(self.blank_frame, "SYSTEM INITIALIZING...", (50, 360), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        self.latest_frame = self.blank_frame
        self.lock = threading.Lock()
        self.last_events: List[Event] = []
        self.tracks: List[Track] = []
        self._callback = None
        self.recording = False
        self.recording_data = []
        self.frame_count = 0
        self.current_source = "0"
        self.last_track_broadcast = 0
        
        # Caching for smooth simulation
        self.skip_counter = 0
        self.cached_results = None
        self.latest_frame_bytes = None
        self.sensor_pool: Optional[SensorPool] = None
        self.is_pool_active = False
        
        # Available devices for MVP
        self.devices = [
            {"id": "0", "name": "Primary Station Webcam", "type": "webcam", "status": "online"},
            {"id": "drone_01", "name": "Drone Sentinel 01", "type": "drone", "status": "online", "lat": 6.5244, "lng": 3.3792},
            {"id": "drone_02", "name": "Drone Sentinel 02", "type": "drone", "status": "online", "lat": 6.5264, "lng": 3.3812},
            {"id": "cctv_01", "name": "CCTV Perimeter Alpha", "type": "cctv", "status": "online"},
            {"id": "cctv_02", "name": "CCTV Perimeter Beta", "type": "cctv", "status": "standby"}
        ]
        self.active_device_id = "0"
        self.use_case = "general"

    async def switch_use_case(self, use_case: str):
        """Switch the AI intelligence model/engine"""
        logger.info(f"Switching intelligence engine to: {use_case}")
        self.use_case = use_case
        self.detector.set_use_case(use_case)
        return {"status": "engine_switched", "use_case": use_case}

    def get_latest_frame(self):
        """Returns the latest processed frame (annotated) as JPEG bytes."""
        with self.lock:
            if self.latest_frame_bytes is not None:
                return self.latest_frame_bytes
                
            if self.latest_frame is None:
                # Re-initialize blank frame if needed or return existing
                if not hasattr(self, 'blank_frame'):
                    self.blank_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
                    cv2.putText(self.blank_frame, "SYSTEM INITIALIZING...", (50, 360), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                
                _, buffer = cv2.imencode('.jpg', self.blank_frame)
                return buffer.tobytes()
                
            _, buffer = cv2.imencode('.jpg', self.latest_frame)
            return buffer.tobytes()

    async def start(self, source: str = "0", simulation: bool = False):
        """Start the perception loop"""
        if self.active:
            self.stop()
            time.sleep(0.5)
        
        self.simulation = simulation
        
        # Reset state
        self.simulator = None
        self.skip_counter = 0
        self.cached_results = None
        self.latest_frame_bytes = None
        
        # Determine source
        
        if os.path.isfile(source):
            logger.info(f"Using file source: {source}")
            config = VideoSensorConfig(source=source, name="FileAnalysis")
            self.sensor = VideoSensor(config)
            if not self.sensor.connect():
                logger.error("Failed to connect to file sensor")
                return
        elif source.startswith("pool:"):
            logger.info(f"Starting Sensor Pool: {source}")
            sources = source.replace("pool:", "").split(",")
            sensors = []
            for s in sources:
                cfg = VideoSensorConfig(source=s.strip(), name=f"CAM_{s.strip()}")
                sensors.append(VideoSensor(cfg))
            
            self.sensor_pool = SensorPool(sensors)
            if not self.sensor_pool.connect_all():
                logger.error("Failed to connect all sensors in pool")
                return
            self.is_pool_active = True
        else:
            # Default to primary sensor (Webcam)
            logger.info(f"Using primary source: {source}")
            config = VideoSensorConfig(source=source, name="Primary")
            self.sensor = VideoSensor(config)
            if not self.sensor.connect():
                logger.error("Failed to connect to sensor")
                return

        self.active = True
        self.frame_count = 0
        self.current_source = source
        self.active_device_id = source if source in [d['id'] for d in self.devices] else "0"
        threading.Thread(target=self._loop, daemon=True).start()
        logger.info(f"Perception loop started (Source: {source}, Simulation: {self.simulation})")

    async def switch_source(self, device_id: str):
        """Switch active surveillance source"""
        logger.info(f"Switching source to: {device_id}")
        
        # In a real app, this would change the sensor config
        # For MVP, if it's a drone or CCTV, we might simulate it using a file or mock
        # If it's "0", use webcam
        source = device_id
        is_sim = False
        
        if device_id.startswith("drone") or device_id.startswith("cctv") or device_id == 'mall_cctv':
            # Mock switching by using a demo file if available
            is_sim = True
            
            # MALL SECURITY SPECIAL: Use the specific theft demo file
            if device_id == 'mall_cctv':
                if os.path.exists("mall_theft.mp4"):
                    source = "mall_theft.mp4"
                    logger.info("Orchestrator: Loaded mall_theft.mp4 for simulation")
                elif os.path.exists("backend/data/mall_theft.mp4"):
                    source = "backend/data/mall_theft.mp4"

            # if os.path.exists("backend/data/demo.mp4"):
            #    source = "backend/data/demo.mp4"
            
        await self.start(source=source, simulation=is_sim)
        self.active_device_id = device_id
        return {"status": "switched", "device_id": device_id}

    def stop(self):
        self.active = False
        if self.sensor:
            self.sensor.disconnect()

    def set_callback(self, callback):
        self._callback = callback

    def _loop(self):
        import numpy as np
        while self.active:
            start_time = time.time()
            
            current_tracks = []
            frame_shape = (1080, 1920, 3) # Default for sim

            # 1. Source Acquisition (Single vs Pool)
            if self.is_pool_active and self.sensor_pool:
                batch = self.sensor_pool.get_next_batch(batch_size=4)
                if not batch:
                    time.sleep(0.1); continue
                
                # Create Grid (2x2 if possible)
                frames = [f for _, f in batch]
                names = [n for n, _ in batch]
                
                # Pad to 4 if less
                while len(frames) < 4:
                    frames.append(np.zeros_like(frames[0]))
                    names.append("NO_SIGNAL")
                
                # Resize all to 640x360 for consistent grid
                resized = []
                for i, f in enumerate(frames):
                    r = cv2.resize(f, (640, 360))
                    cv2.putText(r, names[i], (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    resized.append(r)
                
                top = np.hstack((resized[0], resized[1]))
                bottom = np.hstack((resized[2], resized[3]))
                frame = np.vstack((top, bottom))
            else:
                # Real Source (Webcam OR Uploaded File)
                ret, frame = self.sensor.read()
                if not ret:
                    time.sleep(0.1); continue
            
            # --- SENIOR ARCHITECTURE: DUAL-STREAM RENDERING ---
            # Stream 1: High-Res Display Frame (720p)
            display_frame = cv2.resize(frame, (1280, 720))
            
            # Stream 2: AI Proxy Frame (Sub-sampled for speed, 480p)
            ai_proxy = cv2.resize(display_frame, (854, 480))
            
            # Coordinate Scale Factor (AI -> Display)
            scale_x = 1280 / 854
            scale_y = 720 / 480
            
            frame_shape = display_frame.shape
            self.frame_count += 1

            # 2. Detect & Track
            try:
                # Choose detection mode: Always use YOLO/Advanced unless legacy motion requested intentionally
                # Fix for V2.2: Simulation should test the REAL model (Pose/YOLO), not just motion blobs.
                mode = "yolo" 
                
                # --- SIMULATION OPTIMIZATION: DECOUPLED RENDERING ---
                should_run_ai = True
                if self.simulation:
                    self.skip_counter += 1
                    # Run AI every 8th frame (approx 6-7 FPS) for smooth visual tracking
                    if self.skip_counter % 8 != 0 and self.cached_results:
                        should_run_ai = False

                if should_run_ai:
                    results = self.detector.track(ai_proxy, mode=mode)
                    
                    # SCALE COORDINATES back to Display Resolution (480p -> 720p)
                    if hasattr(results, 'custom_tracks'):
                        for t in results.custom_tracks:
                            x1, y1, x2, y2 = t['box']
                            t['box'] = [x1 * scale_x, y1 * scale_y, x2 * scale_x, y2 * scale_y]
                            if 'keypoints' in t and t['keypoints'] is not None:
                                t['keypoints'][:, 0] *= scale_x
                                t['keypoints'][:, 1] *= scale_y
                    
                    self.cached_results = results 
                
                # --- UNIFIED HIGH-RES RENDERING (HD Demo Mode) ---
                # Strategy: Always draw on 720p base even if AI used 480p proxy
                active_res = results if should_run_ai else self.cached_results
                annotated_frame = display_frame.copy()
                
                # Special FX: Forensic B&W Mode for Mall Security
                active_engine_name = getattr(self.detector.active_engine, 'name', 'general') if self.detector.active_engine else 'general'
                if active_engine_name == 'Mall_Protector_V1':
                     gray = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2GRAY)
                     gray = cv2.equalizeHist(gray) # Enhancement
                     annotated_frame = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
                
                current_tracks = []
                
                if active_res and hasattr(active_res, 'custom_tracks'):
                    for t in active_res.custom_tracks:
                        # 1. Update Persistent Object State
                        x1, y1, x2, y2 = t['box']
                        track_id = t['id']
                        
                        track = Track(
                            id=track_id, label=t['label'], confidence=0.95, 
                            bbox=(int(x1), int(y1), int(x2), int(y2)),
                            first_seen=time.time(), last_seen=time.time()
                        )
                        persistent_id = self.tracker.register_object(track)
                        track.persistent_id = persistent_id
                        track.status = self.tracker.object_registry[track_id]['status']
                        
                        # 2. Intelligence Event Broadcast (Only on AI updates)
                        # SILENCED: User reported excessive spam. Re-enable if needed for debugging.
                        # if should_run_ai and self.tracker.should_announce(track_id):
                        #     intelligence_event = Event(
                        #         id=f"intel-{int(time.time())}-{track.id}",
                        #         severity="info",
                        #         title=f"TARGET ACQUIRED",
                        #         description=f"Track {persistent_id} identified at ({int(x1)}, {int(y1)})",
                        #         track_id=track_id
                        #     )
                        #     self.last_events.append(intelligence_event)
                        #     if len(self.last_events) > 15: self.last_events.pop(0)
                        #     if self._callback: self._callback(intelligence_event)
                        
                        current_tracks.append(track)
                        
                        # 3. HIGH-RES TACTICAL DRAWING
                        color = (0, 0, 255) if track.status == 'suspicious' else (16, 185, 129)
                        if t['disappeared'] > 0: color = (245, 158, 11) # Orange lost
                        
                        # Crisp Boxes (Thickness 2 for HD)
                        cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        
                        # Draw Skeleton if keypoints exist (CRISP HD Lines)
                        if 'keypoints' in t and t['keypoints'] is not None:
                             kpts = t['keypoints']
                             if len(kpts) >= 11:
                                 skeleton = [(5,7), (7,9), (6,8), (8,10), (5,6), (5,11), (6,12), (11,12)]
                                 for p1, p2 in skeleton:
                                     if p1 < len(kpts) and p2 < len(kpts):
                                         pt1, pt2 = (int(kpts[p1][0]), int(kpts[p1][1])), (int(kpts[p2][0]), int(kpts[p2][1]))
                                         if kpts[p1][2] > 0.5 and kpts[p2][2] > 0.5:
                                             cv2.line(annotated_frame, pt1, pt2, color, 2)

                        label_text = f"{t['label'].upper()} {persistent_id}"
                        cv2.putText(annotated_frame, label_text, (int(x1), int(y1) - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
                # Cleanup lost objects and internal state
                if should_run_ai:
                    self.tracker.cleanup_lost_objects(time.time())
                
                self.tracks = current_tracks

                # 4. Expert Intelligence Analysis (Apply behavioral insights)
                if self.detector.active_engine:
                    try:
                        # Use display_frame (720p) for intelligence engine consistency
                        engine_events = self.detector.active_engine.process_frame(display_frame, current_tracks)
                        for event in engine_events:
                            logger.info(f"ENGINE EVENT: {event.title}")
                            self.last_events.append(event)
                            notifier.notify(event)
                            if self._callback: self._callback(event)
                    except Exception as ie:
                         logger.error(f"Intelligence Engine Error: {ie}")
                
                # 6. EMIT TELEMETRY (For tactical sidebar analysis)
                if self.simulation and self._callback and current_tracks:
                    telemetry_lines = []
                    for track in current_tracks:
                        x1, y1, x2, y2 = track.bbox
                        telemetry_lines.append(f"{int(x1)} {int(y1)} {int(x2-x1)} {int(y2-y1)}")
                    
                    self._callback({
                        "type": "telemetry",
                        "frame": self.frame_count,
                        "data": "\n".join(telemetry_lines)
                    })
                
                # Update latest frame with annotations
                # Convert to JPEG bytes at High Quality (Demo Grade)
                _, buffer = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
                frame_bytes = buffer.tobytes()

                with self.lock:
                    self.latest_frame = annotated_frame
                    self.latest_frame_bytes = frame_bytes

                # 7. Check Zones (Standard logic)
                for track in current_tracks:
                    event = self.zone_engine.check_track(track, frame_shape)
                    if event:
                        logger.warning(f"ZONE EVENT: {event.description}")
                        self.last_events.append(event)
                        if self._callback:
                            self._callback(event)

                # Update tracks for WebSocket broadcast - Use registry for persistence
                display_tracks = []
                now = time.time()
                for track_id, obj in self.tracker.object_registry.items():
                    # Show object if seen within last 1.0 seconds (Coasting)
                    if now - obj['last_seen'] < 1.0:
                        # Create Track object from registry
                        try:
                            t = Track(
                                id=track_id,
                                label=obj['class'],
                                confidence=obj['avg_confidence'],
                                bbox=obj.get('last_bbox', (0,0,0,0)),
                                last_seen=obj['last_seen'],
                                first_seen=obj['first_seen']
                            )
                            t.persistent_id = obj['persistent_id']
                            t.status = obj['status']
                            t.lock_strength = obj['lock_strength']
                            t.detection_count = obj['detection_count']
                            
                            # Mark as coasting if not seen in current frame
                            if now - obj['last_seen'] > 0.1:
                                t.status = 'lost' # Visual indicator for coasting
                            
                            display_tracks.append(t)
                        except Exception as e:
                           logger.error(f"Track creation error: {e}")
                
                self.tracks = display_tracks
                
                # OPTIMIZED: Centralized broadcast of tracks (every 100ms or 10 frames)
                current_time = time.time()
                if self._callback and (current_time - self.last_track_broadcast > 0.1):
                    if display_tracks:
                        tracks_data = [t.model_dump(mode='json') for t in display_tracks]
                        self._callback({"type": "tracks", "data": tracks_data})
                        self.last_track_broadcast = current_time

            except Exception as e:
                logger.error(f"Logic loop error: {e}")
                print(f"CRITICAL ORCHESTRATOR ERROR: {e}") # Explicit print for debugging
                import traceback
                traceback.print_exc()

            # FPS Limit (rough) - Skip throttle in simulation for max speed
            if not self.simulation:
                elapsed = time.time() - start_time
                if elapsed < 0.020: # ~50 FPS for better tracking
                    time.sleep(0.020 - elapsed)
            else:
                # Small sleep to prevent CPU 100% pegging and allow MJPEG thread breathing room
                time.sleep(0.001)
