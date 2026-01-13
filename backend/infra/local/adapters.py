"""
Local Development Adapters

These adapters are used for local development and testing.
They provide in-memory or file-based implementations that don't require
external cloud services.

Set CLOUD_PROVIDER=local to use these adapters.
"""

import os
import json
import aiofiles
from typing import Any, Dict, Optional
from datetime import datetime
import logging

from backend.infra.adapters.base import (
    CloudFileStorageBase,
    CloudEventBusBase,
    CloudTaskQueueBase,
    CloudEmailBase,
    CloudMalwareScannerBase,
)

logger = logging.getLogger(__name__)


class LocalFileStorageAdapter(CloudFileStorageBase):
    """
    Local file system storage adapter.
    
    Stores files in a local directory for development/testing.
    """
    
    provider = "local"
    uri_scheme = "file"
    
    def __init__(self, upload_dir: Optional[str] = None):
        super().__init__()
        self.upload_dir = upload_dir or os.getenv("LOCAL_UPLOAD_DIR", "./data/uploads")
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def _do_upload(
        self, 
        file_path: str, 
        content: bytes, 
        content_type: str
    ) -> str:
        """Save file to local directory."""
        # Sanitize path to prevent directory traversal
        safe_filename = os.path.basename(file_path)
        full_path = os.path.join(self.upload_dir, safe_filename)
        
        async with aiofiles.open(full_path, 'wb') as f:
            await f.write(content)
        
        return full_path
    
    async def _do_download(self, storage_uri: str) -> bytes:
        """Read file from local path."""
        # Handle both full paths and relative paths
        if os.path.isabs(storage_uri):
            file_path = storage_uri
        else:
            file_path = os.path.join(self.upload_dir, os.path.basename(storage_uri))
        
        async with aiofiles.open(file_path, 'rb') as f:
            return await f.read()
    
    async def _do_delete(self, storage_uri: str) -> bool:
        """Delete file from local storage."""
        try:
            if os.path.isabs(storage_uri):
                file_path = storage_uri
            else:
                file_path = os.path.join(self.upload_dir, os.path.basename(storage_uri))
            
            os.remove(file_path)
            return True
        except FileNotFoundError:
            return False


class LocalEventBusAdapter(CloudEventBusBase):
    """
    Local event bus adapter (console logging).
    
    For development, just logs events to console.
    In a real local setup with Docker, could use Redis Pub/Sub.
    """
    
    provider = "local"
    
    def __init__(self):
        super().__init__()
        self._handlers: Dict[str, list] = {}
    
    async def _do_publish(self, topic: str, message: Dict[str, Any]) -> None:
        """Log event and call local handlers."""
        logger.info(f"[LocalEventBus] Published to {topic}: {json.dumps(message, default=str)}")
        
        # Call any registered handlers
        if topic in self._handlers:
            for handler in self._handlers[topic]:
                try:
                    handler(message)
                except Exception as e:
                    logger.error(f"Handler error for {topic}: {e}")
    
    async def _do_subscribe(self, topic: str, handler: Any) -> None:
        """Register a local handler for a topic."""
        if topic not in self._handlers:
            self._handlers[topic] = []
        self._handlers[topic].append(handler)
        logger.info(f"[LocalEventBus] Subscribed to {topic}")


class LocalTaskQueueAdapter(CloudTaskQueueBase):
    """
    Local task queue adapter (console logging).
    
    For development, just logs tasks to console.
    Tasks are not actually executed - use Celery for real background processing.
    """
    
    provider = "local"
    
    def __init__(self):
        super().__init__()
        self._task_counter = 0
    
    async def _do_enqueue(
        self, 
        task_name: str, 
        payload: Dict[str, Any], 
        deploy_at: Optional[datetime]
    ) -> str:
        """Log task and return stub ID."""
        self._task_counter += 1
        task_id = f"local-task-{self._task_counter}"
        
        schedule_info = f" (scheduled: {deploy_at.isoformat()})" if deploy_at else ""
        logger.info(f"[LocalTaskQueue] Enqueued {task_name}{schedule_info}: {json.dumps(payload, default=str)}")
        
        return task_id


class LocalEmailAdapter(CloudEmailBase):
    """
    Local email adapter (console logging / MailHog).
    
    For development, logs emails to console.
    When running with Docker Compose, can connect to MailHog.
    """
    
    provider = "local"
    
    def __init__(self):
        super().__init__()
        self._use_mailhog = os.getenv("USE_MAILHOG", "false").lower() == "true"
        self._mailhog_host = os.getenv("MAILHOG_HOST", "localhost")
        self._mailhog_port = int(os.getenv("MAILHOG_PORT", "1025"))
    
    async def _do_send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html: bool
    ) -> bool:
        """Log email or send to MailHog."""
        if self._use_mailhog:
            return await self._send_to_mailhog(to_email, subject, body, html)
        
        # Console logging
        logger.info("=" * 60)
        logger.info(f"[LocalEmail] To: {to_email}")
        logger.info(f"[LocalEmail] Subject: {subject}")
        logger.info(f"[LocalEmail] Body:\n{body}")
        logger.info("=" * 60)
        return True
    
    async def _send_to_mailhog(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html: bool
    ) -> bool:
        """Send email via MailHog SMTP."""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = "noreply@local.dev"
            msg["To"] = to_email
            
            content_type = "html" if html else "plain"
            msg.attach(MIMEText(body, content_type))
            
            with smtplib.SMTP(self._mailhog_host, self._mailhog_port) as server:
                server.send_message(msg)
            
            return True
        except Exception as e:
            logger.error(f"MailHog send failed: {e}")
            return False


class LocalMalwareScannerAdapter(CloudMalwareScannerBase):
    """
    Local malware scanner (no-op).
    
    For development, always returns True (clean).
    """
    
    provider = "local"
    
    async def _do_scan(self, content: bytes) -> bool:
        """Always return clean in local development."""
        logger.debug(f"[LocalMalwareScanner] Scanned {len(content)} bytes - OK")
        return True
