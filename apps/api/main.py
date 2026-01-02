"""
CredoCarbon API Main Entry Point

FastAPI application with cloud-agnostic infrastructure.
Configuration is loaded from environment variables via apps.api.core.config.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from apps.api.core.config import settings
from apps.api.core.database import Base, engine

# Import routers
from apps.api.modules.auth.router import router as auth_router
from apps.api.modules.project.router import router as project_router
from apps.api.modules.audit.router import router as audit_router
from apps.api.modules.notification.router import router as notification_router
from apps.api.modules.wallet.router import router as wallet_router
from apps.api.modules.dashboard.router import router as dashboard_router
from apps.api.modules.marketplace.router import router as marketplace_router
from apps.api.modules.retirement.router import router as retirement_router
from apps.api.modules.generation.router import router as generation_router
from apps.api.modules.superadmin.router import router as superadmin_router
from apps.api.modules.vvb.router import router as vvb_router
from apps.api.modules.registry.router import router as registry_router
from apps.api.modules.admin.router import router as admin_router

# Import models for SQLAlchemy table creation
from apps.api.core.models import *  # noqa
from apps.api.modules.vvb.models import ValidationTask, VerificationTask, VVBQuery, VVBQueryResponse  # noqa
from apps.api.modules.registry.models import RegistryReview, RegistryQuery, IssuanceRecord, CreditBatch  # noqa
from apps.api.modules.generation.models import *  # noqa


# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting CredoCarbon API (env={settings.env}, cloud={settings.cloud.provider})")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CredoCarbon API")


# Create FastAPI application
app = FastAPI(
    title="CredoCarbon API",
    version="0.1.0",
    description="Carbon credit marketplace API",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(project_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(wallet_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(retirement_router, prefix="/api")
app.include_router(generation_router, prefix="/api")
app.include_router(superadmin_router, prefix="/api")
app.include_router(vvb_router, prefix="/api")
app.include_router(registry_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "Welcome to CredoCarbon API"}


@app.get("/health")
def health_check():
    """Health check endpoint for container orchestration."""
    return {
        "status": "ok",
        "env": settings.env,
        "cloud_provider": settings.cloud.provider,
    }


# Run with: uvicorn apps.api.main:app --reload
