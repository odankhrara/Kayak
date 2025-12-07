"""Database session configuration"""
from sqlmodel import SQLModel, create_engine, Session
import os
from typing import Generator

# Database URL - MySQL is default for AI services, SQLite is fallback
# MySQL connection: mysql+pymysql://user:password@host:port/database
mysql_host = os.getenv("MYSQL_HOST", "localhost")
mysql_port = os.getenv("MYSQL_PORT", "3307")
mysql_user = os.getenv("MYSQL_USER", "root")
mysql_password = os.getenv("MYSQL_PASSWORD", "password")
mysql_database = os.getenv("MYSQL_DATABASE", "kayak")

# Use MySQL if DATABASE_URL is set, otherwise construct from env vars
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Construct MySQL URL from environment variables (MySQL is default)
    use_mysql = os.getenv("USE_MYSQL", "true").lower() == "true"
    if use_mysql:
        DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}"
    else:
        # SQLite fallback (only if explicitly disabled MySQL)
        DATABASE_URL = "sqlite:///./ai_recommendations.db"

# Create engine with MySQL-specific settings
if DATABASE_URL.startswith("mysql"):
    # MySQL engine configuration
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        pool_size=10,
        max_overflow=20
    )
else:
    # SQLite engine configuration
    engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session"""
    with Session(engine) as session:
        yield session

