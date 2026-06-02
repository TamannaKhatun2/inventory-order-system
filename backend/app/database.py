from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Auto-detect database availability and fallback to SQLite for local runs without PostgreSQL
db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    # Attempt to connect to PostgreSQL
    engine = create_engine(db_url, pool_pre_ping=True)
    # Test the connection briefly
    with engine.connect() as conn:
        pass
except Exception as e:
    # If connection fails (e.g. running locally without Docker or PostgreSQL service),
    # fallback automatically to a zero-config SQLite database.
    print(f"\n[Database Warning]: PostgreSQL connection failed. Falling back to local SQLite database.\nError: {e}\n")
    db_url = "sqlite:///./inventory.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()

# Dependency to get db session in endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
