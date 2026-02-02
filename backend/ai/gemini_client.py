"""
Gemini AI Integration for ZIVA Assistant
"""
import os
import logging
from typing import Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)

class ZivaAI:
    """ZIVA - Zentinel Intelligence Virtual Assistant"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment")
            self.model = None
            return
            
        try:
            genai.configure(api_key=self.api_key)
            # Upgraded to Flash for lower latency and better reasoning
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            
            # System context for ZIVA
            self.system_context = """You are ZIVA (Zentinel Intelligence Virtual Assistant), 
            a tactical AI assistant for a surveillance and security platform called ZentinelOS.
            
            You assist drone operators, security personnel, and CCTV managers with:
            - Real-time threat assessment
            - Object detection analysis
            - System status monitoring
            - Tactical recommendations
            
            Your responses should be:
            - Concise and professional (2-3 sentences max)
            - Security-focused and tactical
            - Use military/intelligence terminology when appropriate
            - Be helpful but maintain a serious, professional tone
            
            Current system capabilities:
            - YOLOv8 object detection (people, vehicles, boats)
            - Real-time tracking with persistent IDs
            - Zone-based intrusion detection
            - WebSocket live updates
            """
            
            logger.info("ZIVA AI initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self.model = None
    
    async def chat(self, message: str, context: Optional[dict] = None) -> str:
        """Send a message to ZIVA and get response"""
        if not self.model:
            return "ZIVA AI is currently offline. Gemini API key not configured."
        
        try:
            # Build context-aware prompt
            context_str = ""
            if context:
                context_str = f"\n\nCurrent System Status:\n"
                context_str += f"- Active Tracks: {context.get('active_tracks', 0)}\n"
                context_str += f"- System Status: {context.get('system_status', 'unknown')}\n"
                context_str += f"- Detected Objects: {context.get('detected_objects', [])}\n"
            
            full_prompt = f"{self.system_context}\n{context_str}\n\nUser: {message}\n\nZIVA:"
            
            response = self.model.generate_content(full_prompt)
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return f"ZIVA encountered an error: {str(e)}"

# Global instance
ziva = ZivaAI()
