from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime

class FileStoragePort(ABC):
    @abstractmethod
    async def upload(self, file_path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload a file and return its storage URI/path."""
        pass

    @abstractmethod
    async def download(self, storage_uri: str) -> bytes:
        """Download a file's content."""
        pass

    @abstractmethod
    async def delete(self, storage_uri: str) -> bool:
        """Delete a file."""
        pass

class EventBusPort(ABC):
    @abstractmethod
    async def publish(self, topic: str, message: Dict[str, Any]) -> None:
        """Publish a message to a topic."""
        pass

    @abstractmethod
    async def subscribe(self, topic: str, handler: Any) -> None:
        """Subscribe to a topic."""
        pass

class TaskQueuePort(ABC):
    @abstractmethod
    async def enqueue(self, task_name: str, payload: Dict[str, Any], deploy_at: Optional[datetime] = None) -> str:
        """Enqueue a background task."""
        pass

class EmailPort(ABC):
    @abstractmethod
    async def send_email(self, to_email: str, subject: str, body: str, html: bool = False) -> bool:
        """Send an email."""
        pass

class MalwareScannerPort(ABC):
    @abstractmethod
    async def scan(self, content: bytes) -> bool:
        """Scan content for malware. Returns True if clean, False if infected."""
        pass
