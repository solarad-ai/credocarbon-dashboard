"""
Centralized Configuration Management

This module provides a single source of truth for all application configuration.
Uses Pydantic Settings for validation and environment variable loading.

Environment Variables:
    Core:
        - ENV: Environment name (local, dev, staging, prod)
        - DEBUG: Enable debug mode
        - SECRET_KEY: JWT signing key
        
    Database:
        - DATABASE_URL: PostgreSQL connection string
        
    Cloud Provider:
        - CLOUD_PROVIDER: Cloud backend (local, gcp, aws, azure)
        - STORAGE_BACKEND: Override for file storage
        - EVENT_BACKEND: Override for event bus
        - QUEUE_BACKEND: Override for task queue
        - EMAIL_BACKEND: Override for email
        
    GCP:
        - GCP_PROJECT_ID: Google Cloud project
        - GCS_BUCKET_NAME: GCS bucket for file storage
        - PUBSUB_PROJECT_ID: Pub/Sub project (defaults to GCP_PROJECT_ID)
        - CLOUD_TASKS_LOCATION: Cloud Tasks region
        - CLOUD_TASKS_QUEUE: Cloud Tasks queue name
        
    Email:
        - SENDGRID_API_KEY: SendGrid API key
        - EMAIL_FROM: Default sender address
        
    CORS:
        - CORS_ORIGINS: Comma-separated allowed origins
"""

import os
from typing import List, Literal, Optional
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Database configuration."""
    url: str = Field(
        default="postgresql://credo:credo_password@localhost:5432/credo_carbon",
        alias="DATABASE_URL"
    )
    pool_size: int = Field(default=5, alias="DB_POOL_SIZE")
    max_overflow: int = Field(default=10, alias="DB_MAX_OVERFLOW")
    
    class Config:
        env_prefix = ""
        extra = "ignore"


class GCPSettings(BaseSettings):
    """Google Cloud Platform configuration."""
    project_id: str = Field(default="", alias="GCP_PROJECT_ID")
    gcs_bucket_name: str = Field(default="temp-garbage", alias="GCS_BUCKET_NAME")
    pubsub_project_id: Optional[str] = Field(default=None, alias="PUBSUB_PROJECT_ID")
    cloud_tasks_location: str = Field(default="asia-south2", alias="CLOUD_TASKS_LOCATION")
    cloud_tasks_queue: str = Field(default="default", alias="CLOUD_TASKS_QUEUE")
    cloud_tasks_target_url: str = Field(default="", alias="CLOUD_TASKS_TARGET_URL")
    
    @property
    def effective_pubsub_project(self) -> str:
        """Get Pub/Sub project, defaulting to main project."""
        return self.pubsub_project_id or self.project_id
    
    class Config:
        env_prefix = ""
        extra = "ignore"


class AWSSettings(BaseSettings):
    """Amazon Web Services configuration (for future use)."""
    region: str = Field(default="us-east-1", alias="AWS_REGION")
    s3_bucket: str = Field(default="", alias="AWS_S3_BUCKET")
    sqs_queue_url: str = Field(default="", alias="AWS_SQS_QUEUE_URL")
    sns_topic_arn: str = Field(default="", alias="AWS_SNS_TOPIC_ARN")
    
    class Config:
        env_prefix = ""
        extra = "ignore"


class AzureSettings(BaseSettings):
    """Microsoft Azure configuration (for future use)."""
    storage_account: str = Field(default="", alias="AZURE_STORAGE_ACCOUNT")
    storage_key: str = Field(default="", alias="AZURE_STORAGE_KEY")
    container_name: str = Field(default="", alias="AZURE_CONTAINER_NAME")
    service_bus_connection: str = Field(default="", alias="AZURE_SERVICE_BUS_CONNECTION")
    
    class Config:
        env_prefix = ""
        extra = "ignore"


class EmailSettings(BaseSettings):
    """Email configuration."""
    sendgrid_api_key: str = Field(default="", alias="SENDGRID_API_KEY")
    from_address: str = Field(default="noreply@credocarbon.com", alias="EMAIL_FROM")
    use_mailhog: bool = Field(default=False, alias="USE_MAILHOG")
    mailhog_host: str = Field(default="localhost", alias="MAILHOG_HOST")
    mailhog_port: int = Field(default=1025, alias="MAILHOG_PORT")
    
    class Config:
        env_prefix = ""
        extra = "ignore"


class CloudProviderSettings(BaseSettings):
    """Cloud provider selection configuration."""
    provider: Literal["local", "gcp", "aws", "azure"] = Field(
        default="local", 
        alias="CLOUD_PROVIDER"
    )
    storage_backend: Optional[str] = Field(default=None, alias="STORAGE_BACKEND")
    event_backend: Optional[str] = Field(default=None, alias="EVENT_BACKEND")
    queue_backend: Optional[str] = Field(default=None, alias="QUEUE_BACKEND")
    email_backend: Optional[str] = Field(default=None, alias="EMAIL_BACKEND")
    
    def get_storage_provider(self) -> str:
        """Get effective storage provider."""
        return self.storage_backend or self.provider
    
    def get_event_provider(self) -> str:
        """Get effective event bus provider."""
        return self.event_backend or self.provider
    
    def get_queue_provider(self) -> str:
        """Get effective task queue provider."""
        return self.queue_backend or self.provider
    
    def get_email_provider(self) -> str:
        """Get effective email provider."""
        return self.email_backend or self.provider
    
    class Config:
        env_prefix = ""
        extra = "ignore"


class Settings(BaseSettings):
    """
    Main application settings.
    
    Aggregates all configuration sections and provides unified access.
    """
    
    # Core settings
    env: Literal["local", "dev", "staging", "prod"] = Field(
        default="local", 
        alias="ENV"
    )
    debug: bool = Field(default=False, alias="DEBUG")
    secret_key: str = Field(
        default="dev-secret-key-change-in-production",
        alias="SECRET_KEY"
    )
    
    # API settings
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8080, alias="API_PORT")
    
    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS"
    )
    
    # Nested settings
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    cloud: CloudProviderSettings = Field(default_factory=CloudProviderSettings)
    gcp: GCPSettings = Field(default_factory=GCPSettings)
    aws: AWSSettings = Field(default_factory=AWSSettings)
    azure: AzureSettings = Field(default_factory=AzureSettings)
    email: EmailSettings = Field(default_factory=EmailSettings)
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list, including production origins when in prod."""
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        
        # In production, allow all origins for now to fix CORS issues
        if self.env == "prod":
            return ["*"]
        
        return origins
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.env == "prod"
    
    @property
    def is_local(self) -> bool:
        """Check if running locally."""
        return self.env == "local"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Settings are loaded once and cached for performance.
    Call get_settings.cache_clear() to reload.
    """
    return Settings()


# Convenience accessors
settings = get_settings()
