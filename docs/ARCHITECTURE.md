# Architecture Guide

This document explains the CredoCarbon platform architecture and how to extend it.

## Overview

The platform uses **Hexagonal Architecture** (Ports & Adapters) to separate business logic from infrastructure concerns, making it easy to:

- Switch between cloud providers (GCP, AWS, Azure)
- Test business logic in isolation
- Add new infrastructure adapters without changing core code

## Hexagonal Architecture

```
                    ┌─────────────────────────┐
                    │      HTTP Requests       │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │        Routers          │
                    │   (FastAPI Endpoints)   │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        │           ┌───────────▼─────────────┐         │
        │           │      Core Domain        │         │
        │           │   (Business Logic)      │         │
        │           └───────────┬─────────────┘         │
        │                       │                       │
        │           ┌───────────▼─────────────┐         │
        │           │        Ports            │         │
        │           │    (Interfaces)         │         │
        │           │  FileStoragePort        │         │
        │           │  EventBusPort           │         │
        │           │  TaskQueuePort          │         │
        │           │  EmailPort              │         │
        │           └───────────┬─────────────┘         │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐    ┌──────────▼──────────┐    ┌──────▼───────┐
│ Local Adapter │    │    GCP Adapter      │    │ AWS Adapter  │
│   (Dev)       │    │   (Production)      │    │  (Future)    │
└───────┬───────┘    └──────────┬──────────┘    └──────┬───────┘
        │                       │                       │
┌───────▼───────┐    ┌──────────▼──────────┐    ┌──────▼───────┐
│  File System  │    │        GCS          │    │      S3      │
│  Console Log  │    │      Pub/Sub        │    │     SQS      │
│  MailHog      │    │    Cloud Tasks      │    │     SES      │
└───────────────┘    └─────────────────────┘    └──────────────┘
```

## Core Components

### Ports (`apps/api/core/ports.py`)

Interfaces defining what infrastructure services the application needs:

```python
class FileStoragePort(ABC):
    async def upload(self, path: str, content: bytes, content_type: str) -> str: ...
    async def download(self, uri: str) -> bytes: ...
    async def delete(self, uri: str) -> bool: ...

class EventBusPort(ABC):
    async def publish(self, topic: str, message: Dict) -> None: ...
    async def subscribe(self, topic: str, handler: Any) -> None: ...

class TaskQueuePort(ABC):
    async def enqueue(self, task: str, payload: Dict, schedule: datetime) -> str: ...

class EmailPort(ABC):
    async def send_email(self, to: str, subject: str, body: str, html: bool) -> bool: ...
```

### Base Adapters (`apps/api/infra/adapters/base.py`)

Abstract base classes with shared functionality:

- **Retry Logic**: Automatic retries with exponential backoff
- **Logging**: Consistent operation logging
- **URI Parsing**: Common URI handling for storage adapters

```python
class CloudFileStorageBase(CloudAdapterBase, FileStoragePort):
    uri_scheme = ""  # Override: "gs", "s3", "azure"
    
    @with_retry(max_attempts=3)
    async def upload(self, path, content, content_type):
        # Shared logging and retry logic
        return await self._do_upload(path, content, content_type)
    
    @abstractmethod
    async def _do_upload(self, path, content, content_type) -> str:
        # Provider-specific implementation
        pass
```

### Adapter Factory (`apps/api/infra/adapters/factory.py`)

Creates adapters based on configuration:

```python
factory = AdapterFactory()  # Reads CLOUD_PROVIDER env var

storage = factory.get_file_storage()   # Returns GCS/S3/Local adapter
events = factory.get_event_bus()       # Returns Pub/Sub/SNS/Local adapter
queue = factory.get_task_queue()       # Returns Cloud Tasks/SQS/Local
email = factory.get_email()            # Returns SendGrid/SES/Local
```

### Container (`apps/api/core/container.py`)

Dependency injection container for application use:

```python
from apps.api.core.container import container

# In route handlers
@router.post("/upload")
async def upload_file(file: UploadFile):
    uri = await container.file_storage.upload(...)
    return {"uri": uri}

# Or use FastAPI Depends
from apps.api.core.container import get_file_storage

@router.post("/upload")
async def upload_file(
    file: UploadFile,
    storage: FileStoragePort = Depends(get_file_storage)
):
    uri = await storage.upload(...)
```

## Adding a New Cloud Provider

### Step 1: Create Adapter Directory

```
apps/api/infra/
├── aws/                      # New provider
│   ├── __init__.py
│   └── adapters.py
```

### Step 2: Implement Adapters

```python
# apps/api/infra/aws/adapters.py

from apps.api.infra.adapters.base import (
    CloudFileStorageBase,
    CloudEventBusBase,
    CloudTaskQueueBase,
    CloudEmailBase,
)

class S3FileStorageAdapter(CloudFileStorageBase):
    provider = "aws"
    uri_scheme = "s3"
    
    def __init__(self, bucket: str = None):
        super().__init__()
        import boto3
        self.bucket = bucket or os.getenv("AWS_S3_BUCKET")
        self.s3 = boto3.client("s3")
    
    async def _do_upload(self, path, content, content_type):
        self.s3.put_object(
            Bucket=self.bucket,
            Key=path,
            Body=content,
            ContentType=content_type
        )
        return f"s3://{self.bucket}/{path}"
    
    async def _do_download(self, uri):
        bucket, key = self.parse_uri(uri)
        response = self.s3.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()
    
    async def _do_delete(self, uri):
        bucket, key = self.parse_uri(uri)
        self.s3.delete_object(Bucket=bucket, Key=key)
        return True

# Similar implementations for SQS, SNS, SES...
```

### Step 3: Register in Factory

Update `apps/api/infra/adapters/factory.py`:

```python
def _load_aws_adapters():
    try:
        from apps.api.infra.aws.adapters import (
            S3FileStorageAdapter,
            SQSEventBusAdapter,
            # ...
        )
        
        register_provider("aws", ProviderConfig(
            file_storage=S3FileStorageAdapter,
            event_bus=SQSEventBusAdapter,
            # ...
        ))
    except ImportError:
        pass
```

### Step 4: Add Dependencies

Update `requirements.txt`:

```
boto3==1.34.0  # AWS SDK
```

### Step 5: Configure

Set environment variables:

```bash
CLOUD_PROVIDER=aws
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-bucket
```

## Adding a New Module

### Step 1: Create Module Structure

```
apps/api/modules/
├── myfeature/
│   ├── __init__.py
│   ├── router.py         # FastAPI routes
│   ├── service.py        # Business logic
│   ├── models.py         # SQLAlchemy models
│   └── schemas.py        # Pydantic schemas
```

### Step 2: Implement

```python
# router.py
from fastapi import APIRouter, Depends
from apps.api.core.container import get_file_storage

router = APIRouter(prefix="/myfeature", tags=["MyFeature"])

@router.get("/")
async def list_items():
    return {"items": []}

# service.py
class MyFeatureService:
    def __init__(self, storage: FileStoragePort):
        self.storage = storage
    
    async def do_something(self):
        # Business logic using injected storage
        pass
```

### Step 3: Register Router

In `apps/api/main.py`:

```python
from apps.api.modules.myfeature.router import router as myfeature_router

app.include_router(myfeature_router, prefix="/api")
```

## Testing

### Unit Testing (Isolated)

```python
from apps.api.infra.local.adapters import LocalFileStorageAdapter

def test_my_service():
    # Use local adapter for testing
    storage = LocalFileStorageAdapter(upload_dir="/tmp/test")
    service = MyService(storage=storage)
    
    result = await service.do_something()
    assert result is not None
```

### Integration Testing

```python
import pytest
from apps.api.core.container import Container, AdapterFactory

@pytest.fixture
def container():
    factory = AdapterFactory(default_provider="local")
    return Container(factory=factory)

def test_integration(container):
    storage = container.file_storage
    uri = await storage.upload("test.txt", b"content")
    assert uri.endswith("test.txt")
```

## Configuration Reference

### Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `CLOUD_PROVIDER` | Default cloud provider | Factory |
| `STORAGE_BACKEND` | Override for file storage | Factory |
| `EVENT_BACKEND` | Override for event bus | Factory |
| `GCP_PROJECT_ID` | GCP project ID | GCP adapters |
| `GCS_BUCKET_NAME` | GCS bucket name | GCS adapter |
| `AWS_REGION` | AWS region | AWS adapters |
| `AWS_S3_BUCKET` | S3 bucket name | S3 adapter |

### Provider Mapping

| Provider | File Storage | Event Bus | Task Queue | Email |
|----------|-------------|-----------|------------|-------|
| `local` | File system | Console | Console | Console/MailHog |
| `gcp` | GCS | Pub/Sub | Cloud Tasks | SendGrid |
| `aws` | S3 | SNS | SQS | SES |
| `azure` | Blob | Service Bus | Queue | SendGrid |
