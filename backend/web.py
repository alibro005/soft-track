"""Application-wide plumbing: settings, the database engine, and the request session.

Mirrors the role `web.py` plays in the Educare backend -- everything that is
neither routing (`app_*`) nor business logic (`lib_*`) lives here.
"""

from pydantic_settings import BaseSettings
from sqlmodel import SQLModel, Session, create_engine


class Settings(BaseSettings):
    app_name: str = "SoftTrack"
    database_url: str = "sqlite:///./softtrack.db"
    secret_key: str = "dev-secret-key-change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"


settings = Settings()

# SQLite needs check_same_thread disabled to be used across FastAPI's threadpool.
connect_args = {"check_same_thread": False} if "sqlite" in settings.database_url else {}
engine = create_engine(settings.database_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    # Import the tables so they are registered on SQLModel.metadata before create_all.
    from lib_softtrack import tables  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency yielding a request-scoped database session."""
    with Session(engine) as session:
        yield session
