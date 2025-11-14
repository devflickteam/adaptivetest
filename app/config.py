# app/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import Field
from urllib.parse import urlparse

class Settings(BaseSettings):
    # Render provides DATABASE_URL directly
    database_url: str = Field("", alias="DATABASE_URL")
    
    # OpenAI
    openai_api_key: str = Field("", alias="OPENAI_API_KEY")
    
    # Security
    secret_key: str = Field("your-secret-key-change-in-production", alias="SECRET_KEY")
    
    # Environment
    env: str = Field("development", alias="ENVIRONMENT")
    
    # URLs
    frontend_url: str = Field("http://localhost:3000", alias="FRONTEND_URL")
    backend_url: str = Field("http://localhost:8000", alias="RENDER_EXTERNAL_URL")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def DATABASE_URL(self) -> str:
        # Priority: DATABASE_URL from Render -> constructed URL -> SQLite fallback
        if self.database_url:
            # Render provides DATABASE_URL directly, ensure it's postgresql://
            if self.database_url.startswith("postgres://"):
                return self.database_url.replace("postgres://", "postgresql://", 1)
            return self.database_url
        
        # Fallback to local PostgreSQL or SQLite
        postgres_user = os.getenv("POSTGRES_USER", "adaptivetest")
        postgres_password = os.getenv("POSTGRES_PASSWORD", "adaptivetest")
        postgres_host = os.getenv("POSTGRES_HOST", "localhost")
        postgres_port = os.getenv("POSTGRES_PORT", "5432")
        postgres_db = os.getenv("POSTGRES_DB", "adaptivetest")
        
        if all([postgres_user, postgres_password, postgres_host, postgres_db]):
            return f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
        else:
            # Final fallback to SQLite
            return "sqlite:///./adaptivetest.db"

settings = Settings()
print(f"[CONFIG] Environment: {settings.env}")
print(f"[CONFIG] Database URL: {settings.DATABASE_URL[:50]}...")  # Log first 50 chars for security