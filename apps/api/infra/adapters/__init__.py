"""Adapters module for cloud infrastructure abstraction."""

from apps.api.infra.adapters.base import (
    CloudAdapterBase,
    CloudFileStorageBase,
    CloudEventBusBase,
    CloudTaskQueueBase,
    CloudEmailBase,
    CloudMalwareScannerBase,
    with_retry,
)

from apps.api.infra.adapters.factory import (
    AdapterFactory,
    get_factory,
    get_file_storage,
    get_event_bus,
    get_task_queue,
    get_email,
    get_malware_scanner,
    register_provider,
    ProviderConfig,
)

__all__ = [
    # Base classes
    "CloudAdapterBase",
    "CloudFileStorageBase",
    "CloudEventBusBase",
    "CloudTaskQueueBase",
    "CloudEmailBase",
    "CloudMalwareScannerBase",
    "with_retry",
    # Factory
    "AdapterFactory",
    "get_factory",
    "get_file_storage",
    "get_event_bus",
    "get_task_queue",
    "get_email",
    "get_malware_scanner",
    "register_provider",
    "ProviderConfig",
]
