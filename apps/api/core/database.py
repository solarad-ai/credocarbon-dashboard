from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://credo:credo_password@localhost:5432/credo_carbon")

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Use NullPool for serverless environments (Cloud Run)
    # NullPool creates a new connection for each request and closes immediately
    # This works better with external connection poolers like Supabase's pgbouncer
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,  # No local pooling - let Supabase handle it
        connect_args={
            "sslmode": "require",  # Require SSL for Supabase
            "options": "-c timezone=utc",  # Set timezone
        },
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

