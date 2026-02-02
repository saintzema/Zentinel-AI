from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File
from typing import List, Optional
from backend.core.models import Zone, Event, Track
from backend.perception.orchestrator import PerceptionOrchestrator
import json
import os
import time
import asyncio
import queue
from datetime import datetime
from pydantic import BaseModel, Field
from loguru import logger

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

# Global orchestrator instance (simple singleton for MVP)
orchestrator = PerceptionOrchestrator()

class ConnectionManager:
    """Manages WebSocket connections"""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.message_queue = queue.Queue()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                # If sending fails, we'll handle it during the heartbeat/disconnect
                pass

    def send_to_queue(self, message: dict):
        """Thread-safe method to queue messages for broadcast"""
        self.message_queue.put(message)

    async def process_queue(self):
        """Background task to process the message queue and broadcast"""
        while True:
            try:
                # Use non-blocking get to allow other async tasks to run
                while not self.message_queue.empty():
                    message = self.message_queue.get_nowait()
                    await self.broadcast(message)
                    self.message_queue.task_done()
            except Exception as e:
                print(f"Queue processing error: {e}")
            
            await asyncio.sleep(0.01) # Small sleep to prevent tight loop

manager = ConnectionManager()

# Callback for orchestrator to push events and telemetry
def system_callback(payload):
    """Synchronous callback that pushes to the thread-safe queue"""
    if hasattr(payload, 'model_dump'):
        # It's an Event or other Pydantic model
        manager.send_to_queue({"type": "event", "data": payload.model_dump(mode='json')})
    else:
        # It's a raw dict (like telemetry)
        manager.send_to_queue(payload)

orchestrator.set_callback(system_callback)

# Start queue processor background task
@router.on_event("startup")
async def startup_event():
    asyncio.create_task(manager.process_queue())

@router.post("/start")
async def start_perception(source: str = "0", simulation: bool = False):
    await orchestrator.start(source, simulation)
    return {"status": "started", "source": source, "simulation": simulation}

@router.post("/stop")
async def stop_perception():
    orchestrator.stop()
    return {"status": "stopped"}

@router.post("/record/start")
async def start_recording():
    """Start recording events with video and metrics"""
    orchestrator.recording = True
    orchestrator.recording_data = []
    return {"status": "recording_started"}

@router.post("/record/stop")
async def stop_recording():
    """Stop recording and save event data"""
    if not orchestrator.recording:
        return {"status": "not_recording"}
    
    orchestrator.recording = False
    
    # Save recording data
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    recording_path = f"backend/data/recordings/event_{timestamp}.json"
    
    os.makedirs(os.path.dirname(recording_path), exist_ok=True)
    
    recording_data = {
        "timestamp": timestamp,
        "duration": len(orchestrator.recording_data),
        "tracks": orchestrator.recording_data,
        "events": [event.model_dump(mode='json') for event in orchestrator.last_events]
    }
    
    with open(recording_path, 'w') as f:
        json.dump(recording_data, f, indent=2, default=str)
    
    data = orchestrator.recording_data
    orchestrator.recording_data = []
    
    return {
        "status": "recording_saved", 
        "recording_path": recording_path,
        "frames_captured": len(data)
    }

@router.get("/recordings")
async def get_recordings():
    """Get list of saved recordings"""
    recordings_dir = "backend/data/recordings"
    if not os.path.exists(recordings_dir):
        return []
    
    recordings = []
    for filename in os.listdir(recordings_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(recordings_dir, filename)
            recordings.append({
                "filename": filename,
                "path": filepath,
                "size": os.path.getsize(filepath),
                "created": datetime.fromtimestamp(os.path.getctime(filepath)).isoformat()
            })
    
    return sorted(recordings, key=lambda x: x['created'], reverse=True)

@router.get("/telemetry")
async def get_telemetry():
    try:
        import psutil
        import time
        from backend.core.config import settings
        
        cpu_usage = psutil.cpu_percent(interval=None)
        memory_info = psutil.virtual_memory()
        disk_info = psutil.disk_usage('/')
        
        # Calculate uptime (mock or system)
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        days = int(uptime_seconds // (24 * 3600))
        hours = int((uptime_seconds % (24 * 3600)) // 3600)
        minutes = int((uptime_seconds % 3600) // 60)
        
        return {
            "network_status": "Active" if orchestrator.active else "Standby",
            "database_status": "Connected" if settings.DATABASE_URL else "Disconnected",
            "cpu_usage": f"{cpu_usage}%",
            "memory_usage": f"{memory_info.percent}%",
            "storage_usage": f"{disk_info.percent}%",
            "active_sensors": len([d for d in orchestrator.devices if d['status'] == 'online']),
            "system_uptime": f"{days}d {hours}h {minutes}m",
            "recording_status": "Active" if orchestrator.recording else "Standby",
            "active_use_case": orchestrator.use_case,
            "sahi_status": "Enabled" if orchestrator.detector.use_sahi else "Disabled",
            "station": {
                "id": "STATION-Z01",
                "name": "Command Station Alpha",
                "os": os.uname().sysname if hasattr(os, 'uname') else "Windows/Other",
                "location": "Lagos, Nigeria",
                "ip": "192.168.1.105"
            }
        }
    except Exception as e:
        # Fallback if psutil fails or anything else
        return {
            "network_status": "Error",
            "database_status": "Unknown",
            "cpu_usage": "0%",
            "memory_usage": "0%",
            "storage_usage": "0%",
            "active_sensors": 0,
            "system_uptime": "0d 0h 0m",
            "recording_status": "Error",
            "error": str(e)
        }

@router.post("/analyze/upload")
async def upload_video(file: UploadFile = File(...)):
    import shutil
    import os
    
    upload_dir = "backend/data/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Start orchestrator with this file
    if orchestrator.active:
        orchestrator.stop()
    
    # Wait a bit for stop (hacky)
    import time
    time.sleep(1)
    
    # Only save the file path, don't start the orchestrator yet (User will click ACTIVATE)
    # await orchestrator.start(source=file_path, simulation=True)
    
    return {"status": "source_locked", "filename": file.filename, "source": file_path}

@router.get("/video_feed")
async def video_feed():
    from fastapi.responses import StreamingResponse
    import time
    
    def generate():
        last_frame_id = -1
        while True:
            try:
                # Synchronize with orchestrator frame count to avoid duplicates
                current_id = orchestrator.frame_count
                if current_id == last_frame_id:
                    time.sleep(0.001) # Very tight check
                    continue
                    
                frame_bytes = orchestrator.get_latest_frame()
                if frame_bytes:
                    last_frame_id = current_id
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                else:
                    time.sleep(0.01)
            except Exception as e:
                print(f"Video stream error: {e}")
                time.sleep(1.0) # Wait before retry

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/zones", response_model=List[Zone])
async def get_zones():
    return orchestrator.zone_engine.zones

@router.post("/zones")
async def create_zone(zone: Zone):
    orchestrator.zone_engine.add_zone(zone)
    return {"status": "added", "zone": zone}

@router.post("/ziva/chat")
async def ziva_chat(request: ChatRequest):
    """Chat with ZIVA AI Assistant"""
    from backend.ai.gemini_client import ziva
    
    # Build context from current system state
    system_context = {
        "active_tracks": len(orchestrator.tracks),
        "system_status": "online" if orchestrator.active else "standby",
        "detected_objects": [{"type": t.label, "id": t.id, "confidence": t.confidence} for t in orchestrator.tracks[:5]]
    }
    
    # Merge with provided context
    if request.context:
        system_context.update(request.context)
    
    response = await ziva.chat(request.message, system_context)
    return {"response": response, "timestamp": time.time()}

@router.get("/devices")
async def get_devices():
    """List available surveillance devices"""
    return {
        "devices": orchestrator.devices,
        "active_device_id": orchestrator.active_device_id
    }

@router.post("/devices/switch")
async def switch_device(device_id: str):
    """Switch active surveillance device"""
    return await orchestrator.switch_source(device_id)

@router.post("/use-case/switch")
async def switch_use_case(use_case: str):
    """Switch active intelligence engine (e.g. traffic, security, industrial)"""
    return await orchestrator.switch_use_case(use_case)

@router.get("/drones")
async def get_drones():
    """Get real-time drone positions for the map"""
    drones = []
    for d in orchestrator.devices:
        if d['type'] == 'drone':
            # Add slight jitter to simulate movement
            import random
            drones.append({
                "id": d['id'],
                "name": d['name'],
                "lat": d['lat'] + (random.random() - 0.5) * 0.001,
                "lng": d['lng'] + (random.random() - 0.5) * 0.001,
                "status": d['status'],
                "battery": random.randint(60, 98)
            })
    return drones

@router.post("/training/label")
async def submit_labeling_instruction(data: dict):
    """Mock endpoint for submission of labeling data/instructions"""
    return {"status": "received", "message": "Training data processed and queued for optimization"}

@router.post("/models/upload")
async def upload_custom_model(file: UploadFile = File(...)):
    """Upload a custom trained YOLO model (.pt)"""
    import shutil
    
    # Ensure directory exists
    model_dir = "backend/data/models/custom"
    os.makedirs(model_dir, exist_ok=True)
    
    path = f"{model_dir}/{file.filename}"
    
    try:
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Trigger hot-reload in Orchestrator (Mock for now, real logic in V2.3)
        # orchestrator.detector.load_model(path)
        logger.info(f"Custom Model Uploaded: {path}")
        
        return {"status": "deployed", "model_path": path, "message": "Neural Engine Updated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/sentry/discover")
async def discover_legacy_streams():
    """Scan local network for Analog DVRs and IP cameras (Simulated)"""
    # In production, this would use nmap or service discovery
    await asyncio.sleep(1.5) # Simulate scanning latency
    
    mock_discoveries = [
        {"id": "dvr_01", "name": "HIKVISION-DVR-8CH", "type": "analog_dvr", "ip": "192.168.1.12", "channels": 8, "status": "detected"},
        {"id": "dvr_02", "name": "DAHUA-XVR-LINK", "type": "analog_dvr", "ip": "192.168.1.45", "channels": 4, "status": "detected"},
        {"id": "cam_ip_01", "name": "Generic Onvif Cam", "type": "ip_cam", "ip": "192.168.1.102", "channels": 1, "status": "detected"}
    ]
    return {"status": "success", "discoveries": mock_discoveries}

@router.post("/sentry/pool/activate")
async def activate_sentry_pool(device_ids: List[str]):
    """Group multiple legacy streams into a single AI pooling engine"""
    logger.info(f"Activating Sentry Link Pool for: {device_ids}")
    
    # Map IDs to actual sources (for MVP, we'll use some dummy videos to simulate)
    # If the user selected dvr_01, we simulate 4 channels
    sources = []
    for d_id in device_ids:
        if d_id == "dvr_01":
            # Simulate 2 channels from this DVR
            sources.extend(["mall_theft.mp4", "mall_theft.mp4"]) 
        else:
            sources.append("mall_theft.mp4")
            
    pool_str = "pool:" + ",".join(sources)
    await orchestrator.start(source=pool_str, simulation=True)
    
    return {"status": "pool_active", "sources": sources}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and wait for client messages/disconnect
            # We don't pull tracks here anymore; they are pushed via manager.process_queue
            data = await websocket.receive_text()
            # If we wanted to handle client messages, we'd do it here
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        # Don't print for normal closure issues if already handled
        if "disconnect" not in str(e).lower():
            print(f"WS Error: {e}")
        manager.disconnect(websocket)
