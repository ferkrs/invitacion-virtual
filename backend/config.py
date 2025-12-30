from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Admin
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ADMIN_SECRET_CODE: str
    
    class Config:
        env_file = ".env"


settings = Settings()

