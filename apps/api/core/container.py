"""
Dependency Injection Container

This module provides the application's dependency injection container.
It uses the adapter factory to provide cloud-agnostic infrastructure.

Usage:
    from apps.api.core.container import container
    
    file_storage = container.file_storage
    event_bus = container.event_bus

Environment-Based Configuration:
    Set CLOUD_PROVIDER to switch between providers:
    - local: Development adapters (file system, console logging)
    - gcp: Google Cloud Platform (GCS, Pub/Sub, Cloud Tasks)
    - aws: Amazon Web Services (S3, SQS, SNS, SES) [future]
    - azure: Microsoft Azure (Blob, Service Bus, Queue) [future]

Per-Service Overrides:
    - STORAGE_BACKEND: Override file storage provider
    - EVENT_BACKEND: Override event bus provider
    - QUEUE_BACKEND: Override task queue provider
    - EMAIL_BACKEND: Override email provider
"""

import logging
from typing import Optional

from apps.api.core.ports import (
    FileStoragePort,
    EventBusPort,
    TaskQueuePort,
    EmailPort,
    MalwareScannerPort,
)
from apps.api.infra.adapters.factory import AdapterFactory, get_factory

logger = logging.getLogger(__name__)


class Container:
    """
    Application dependency injection container.
    
    Provides lazy-loaded access to infrastructure adapters.
    Adapters are instantiated on first access and cached.
    
    Example:
        storage = container.file_storage
        await storage.upload("file.txt", b"content")
    """
    
    def __init__(self, factory: Optional[AdapterFactory] = None):
        """
        Initialize container.
        
        Args:
            factory: AdapterFactory to use. If None, uses global factory.
        """
        self._factory = factory or get_factory()
        logger.info(f"Container initialized with provider: {self._factory.default_provider}")
    
    @property
    def file_storage(self) -> FileStoragePort:
        """Get file storage adapter."""
        return self._factory.get_file_storage()
    
    @property
    def event_bus(self) -> EventBusPort:
        """Get event bus adapter."""
        return self._factory.get_event_bus()
    
    @property
    def task_queue(self) -> TaskQueuePort:
        """Get task queue adapter."""
        return self._factory.get_task_queue()
    
    @property
    def email_service(self) -> EmailPort:
        """Get email adapter."""
        return self._factory.get_email()
    
    @property
    def malware_scanner(self) -> MalwareScannerPort:
        """Get malware scanner adapter."""
        return self._factory.get_malware_scanner()
    
    def reset(self):
        """Clear cached adapter instances."""
        self._factory.clear_cache()
        logger.info("Container adapter cache cleared")


# Global container instance
container = Container()


# FastAPI Dependency Functions
# Use these with Depends() in route handlers

def get_file_storage() -> FileStoragePort:
    """FastAPI dependency for file storage."""
    return container.file_storage


def get_event_bus() -> EventBusPort:
    """FastAPI dependency for event bus."""
    return container.event_bus


def get_task_queue() -> TaskQueuePort:
    """FastAPI dependency for task queue."""
    return container.task_queue


def get_email_service() -> EmailPort:
    """FastAPI dependency for email service."""
    return container.email_service


def get_malware_scanner() -> MalwareScannerPort:
    """FastAPI dependency for malware scanner."""
    return container.malware_scanner
