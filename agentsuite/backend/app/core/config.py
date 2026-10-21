from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Agentic Automation Suite"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://neondb_owner:npg_ireZ9TtLB7aH@ep-round-water-atfpaesr-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: str = "https://agentsuite-frontend.onrender.com,http://localhost:5173,http://localhost:3000,http://localhost:8000"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AI / LLM
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    LLM_PROVIDER: str = "gemini"  
    LLM_MODEL: str = "gemini-2.0-flash" 
    
    # Email (SMTP)
    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = "sanushqah@gmail.com"
    SMTP_PASSWORD: Optional[str] = "dhpo drwm zmly xpzt"
    EMAIL_FROM: str = "sanushqah@gmail.com"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()