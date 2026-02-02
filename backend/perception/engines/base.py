from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import numpy as np
from backend.core.models import Track, Event

class IntelligenceEngine(ABC):
    """
    Abstract Base Class for all specialized intelligence engines.
    An engine takes processed tracks and images, then applies expert rules 
    to generate high-level insights and alerts.
    """
    
    def __init__(self, name: str):
        self.name = name
        self.config = {}
        self.state = {}

    @abstractmethod
    def process_frame(self, frame: np.ndarray, tracks: List[Track]) -> List[Event]:
        """
        Main entry point for frame-level analysis.
        Returns a list of high-level events detected in this frame.
        """
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """
        Returns the current internal status/metrics of the engine.
        """
        pass

    def reset(self):
        """Reset internal state (e.g., counters, history)"""
        self.state = {}
