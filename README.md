# ZentinelOS MVP Documentation

## Quick Start
1. **Start Backend**:
   ```bash
   ./run_backend.sh
   # API running at http://localhost:8000
   ```

2. **Start Frontend** (New Terminal):
   ```bash
   cd frontend
   npm run dev
   # Dashboard running at http://localhost:5173
   ```

3. **Access Dashboard**:
   Open http://localhost:5173 to access the Command Center.

## Demo Mode Usage
1. Open the Dashboard.
2. Check the **SIMULATION MODE** checkbox in the top right.
3. Click **ACTIVATE SENSORS**.
4. You will see simulated entities (Persons, Vehicles) moving across the "pipeline corridor".
5. Alerts will trigger if persistent rules are violated (e.g. tracking thresholds).

## Features Implemented
- **Unified Sensor Interface**: Supports local webcam and simulated sources.
- **AI Perception**: YOLOv8 integration for object detection and tracking.
- **Zone Engine**: Detects when tracks enter defined polygons (currently hardcoded or managed via API).
- **Real-time Dashboard**: Live map, event feed, and status indicators powered by WebSockets.
- **Sovereignty**: All processing is local. No cloud dependencies.
