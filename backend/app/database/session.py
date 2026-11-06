from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Project root: directory containing backend/, scripts/, frontend/
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent

# Load .env if present
env_path = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=env_path)

# Determine stable SQLite database file path
db_file = PROJECT_ROOT / "nagrikai.db"
if not db_file.exists():
    fallback_db = PROJECT_ROOT / "civicai.db"
    if fallback_db.exists():
        db_file = fallback_db
    else:
        parent_db = PROJECT_ROOT.parent / "nagrikai.db"
        if parent_db.exists() and parent_db.stat().st_size > 0:
            db_file = parent_db

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or DATABASE_URL in ("sqlite:///./nagrikai.db", "sqlite:///nagrikai.db", "sqlite:///./civicai.db", "sqlite:///civicai.db", "sqlite:///:memory:"):
    DATABASE_URL = f"sqlite:///{db_file.as_posix()}"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
