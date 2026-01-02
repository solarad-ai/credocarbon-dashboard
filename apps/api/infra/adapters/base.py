"""
Base Adapter Classes for Cloud Infrastructure

This module provides abstract base classes with shared functionality for all cloud adapters.
Extending these base classes ensures consistent behavior and reduces code redundancy.

To add a new cloud provider:
1. Create a new directory under `apps/api/infra/{provider}/`
2. Implement adapters extending these base classes
3. Register in the adapter factory

Example:
    class MyCloudStorageAdapter(CloudFileStorageBase):
        provider = "mycloud"
        
        async def _do_upload(self, path: str, content: bytes, content_type: str) -> str:
            # Provider-specific upload logic
            ...
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypeVar, Generic
from datetime import datetime
import logging
import asyncio
from functools import wraps

from apps.api.core.ports import (
    FileStoragePort,
    EventBusPort,
    TaskQueuePort,
    EmailPort,
    MalwareScannerPort,
)


logger = logging.getLogger(__name__)

T = TypeVar("T")


def with_retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    Decorator for retrying async operations with exponential backoff.
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries in seconds
        backoff: Multiplier for delay after each retry
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        logger.warning(
                            f"{func.__name__} attempt {attempt + 1} failed: {e}. "
                            f"Retrying in {current_delay}s..."
                        )
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"{func.__name__} failed after {max_attempts} attempts: {e}")
            
            raise last_exception
        return wrapper
    return decorator


class CloudAdapterBase(ABC):
    """Base class for all cloud adapters with common functionality."""
    
    # Override in subclass to identify the cloud provider
    provider: str = "base"
    
    def __init__(self):
        self._logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def _log_operation(self, operation: str, **kwargs):
        """Log an operation with context."""
        self._logger.info(f"[{self.provider}] {operation}", extra=kwargs)
    
    def _log_error(self, operation: str, error: Exception, **kwargs):
        """Log an error with context."""
        self._logger.error(f"[{self.provider}] {operation} failed: {error}", extra=kwargs)


class CloudFileStorageBase(CloudAdapterBase, FileStoragePort):
    """
    Base class for cloud file storage adapters.
    
    Provides common URI parsing, logging, and retry logic.
    Subclasses must implement the abstract _do_* methods.
    """
    
    # URI scheme for this storage provider (e.g., "gs", "s3", "azure")
    uri_scheme: str = ""
    
    def parse_uri(self, uri: str) -> tuple[str, str]:
        """
        Parse a storage URI into bucket/container and path.
        
        Args:
            uri: Storage URI (e.g., gs://bucket/path, s3://bucket/path)
            
        Returns:
            Tuple of (bucket_or_container, path)
        """
        if uri.startswith(f"{self.uri_scheme}://"):
            uri = uri[len(f"{self.uri_scheme}://"):]
        
        parts = uri.split("/", 1)
        bucket = parts[0]
        path = parts[1] if len(parts) > 1 else ""
        return bucket, path
    
    def build_uri(self, bucket: str, path: str) -> str:
        """Build a full URI from bucket and path."""
        return f"{self.uri_scheme}://{bucket}/{path.lstrip('/')}"
    
    @with_retry(max_attempts=3)
    async def upload(self, file_path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload with automatic retry and logging."""
        self._log_operation("upload", file_path=file_path, size=len(content))
        try:
            result = await self._do_upload(file_path, content, content_type)
            self._log_operation("upload_complete", file_path=file_path, uri=result)
            return result
        except Exception as e:
            self._log_error("upload", e, file_path=file_path)
            raise
    
    @with_retry(max_attempts=3)
    async def download(self, storage_uri: str) -> bytes:
        """Download with automatic retry and logging."""
        self._log_operation("download", uri=storage_uri)
        try:
            result = await self._do_download(storage_uri)
            self._log_operation("download_complete", uri=storage_uri, size=len(result))
            return result
        except Exception as e:
            self._log_error("download", e, uri=storage_uri)
            raise
    
    async def delete(self, storage_uri: str) -> bool:
        """Delete with logging."""
        self._log_operation("delete", uri=storage_uri)
        try:
            result = await self._do_delete(storage_uri)
            self._log_operation("delete_complete", uri=storage_uri, success=result)
            return result
        except Exception as e:
            self._log_error("delete", e, uri=storage_uri)
            return False
    
    @abstractmethod
    async def _do_upload(self, file_path: str, content: bytes, content_type: str) -> str:
        """Provider-specific upload implementation."""
        pass
    
    @abstractmethod
    async def _do_download(self, storage_uri: str) -> bytes:
        """Provider-specific download implementation."""
        pass
    
    @abstractmethod
    async def _do_delete(self, storage_uri: str) -> bool:
        """Provider-specific delete implementation."""
        pass


class CloudEventBusBase(CloudAdapterBase, EventBusPort):
    """
    Base class for cloud event/message bus adapters.
    
    Provides common message serialization and logging.
    """
    
    async def publish(self, topic: str, message: Dict[str, Any]) -> None:
        """Publish with logging and serialization."""
        self._log_operation("publish", topic=topic, message_keys=list(message.keys()))
        try:
            await self._do_publish(topic, message)
            self._log_operation("publish_complete", topic=topic)
        except Exception as e:
            self._log_error("publish", e, topic=topic)
            raise
    
    async def subscribe(self, topic: str, handler: Any) -> None:
        """Subscribe with logging."""
        self._log_operation("subscribe", topic=topic)
        try:
            await self._do_subscribe(topic, handler)
        except Exception as e:
            self._log_error("subscribe", e, topic=topic)
            raise
    
    @abstractmethod
    async def _do_publish(self, topic: str, message: Dict[str, Any]) -> None:
        """Provider-specific publish implementation."""
        pass
    
    @abstractmethod
    async def _do_subscribe(self, topic: str, handler: Any) -> None:
        """Provider-specific subscribe implementation."""
        pass


class CloudTaskQueueBase(CloudAdapterBase, TaskQueuePort):
    """
    Base class for cloud task queue adapters.
    
    Provides common payload handling and scheduling logic.
    """
    
    async def enqueue(
        self, 
        task_name: str, 
        payload: Dict[str, Any], 
        deploy_at: Optional[datetime] = None
    ) -> str:
        """Enqueue with logging."""
        self._log_operation(
            "enqueue", 
            task_name=task_name, 
            scheduled=deploy_at.isoformat() if deploy_at else "immediate"
        )
        try:
            task_id = await self._do_enqueue(task_name, payload, deploy_at)
            self._log_operation("enqueue_complete", task_name=task_name, task_id=task_id)
            return task_id
        except Exception as e:
            self._log_error("enqueue", e, task_name=task_name)
            raise
    
    @abstractmethod
    async def _do_enqueue(
        self, 
        task_name: str, 
        payload: Dict[str, Any], 
        deploy_at: Optional[datetime]
    ) -> str:
        """Provider-specific enqueue implementation."""
        pass


class CloudEmailBase(CloudAdapterBase, EmailPort):
    """
    Base class for cloud email adapters.
    
    Provides common email formatting and template support.
    """
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html: bool = False
    ) -> bool:
        """Send email with logging."""
        self._log_operation("send_email", to=to_email, subject=subject, html=html)
        try:
            result = await self._do_send_email(to_email, subject, body, html)
            self._log_operation("send_email_complete", to=to_email, success=result)
            return result
        except Exception as e:
            self._log_error("send_email", e, to=to_email)
            return False
    
    @abstractmethod
    async def _do_send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html: bool
    ) -> bool:
        """Provider-specific send implementation."""
        pass


class CloudMalwareScannerBase(CloudAdapterBase, MalwareScannerPort):
    """Base class for cloud malware scanning adapters."""
    
    async def scan(self, content: bytes) -> bool:
        """Scan with logging."""
        self._log_operation("scan", size=len(content))
        try:
            result = await self._do_scan(content)
            self._log_operation("scan_complete", clean=result)
            return result
        except Exception as e:
            self._log_error("scan", e)
            # Fail closed - treat scan errors as potential threats
            return False
    
    @abstractmethod
    async def _do_scan(self, content: bytes) -> bool:
        """Provider-specific scan implementation."""
        pass
