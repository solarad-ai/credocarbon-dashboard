from apps.api.core.ports import FileStoragePort, EventBusPort, TaskQueuePort, EmailPort, MalwareScannerPort
from apps.api.infra.local.adapters import LocalFileStorageAdapter, LocalEventBusAdapter, LocalTaskQueueAdapter, LocalEmailAdapter, LocalMalwareScannerAdapter
import os

class Container:
    def __init__(self):
        # Read env to decide adapters
        self.storage_backend = os.getenv("STORAGE_BACKEND", "local")
        self.event_backend = os.getenv("EVENT_BACKEND", "local")

        # Initialize File Storage based on backend
        if self.storage_backend == "gcs":
            from apps.api.infra.gcs.adapters import GCSFileStorageAdapter
            self.file_storage: FileStoragePort = GCSFileStorageAdapter()
        else:
            self.file_storage: FileStoragePort = LocalFileStorageAdapter()
        
        # Other adapters (local for now)
        self.event_bus: EventBusPort = LocalEventBusAdapter()
        self.task_queue: TaskQueuePort = LocalTaskQueueAdapter()
        self.email_service: EmailPort = LocalEmailAdapter()
        self.malware_scanner: MalwareScannerPort = LocalMalwareScannerAdapter()

container = Container()

