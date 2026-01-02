"""
Adapter Factory for Cloud Infrastructure

This module provides a factory pattern for creating cloud adapters based on configuration.
It supports automatic adapter discovery and easy addition of new providers.

Usage:
    from apps.api.infra.adapters.factory import AdapterFactory
    
    factory = AdapterFactory()
    file_storage = factory.get_file_storage()  # Uses CLOUD_PROVIDER env var
    
To add a new provider:
1. Create adapters in `apps/api/infra/{provider}/adapters.py`
2. Register the provider in PROVIDER_REGISTRY below
"""

import os
from typing import Dict, Type, Optional, Any
from dataclasses import dataclass
import logging

from apps.api.core.ports import (
    FileStoragePort,
    EventBusPort,
    TaskQueuePort,
    EmailPort,
    MalwareScannerPort,
)

logger = logging.getLogger(__name__)


@dataclass
class ProviderConfig:
    """Configuration for a cloud provider's adapters."""
    file_storage: Optional[Type[FileStoragePort]] = None
    event_bus: Optional[Type[EventBusPort]] = None
    task_queue: Optional[Type[TaskQueuePort]] = None
    email: Optional[Type[EmailPort]] = None
    malware_scanner: Optional[Type[MalwareScannerPort]] = None


# Registry of available providers and their adapters
# Add new providers here
PROVIDER_REGISTRY: Dict[str, ProviderConfig] = {}


def register_provider(name: str, config: ProviderConfig):
    """
    Register a cloud provider's adapters.
    
    Args:
        name: Provider name (e.g., 'gcp', 'aws', 'azure', 'local')
        config: ProviderConfig with adapter classes
    """
    PROVIDER_REGISTRY[name] = config
    logger.info(f"Registered cloud provider: {name}")


def _load_local_adapters():
    """Load and register local development adapters."""
    from apps.api.infra.local.adapters import (
        LocalFileStorageAdapter,
        LocalEventBusAdapter,
        LocalTaskQueueAdapter,
        LocalEmailAdapter,
        LocalMalwareScannerAdapter,
    )
    
    register_provider("local", ProviderConfig(
        file_storage=LocalFileStorageAdapter,
        event_bus=LocalEventBusAdapter,
        task_queue=LocalTaskQueueAdapter,
        email=LocalEmailAdapter,
        malware_scanner=LocalMalwareScannerAdapter,
    ))


def _load_gcp_adapters():
    """Load and register GCP adapters."""
    try:
        from apps.api.infra.gcp.adapters import (
            GCSFileStorageAdapter,
            PubSubEventBusAdapter,
            CloudTasksQueueAdapter,
            GCPEmailAdapter,
            GCPMalwareScannerAdapter,
        )
        
        register_provider("gcp", ProviderConfig(
            file_storage=GCSFileStorageAdapter,
            event_bus=PubSubEventBusAdapter,
            task_queue=CloudTasksQueueAdapter,
            email=GCPEmailAdapter,
            malware_scanner=GCPMalwareScannerAdapter,
        ))
    except ImportError as e:
        logger.warning(f"GCP adapters not fully available: {e}")
        # Register partial GCP support (just GCS)
        try:
            from apps.api.infra.gcs.adapters import GCSFileStorageAdapter
            register_provider("gcp", ProviderConfig(
                file_storage=GCSFileStorageAdapter,
            ))
        except ImportError:
            pass


def _load_aws_adapters():
    """Load and register AWS adapters (placeholder for future)."""
    try:
        from apps.api.infra.aws.adapters import (
            S3FileStorageAdapter,
            SQSEventBusAdapter,
            SQSTaskQueueAdapter,
            SESEmailAdapter,
        )
        
        register_provider("aws", ProviderConfig(
            file_storage=S3FileStorageAdapter,
            event_bus=SQSEventBusAdapter,
            task_queue=SQSTaskQueueAdapter,
            email=SESEmailAdapter,
        ))
    except ImportError:
        logger.debug("AWS adapters not available")


def _load_azure_adapters():
    """Load and register Azure adapters (placeholder for future)."""
    try:
        from apps.api.infra.azure.adapters import (
            AzureBlobStorageAdapter,
            ServiceBusEventAdapter,
            AzureQueueAdapter,
            SendGridEmailAdapter,
        )
        
        register_provider("azure", ProviderConfig(
            file_storage=AzureBlobStorageAdapter,
            event_bus=ServiceBusEventAdapter,
            task_queue=AzureQueueAdapter,
            email=SendGridEmailAdapter,
        ))
    except ImportError:
        logger.debug("Azure adapters not available")


def _initialize_registry():
    """Initialize the provider registry with all available adapters."""
    _load_local_adapters()
    _load_gcp_adapters()
    _load_aws_adapters()
    _load_azure_adapters()


# Initialize on module load
_initialize_registry()


class AdapterFactory:
    """
    Factory for creating cloud adapter instances.
    
    Reads CLOUD_PROVIDER environment variable to determine which provider to use.
    Falls back to 'local' for development.
    
    Per-service overrides are also supported:
        - STORAGE_BACKEND: Override for file storage
        - EVENT_BACKEND: Override for event bus
        - QUEUE_BACKEND: Override for task queue
        - EMAIL_BACKEND: Override for email
    
    Example:
        factory = AdapterFactory()
        storage = factory.get_file_storage()
        events = factory.get_event_bus()
    """
    
    def __init__(self, default_provider: Optional[str] = None):
        """
        Initialize the factory.
        
        Args:
            default_provider: Default provider if CLOUD_PROVIDER not set
        """
        self.default_provider = default_provider or os.getenv("CLOUD_PROVIDER", "local")
        self._instances: Dict[str, Any] = {}
        logger.info(f"AdapterFactory initialized with default provider: {self.default_provider}")
    
    def _get_provider(self, override_env: Optional[str] = None) -> str:
        """Get the provider name, checking for overrides."""
        if override_env:
            override = os.getenv(override_env)
            if override:
                return override
        return self.default_provider
    
    def _get_adapter_class(
        self, 
        service: str, 
        provider: str,
        fallback_service: Optional[str] = None
    ) -> Optional[Type]:
        """
        Get the adapter class for a service from a provider.
        
        Falls back to local adapter if provider doesn't have the service.
        """
        if provider not in PROVIDER_REGISTRY:
            logger.warning(f"Provider '{provider}' not registered, falling back to 'local'")
            provider = "local"
        
        config = PROVIDER_REGISTRY.get(provider)
        if not config:
            return None
        
        adapter_class = getattr(config, service, None)
        
        # Fall back to local if adapter not available for this provider
        if adapter_class is None and provider != "local":
            logger.info(f"{service} not available for {provider}, falling back to local")
            local_config = PROVIDER_REGISTRY.get("local")
            if local_config:
                adapter_class = getattr(local_config, service, None)
        
        return adapter_class
    
    def get_file_storage(self) -> FileStoragePort:
        """Get file storage adapter."""
        cache_key = "file_storage"
        if cache_key not in self._instances:
            provider = self._get_provider("STORAGE_BACKEND")
            adapter_class = self._get_adapter_class("file_storage", provider)
            if adapter_class:
                self._instances[cache_key] = adapter_class()
            else:
                raise RuntimeError(f"No file storage adapter available for provider: {provider}")
        return self._instances[cache_key]
    
    def get_event_bus(self) -> EventBusPort:
        """Get event bus adapter."""
        cache_key = "event_bus"
        if cache_key not in self._instances:
            provider = self._get_provider("EVENT_BACKEND")
            adapter_class = self._get_adapter_class("event_bus", provider)
            if adapter_class:
                self._instances[cache_key] = adapter_class()
            else:
                raise RuntimeError(f"No event bus adapter available for provider: {provider}")
        return self._instances[cache_key]
    
    def get_task_queue(self) -> TaskQueuePort:
        """Get task queue adapter."""
        cache_key = "task_queue"
        if cache_key not in self._instances:
            provider = self._get_provider("QUEUE_BACKEND")
            adapter_class = self._get_adapter_class("task_queue", provider)
            if adapter_class:
                self._instances[cache_key] = adapter_class()
            else:
                raise RuntimeError(f"No task queue adapter available for provider: {provider}")
        return self._instances[cache_key]
    
    def get_email(self) -> EmailPort:
        """Get email adapter."""
        cache_key = "email"
        if cache_key not in self._instances:
            provider = self._get_provider("EMAIL_BACKEND")
            adapter_class = self._get_adapter_class("email", provider)
            if adapter_class:
                self._instances[cache_key] = adapter_class()
            else:
                raise RuntimeError(f"No email adapter available for provider: {provider}")
        return self._instances[cache_key]
    
    def get_malware_scanner(self) -> MalwareScannerPort:
        """Get malware scanner adapter."""
        cache_key = "malware_scanner"
        if cache_key not in self._instances:
            provider = self._get_provider()
            adapter_class = self._get_adapter_class("malware_scanner", provider)
            if adapter_class:
                self._instances[cache_key] = adapter_class()
            else:
                raise RuntimeError(f"No malware scanner adapter available for provider: {provider}")
        return self._instances[cache_key]
    
    def clear_cache(self):
        """Clear cached adapter instances."""
        self._instances.clear()


# Global factory instance
_factory: Optional[AdapterFactory] = None


def get_factory() -> AdapterFactory:
    """Get the global adapter factory instance."""
    global _factory
    if _factory is None:
        _factory = AdapterFactory()
    return _factory


def get_file_storage() -> FileStoragePort:
    """Convenience function to get file storage adapter."""
    return get_factory().get_file_storage()


def get_event_bus() -> EventBusPort:
    """Convenience function to get event bus adapter."""
    return get_factory().get_event_bus()


def get_task_queue() -> TaskQueuePort:
    """Convenience function to get task queue adapter."""
    return get_factory().get_task_queue()


def get_email() -> EmailPort:
    """Convenience function to get email adapter."""
    return get_factory().get_email()


def get_malware_scanner() -> MalwareScannerPort:
    """Convenience function to get malware scanner adapter."""
    return get_factory().get_malware_scanner()
