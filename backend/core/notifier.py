import logging
import json
from typing import Dict, Any, Optional
from backend.core.models import Event

logger = logging.getLogger(__name__)

class NotificationRouter:
    """
    Routes intelligence events to different channels based on severity 
    and configuration.
    """
    def __init__(self):
        self.channels = {
            'dashboard': True,
            'email': True, # Mock
            'slack': True # Mock
        }

    def notify(self, event: Event):
        """Dispatches event to active channels"""
        # 1. Dashboard is always notified via WebSocket (handled by Orchestrator)
        
        # 2. Email Notification (Mock)
        if self.channels['email'] and event.severity in ['warning', 'critical']:
            self._send_email_mock(event)
            
        # 3. Slack Notification (Mock)
        if self.channels['slack'] and event.severity == 'critical':
            self._send_slack_mock(event)

    def _send_email_mock(self, event: Event):
        logger.info(f" [EMAIL SENT] To: security-ops@zentinel.ai | Subject: {event.severity.upper()}: {event.title}")
        # print(f"Email Content: {event.description}")

    def _send_slack_mock(self, event: Event):
        message = {
            "channel": "#alerts",
            "username": "ZIVA_SENTRY",
            "text": f"*[{event.severity.upper()}]* {event.title}\n{event.description}",
            "icon_emoji": ":shield:"
        }
        logger.info(f" [SLACK SENT] Payload: {json.dumps(message)}")

# Global notifier instance
notifier = NotificationRouter()
