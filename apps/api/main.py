from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from apps.api.core.ports import FileStoragePort, EventBusPort, TaskQueuePort, EmailPort, MalwareScannerPort
from apps.api.infra.local.adapters import LocalFileStorageAdapter, LocalEventBusAdapter, LocalTaskQueueAdapter, LocalEmailAdapter, LocalMalwareScannerAdapter
import os

from apps.api.modules.auth.router import router as auth_router
from apps.api.modules.project.router import router as project_router
from apps.api.modules.audit.router import router as audit_router
from apps.api.modules.notification.router import router as notification_router
from apps.api.modules.wallet.router import router as wallet_router
from apps.api.modules.dashboard.router import router as dashboard_router
from apps.api.modules.marketplace.router import router as marketplace_router
from apps.api.modules.retirement.router import router as retirement_router
from apps.api.modules.generation.router import router as generation_router

app = FastAPI(title="CredoCarbon API", version="0.1.0")

# CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(project_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(wallet_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(retirement_router, prefix="/api")
app.include_router(generation_router, prefix="/api")

# Dependency Injection Container (Simple manual DI for now)
# Container moved to core/container.py

@app.get("/")
def read_root():
    return {"message": "Welcome to CredoCarbon API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "env": os.getenv("ENV", "local")}

# Run with: uvicorn apps.api.main:app --reload
