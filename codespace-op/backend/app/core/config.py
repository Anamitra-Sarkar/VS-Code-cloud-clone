from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "codespace_op"

    # Firebase – path to service-account JSON *or* base64-encoded JSON string
    FIREBASE_CREDENTIALS_JSON: str = ""

    # MinIO / S3-compatible object storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "workspace-snapshots"
    MINIO_SECURE: bool = False

    # LLM provider keys
    GROK_KEY: str = ""
    NVIDIA_KEY: str = ""
    LOCAL_FALLBACK: str = "http://localhost:11434/api/generate"

    # Docker workspace image
    WORKSPACE_IMAGE: str = "codespace-op-workspace:latest"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 7860

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
