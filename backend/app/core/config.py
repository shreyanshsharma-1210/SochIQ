import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DataLens"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Host & Port for Render Deployment
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))

    # Uploads & Processing Limits
    MAX_UPLOAD_SIZE_MB: int = 25
    PREVIEW_MAX_ROWS: int = 50

    # Inactivity Expiration (30 minutes)
    SESSION_INACTIVITY_MINUTES: int = 30
    API_KEY_INACTIVITY_MINUTES: int = 30
    SESSION_COOKIE_NAME: str = "datalens_session"

    # Supabase Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    SUPABASE_JWT_ISSUER: Optional[str] = None

    # Optional Groq AI Integration
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    # Security & CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
