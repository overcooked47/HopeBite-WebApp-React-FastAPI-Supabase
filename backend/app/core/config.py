from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
  
    APP_NAME: str = "HopeBite"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    ADMIN_EMAIL: str = "adminhpbite@gmail.com"
    ADMIN_PASSWORD: str = "Admin@12345"

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmdnbHRzdWp5amFpbGR3Z3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1MTU0OSwiZXhwIjoyMDg1MDI3NTQ5fQ.A_IyLHlU7EJFQd-JLqW-jDgISwmSXt-YD9GDXFj-zNo"  
    
  
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
  
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
 
    MAX_FILE_SIZE: int = 5242880  
    UPLOAD_DIR: str = "uploads"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
