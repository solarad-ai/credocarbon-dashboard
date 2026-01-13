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
    # Convert postgresql:// to postgresql+psycopg:// for psycopg v3 driver
    # This driver is compatible with Supabase's transaction pooler
    db_url = DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    
    # Use NullPool for serverless environments (Cloud Run)
    # NullPool creates a new connection for each request and closes immediately
    # This works better with external connection poolers like Supabase's pgbouncer
    engine = create_engine(
        db_url,
        poolclass=NullPool,  # No local pooling - let Supabase handle it
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


