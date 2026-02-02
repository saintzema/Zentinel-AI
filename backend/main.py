import logging
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.core.database import engine, Base
from backend.core.sql_models import *

# Create Tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("zentinel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models, connect DB, etc.
    logger.info("ZentinelOS System Startup Initiated...")
    yield
    # Shutdown: Clean up resources
    logger.info("ZentinelOS System Shutdown...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ZentinelOS Sovereign Situational Awareness API",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.api.endpoints import router as api_router
from backend.api.endpoints import orchestrator

# Global orchestrator instance removed - using the one from endpoints.py
# orchestrator = PerceptionOrchestrator()

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Mount static files (JS, CSS, etc.) if they exist (Production)
static_dir = os.path.join(os.path.dirname(__file__), "static")
assets_dir = os.path.join(static_dir, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
else:
    logger.warning(f"Static assets directory not found at {assets_dir}. Frontend may not serve correctly.")

@app.get("/{path:path}")
async def catch_all(path: str):
    # Determine the absolute path to the frontend assets
    index_path = os.path.join(static_dir, "index.html")
    
    # If API call that fell through, return 404
    if path.startswith("api/"):
        return {"error": "API route not found", "path": path}
    
    # Serve index.html for SPA routing if it exists
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return {"error": "Frontend assets not found", "path": path}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Port is handled by uvicorn command in Dockerfile or deployment platform
# Using ENV PORT from cloud environment if needed.

