"""
Configuration module for the Interview Accelerator.
Manages Gemini API key, model settings, and session configuration.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings."""

    # Gemini / Google API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    
    # Priority list of models for automatic failover
    CANDIDATE_MODELS: list[str] = [
        "gemini-3.5-flash",
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.6-flash",
    ]
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # Model temperature settings
    ANALYSIS_TEMPERATURE: float = 0.3  # Lower for structured analysis
    INTERVIEW_TEMPERATURE: float = 0.7  # Higher for natural conversation
    EVALUATION_TEMPERATURE: float = 0.4  # Balanced for evaluation

    # Interview settings
    QUESTIONS_PER_LEVEL: int = 5
    TOTAL_LEVELS: int = 3

    # Session settings
    MAX_SESSIONS: int = 100
    SESSION_TIMEOUT_MINUTES: int = 120

    @property
    def has_api_key(self) -> bool:
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY != "your_api_key_here")


settings = Settings()
