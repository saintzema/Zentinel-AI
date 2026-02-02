from abc import ABC, abstractmethod
import cv2
import time
import logging
from typing import Iterator, Tuple, Optional, Union

logger = logging.getLogger(__name__)

class SensorConfig(ABC):
    """Base configuration for sensors"""
    pass

class VideoSensorConfig(SensorConfig):
    def __init__(self, source: Union[str, int], name: str, fps_limit: int = 30, frame_skip: int = 0):
        self.source = source
        self.name = name
        self.fps_limit = fps_limit
        self.frame_skip = frame_skip  # Skip N frames between reads (for simulation speedup)

class BaseSensor(ABC):
    """Unified Sensor Interface"""
    
    def __init__(self, config: SensorConfig):
        self.config = config
        self.is_active = False

    @abstractmethod
    def connect(self) -> bool:
        """Establish connection to sensor"""
        pass

    @abstractmethod
    def disconnect(self):
        """Cleanly disconnect"""
        pass

    @abstractmethod
    def read(self) -> Optional[object]:
        """Read a single data point/frame"""
        pass

class VideoSensor(BaseSensor):
    """Handles Webcams, IP Cameras, and Video Files"""
    
    def __init__(self, config: VideoSensorConfig):
        super().__init__(config)
        self.cap = None
        self.config: VideoSensorConfig = config # Type hint
    
    def connect(self) -> bool:
        logger.info(f"Connecting to video sensor: {self.config.name} ({self.config.source})")
        if isinstance(self.config.source, str) and self.config.source.isdigit():
             # Handle string "0" for webcam
             self.cap = cv2.VideoCapture(int(self.config.source))
             self.is_webcam = True
        elif isinstance(self.config.source, int):
             self.cap = cv2.VideoCapture(self.config.source)
             self.is_webcam = True
        else:
             self.cap = cv2.VideoCapture(self.config.source)
             self.is_webcam = False
            
        if not self.cap.isOpened():
            logger.error(f"Failed to open video source: {self.config.source}")
            return False
            
        self.is_active = True
        return True

    def disconnect(self):
        if self.cap:
            self.cap.release()
        self.is_active = False
        logger.info(f"Disconnected from {self.config.name}")

    def read(self) -> Tuple[bool, Optional[object]]:
        if not self.is_active or not self.cap:
            return False, None
            
        ret, frame = self.cap.read()
        if not ret:
            # If it's a file (not webcam), loop it
            # Check if source is a file path (string and not digit)
            is_file = isinstance(self.config.source, str) and not self.config.source.isdigit()
            
            if is_file:
                logger.info(f"Looping video file: {self.config.source}")
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
                
                # Double check if seek worked, if not, re-open
                if not ret:
                     logger.warning("Seek failed, reloading video source...")
                     self.cap.release()
                     self.cap = cv2.VideoCapture(self.config.source)
                     ret, frame = self.cap.read()

            if not ret:
                 logger.warning(f"EOF or error reading from {self.config.name}")
                 # Don't kill active flag immediately in simulation, just return False to retry
                 # self.is_active = False 
                 return False, None
            
        # Mirror webcam (if source was an int/digit)
        if hasattr(self, 'is_webcam') and self.is_webcam:
            frame = cv2.flip(frame, 1)
            
        return True, frame

class SensorPool:
    """Manages multiple sensors as a pooled resource for batch processing"""
    
    def __init__(self, sensors: list[VideoSensor]):
        self.sensors = sensors
        self.current_idx = 0
        self.active_sensors = []
        
    def connect_all(self):
        for sensor in self.sensors:
            if sensor.connect():
                self.active_sensors.append(sensor)
        return len(self.active_sensors) > 0
        
    def disconnect_all(self):
        for sensor in self.active_sensors:
            sensor.disconnect()
        self.active_sensors.clear()
        
    def get_next_batch(self, batch_size: int = 4) -> list[Tuple[str, object]]:
        """Returns a list of (sensor_name, frame) tuples for batch AI processing"""
        batch = []
        if not self.active_sensors:
            return batch
            
        # Round-robin selection or just all of them
        for _ in range(min(batch_size, len(self.active_sensors))):
            sensor = self.active_sensors[self.current_idx]
            ret, frame = sensor.read()
            if ret:
                batch.append((sensor.config.name, frame))
            
            self.current_idx = (self.current_idx + 1) % len(self.active_sensors)
            
        return batch

