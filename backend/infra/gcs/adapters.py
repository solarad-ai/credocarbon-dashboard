"""
Google Cloud Storage Adapter for File Storage

This adapter implements the FileStoragePort interface using Google Cloud Storage.
Uses the temp-garbage bucket in asia-south2 region.
"""

import os
from typing import Optional
from google.cloud import storage
from google.cloud.exceptions import NotFound
from backend.core.ports import FileStoragePort


class GCSFileStorageAdapter(FileStoragePort):
    """
    GCS File Storage Adapter
    
    Environment Variables:
        - GCS_BUCKET_NAME: Name of the GCS bucket (default: temp-garbage)
        - GCS_PROJECT_ID: Google Cloud project ID (default: products-432306)
        - GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON
    """
    
    def __init__(
        self, 
        bucket_name: Optional[str] = None,
        project_id: Optional[str] = None
    ):
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME", "temp-garbage")
        self.project_id = project_id or os.getenv("GCS_PROJECT_ID", "products-432306")
        
        # Initialize the storage client
        self.client = storage.Client(project=self.project_id)
        self.bucket = self.client.bucket(self.bucket_name)
    
    async def upload(
        self, 
        file_path: str, 
        content: bytes, 
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a file to GCS bucket.
        
        Args:
            file_path: The destination path within the bucket (e.g., "projects/123/documents/file.pdf")
            content: The file content as bytes
            content_type: MIME type of the file
            
        Returns:
            The GCS URI (gs://bucket-name/path/to/file)
        """
        # Sanitize file path to remove leading slashes
        blob_path = file_path.lstrip("/")
        
        # Create blob and upload
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(content, content_type=content_type)
        
        # Return the GCS URI
        return f"gs://{self.bucket_name}/{blob_path}"
    
    async def download(self, storage_uri: str) -> bytes:
        """
        Download a file from GCS.
        
        Args:
            storage_uri: The GCS URI (gs://bucket-name/path) or just the blob path
            
        Returns:
            The file content as bytes
        """
        # Extract blob path from URI if it's a full GCS URI
        if storage_uri.startswith("gs://"):
            # Parse gs://bucket-name/path/to/file format
            parts = storage_uri.replace("gs://", "").split("/", 1)
            if len(parts) < 2:
                raise ValueError(f"Invalid GCS URI: {storage_uri}")
            blob_path = parts[1]
        else:
            blob_path = storage_uri.lstrip("/")
        
        blob = self.bucket.blob(blob_path)
        return blob.download_as_bytes()
    
    async def delete(self, storage_uri: str) -> bool:
        """
        Delete a file from GCS.
        
        Args:
            storage_uri: The GCS URI or blob path
            
        Returns:
            True if deleted, False if not found
        """
        try:
            # Extract blob path from URI
            if storage_uri.startswith("gs://"):
                parts = storage_uri.replace("gs://", "").split("/", 1)
                if len(parts) < 2:
                    return False
                blob_path = parts[1]
            else:
                blob_path = storage_uri.lstrip("/")
            
            blob = self.bucket.blob(blob_path)
            blob.delete()
            return True
        except NotFound:
            return False
    
    async def get_signed_url(
        self, 
        storage_uri: str, 
        expiration_minutes: int = 60
    ) -> str:
        """
        Generate a signed URL for temporary access.
        
        Args:
            storage_uri: The GCS URI or blob path
            expiration_minutes: How long the URL should be valid
            
        Returns:
            A signed URL for the file
        """
        from datetime import timedelta
        
        # Extract blob path
        if storage_uri.startswith("gs://"):
            parts = storage_uri.replace("gs://", "").split("/", 1)
            blob_path = parts[1] if len(parts) > 1 else ""
        else:
            blob_path = storage_uri.lstrip("/")
        
        blob = self.bucket.blob(blob_path)
        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=expiration_minutes),
            method="GET"
        )
        return url
