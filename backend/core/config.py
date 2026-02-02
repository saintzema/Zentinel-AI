from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ZentinelOS"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # AI / Perception Config
    MODEL_PATH: str = "yolov8n.pt"  # Default to nano for speed
    CONFIDENCE_THRESHOLD: float = 0.3
    
    # Data Storage
    DATA_DIR: str = "backend/data"
    DATABASE_URL: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
