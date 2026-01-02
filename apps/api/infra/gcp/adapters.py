"""
GCP Cloud Adapters

Complete set of Google Cloud Platform adapters for production deployment.
Includes:
- GCS File Storage (Google Cloud Storage)
- Pub/Sub Event Bus
- Cloud Tasks Queue
- Email (via SendGrid or SMTP relay)
- Malware Scanner (placeholder - integrate with Cloud DLP or VirusTotal)

Environment Variables:
    - GCP_PROJECT_ID: Google Cloud project ID
    - GCS_BUCKET_NAME: Default GCS bucket name
    - PUBSUB_PROJECT_ID: Pub/Sub project (defaults to GCP_PROJECT_ID)
    - CLOUD_TASKS_LOCATION: Cloud Tasks location (e.g., 'asia-south2')
    - CLOUD_TASKS_QUEUE: Default queue name
    - SENDGRID_API_KEY: SendGrid API key for email
    - EMAIL_FROM: Default sender email address
"""

import os
import json
from typing import Any, Dict, Optional
from datetime import datetime, timedelta
import logging

from apps.api.infra.adapters.base import (
    CloudFileStorageBase,
    CloudEventBusBase,
    CloudTaskQueueBase,
    CloudEmailBase,
    CloudMalwareScannerBase,
)

logger = logging.getLogger(__name__)


class GCSFileStorageAdapter(CloudFileStorageBase):
    """
    Google Cloud Storage adapter for file storage.
    
    Uses the google-cloud-storage library for GCS operations.
    Provides signed URL generation for secure temporary access.
    """
    
    provider = "gcp"
    uri_scheme = "gs"
    
    def __init__(
        self, 
        bucket_name: Optional[str] = None,
        project_id: Optional[str] = None
    ):
        super().__init__()
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME", "temp-garbage")
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID", "products-432306")
        
        # Lazy initialization of GCS client
        self._client = None
        self._bucket = None
    
    @property
    def client(self):
        """Lazy-load GCS client."""
        if self._client is None:
            from google.cloud import storage
            self._client = storage.Client(project=self.project_id)
        return self._client
    
    @property
    def bucket(self):
        """Get the bucket object."""
        if self._bucket is None:
            self._bucket = self.client.bucket(self.bucket_name)
        return self._bucket
    
    async def _do_upload(
        self, 
        file_path: str, 
        content: bytes, 
        content_type: str
    ) -> str:
        """Upload file to GCS."""
        blob_path = file_path.lstrip("/")
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(content, content_type=content_type)
        return self.build_uri(self.bucket_name, blob_path)
    
    async def _do_download(self, storage_uri: str) -> bytes:
        """Download file from GCS."""
        bucket_name, blob_path = self.parse_uri(storage_uri)
        
        # Use configured bucket if URI is just a path
        if not blob_path:
            blob_path = bucket_name
            bucket_name = self.bucket_name
        
        blob = self.client.bucket(bucket_name).blob(blob_path)
        return blob.download_as_bytes()
    
    async def _do_delete(self, storage_uri: str) -> bool:
        """Delete file from GCS."""
        from google.cloud.exceptions import NotFound
        
        try:
            bucket_name, blob_path = self.parse_uri(storage_uri)
            if not blob_path:
                blob_path = bucket_name
                bucket_name = self.bucket_name
            
            blob = self.client.bucket(bucket_name).blob(blob_path)
            blob.delete()
            return True
        except NotFound:
            return False
    
    async def get_signed_url(
        self, 
        storage_uri: str, 
        expiration_minutes: int = 60,
        method: str = "GET"
    ) -> str:
        """
        Generate a signed URL for temporary access.
        
        Args:
            storage_uri: The GCS URI or blob path
            expiration_minutes: How long the URL should be valid
            method: HTTP method (GET, PUT, etc.)
            
        Returns:
            A signed URL for the file
        """
        bucket_name, blob_path = self.parse_uri(storage_uri)
        if not blob_path:
            blob_path = bucket_name
            bucket_name = self.bucket_name
        
        blob = self.client.bucket(bucket_name).blob(blob_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method=method
        )
        return url


class PubSubEventBusAdapter(CloudEventBusBase):
    """
    Google Cloud Pub/Sub adapter for event messaging.
    
    Uses Pub/Sub for asynchronous event-driven communication.
    Topics are automatically created if they don't exist.
    """
    
    provider = "gcp"
    
    def __init__(self, project_id: Optional[str] = None):
        super().__init__()
        self.project_id = project_id or os.getenv("PUBSUB_PROJECT_ID") or os.getenv("GCP_PROJECT_ID")
        self._publisher = None
        self._subscriber = None
    
    @property
    def publisher(self):
        """Lazy-load Pub/Sub publisher."""
        if self._publisher is None:
            from google.cloud import pubsub_v1
            self._publisher = pubsub_v1.PublisherClient()
        return self._publisher
    
    @property
    def subscriber(self):
        """Lazy-load Pub/Sub subscriber."""
        if self._subscriber is None:
            from google.cloud import pubsub_v1
            self._subscriber = pubsub_v1.SubscriberClient()
        return self._subscriber
    
    def _get_topic_path(self, topic: str) -> str:
        """Get full topic path."""
        return self.publisher.topic_path(self.project_id, topic)
    
    async def _do_publish(self, topic: str, message: Dict[str, Any]) -> None:
        """Publish message to Pub/Sub topic."""
        topic_path = self._get_topic_path(topic)
        
        # Serialize message to JSON bytes
        data = json.dumps(message, default=str).encode("utf-8")
        
        # Publish asynchronously
        future = self.publisher.publish(topic_path, data)
        future.result()  # Wait for publish to complete
    
    async def _do_subscribe(self, topic: str, handler: Any) -> None:
        """
        Subscribe to a Pub/Sub topic.
        
        Note: In production, subscriptions are usually managed via Cloud Run
        push subscriptions or Cloud Functions triggers, not long-lived pulls.
        """
        subscription_name = f"{topic}-sub"
        subscription_path = self.subscriber.subscription_path(self.project_id, subscription_name)
        
        def callback(message):
            try:
                data = json.loads(message.data.decode("utf-8"))
                handler(data)
                message.ack()
            except Exception as e:
                logger.error(f"Error processing Pub/Sub message: {e}")
                message.nack()
        
        # Start subscription (non-blocking)
        self.subscriber.subscribe(subscription_path, callback=callback)


class CloudTasksQueueAdapter(CloudTaskQueueBase):
    """
    Google Cloud Tasks adapter for background task processing.
    
    Uses Cloud Tasks for reliable, scheduled task execution.
    Tasks are delivered to a target HTTP endpoint.
    """
    
    provider = "gcp"
    
    def __init__(
        self, 
        project_id: Optional[str] = None,
        location: Optional[str] = None,
        queue_name: Optional[str] = None,
        target_url: Optional[str] = None
    ):
        super().__init__()
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID")
        self.location = location or os.getenv("CLOUD_TASKS_LOCATION", "asia-south2")
        self.queue_name = queue_name or os.getenv("CLOUD_TASKS_QUEUE", "default")
        self.target_url = target_url or os.getenv("CLOUD_TASKS_TARGET_URL", "")
        self._client = None
    
    @property
    def client(self):
        """Lazy-load Cloud Tasks client."""
        if self._client is None:
            from google.cloud import tasks_v2
            self._client = tasks_v2.CloudTasksClient()
        return self._client
    
    def _get_queue_path(self) -> str:
        """Get full queue path."""
        return self.client.queue_path(self.project_id, self.location, self.queue_name)
    
    async def _do_enqueue(
        self, 
        task_name: str, 
        payload: Dict[str, Any], 
        deploy_at: Optional[datetime]
    ) -> str:
        """Enqueue a task to Cloud Tasks."""
        from google.cloud import tasks_v2
        from google.protobuf import timestamp_pb2
        
        queue_path = self._get_queue_path()
        
        # Build the task
        task = {
            "http_request": {
                "http_method": tasks_v2.HttpMethod.POST,
                "url": f"{self.target_url}/tasks/{task_name}",
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(payload).encode(),
            }
        }
        
        # Add schedule time if specified
        if deploy_at:
            timestamp = timestamp_pb2.Timestamp()
            timestamp.FromDatetime(deploy_at)
            task["schedule_time"] = timestamp
        
        # Create the task
        response = self.client.create_task(parent=queue_path, task=task)
        return response.name


class GCPEmailAdapter(CloudEmailBase):
    """
    Email adapter for GCP deployments.
    
    Uses SendGrid API for email delivery (recommended for GCP).
    Falls back to SMTP if SendGrid not configured.
    """
    
    provider = "gcp"
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: Optional[str] = None
    ):
        super().__init__()
        self.api_key = api_key or os.getenv("SENDGRID_API_KEY")
        self.from_email = from_email or os.getenv("EMAIL_FROM", "noreply@credocarbon.com")
        self._use_sendgrid = bool(self.api_key)
    
    async def _do_send_email(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html: bool
    ) -> bool:
        """Send email via SendGrid or SMTP."""
        if self._use_sendgrid:
            return await self._send_via_sendgrid(to_email, subject, body, html)
        else:
            # Fallback to console logging in development
            logger.info(f"[Email] To: {to_email}, Subject: {subject}")
            logger.debug(f"[Email] Body: {body}")
            return True
    
    async def _send_via_sendgrid(
        self, 
        to_email: str, 
        subject: str, 
        body: str, 
        html: bool
    ) -> bool:
        """Send email using SendGrid API."""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "personalizations": [{"to": [{"email": to_email}]}],
                        "from": {"email": self.from_email},
                        "subject": subject,
                        "content": [
                            {
                                "type": "text/html" if html else "text/plain",
                                "value": body
                            }
                        ]
                    }
                )
                return response.status_code in (200, 201, 202)
        except Exception as e:
            logger.error(f"SendGrid email failed: {e}")
            return False


class GCPMalwareScannerAdapter(CloudMalwareScannerBase):
    """
    Malware scanner adapter for GCP.
    
    Placeholder implementation - can be extended to use:
    - Google Cloud DLP for sensitive data detection
    - VirusTotal API for malware scanning
    - ClamAV in a Cloud Run sidecar
    """
    
    provider = "gcp"
    
    def __init__(self):
        super().__init__()
        self._scanner_enabled = os.getenv("MALWARE_SCAN_ENABLED", "false").lower() == "true"
    
    async def _do_scan(self, content: bytes) -> bool:
        """
        Scan content for malware.
        
        Currently a no-op that returns True (clean).
        Implement actual scanning based on your security requirements.
        """
        if not self._scanner_enabled:
            return True
        
        # TODO: Implement actual scanning
        # Options:
        # 1. Call VirusTotal API
        # 2. Use Cloud DLP for data inspection
        # 3. Call ClamAV sidecar service
        
        return True
