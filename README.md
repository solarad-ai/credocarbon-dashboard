# CredoCarbon Platform

A carbon credit marketplace platform built with **FastAPI** (Python) and **Next.js** (TypeScript), designed for cloud-native deployment on **Google Cloud Platform**.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Docker](#-docker)
- [Cloud Deployment](#-cloud-deployment)
- [Configuration](#-configuration)
- [Documentation](#-documentation)

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (optional)
- PostgreSQL 15+ (or use Docker)

### Local Development

```bash
# 1. Clone and setup
git clone https://github.com/solarad-ai/credo-carbon.git
cd credo-carbon

# 2. Backend setup
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Start infrastructure (PostgreSQL, Redis, MailHog)
docker-compose up -d db redis mailhog

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings

# 5. Run backend
uvicorn apps.api.main:app --reload --port 8080

# 6. Frontend setup (new terminal)
cd apps/web
npm install
npm run dev
```

Access the application:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs
- **MailHog**: http://localhost:8025

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                    Port 3000 / Cloud Run                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────────┐
│                        Backend (FastAPI)                         │
│                    Port 8080 / Cloud Run                         │
├─────────────────────────────────────────────────────────────────┤
│  Routers: auth, project, dashboard, marketplace, wallet, etc.   │
├─────────────────────────────────────────────────────────────────┤
│                     Core (Hexagonal Architecture)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Ports     │  │  Container  │  │   Config    │              │
│  │ (Interfaces)│  │    (DI)     │  │ (Settings)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    Infrastructure Adapters                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Local     │  │    GCP      │  │  AWS/Azure  │              │
│  │  (Dev)      │  │ (Production)│  │  (Future)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Cloud Services                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   GCS    │  │ Pub/Sub  │  │  Tasks   │  │ SendGrid │        │
│  │ Storage  │  │  Events  │  │  Queue   │  │  Email   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Database (PostgreSQL)                        │
│                   Cloud SQL / Supabase / Local                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

- **Hexagonal Architecture**: Core business logic is isolated from infrastructure
- **Ports & Adapters**: Interfaces define contracts, adapters implement them
- **Factory Pattern**: `AdapterFactory` creates appropriate adapters based on config
- **Dependency Injection**: `Container` provides lazy-loaded infrastructure services

## 📁 Project Structure

```
credo-carbon/
├── apps/
│   ├── api/                    # FastAPI Backend
│   │   ├── core/               # Core abstractions
│   │   │   ├── config.py       # Centralized settings
│   │   │   ├── container.py    # Dependency injection
│   │   │   ├── ports.py        # Interface definitions
│   │   │   └── models.py       # Database models
│   │   ├── infra/              # Infrastructure adapters
│   │   │   ├── adapters/       # Base classes & factory
│   │   │   ├── local/          # Local dev adapters
│   │   │   └── gcp/            # GCP adapters
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication
│   │   │   ├── project/        # Carbon projects
│   │   │   ├── marketplace/    # Trading
│   │   │   └── ...
│   │   ├── main.py             # Application entry
│   │   └── requirements.txt
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # Pages (App Router)
│       │   ├── components/     # UI components
│       │   └── lib/            # Utilities
│       └── package.json
├── docs/                       # Documentation
├── Dockerfile.api              # Backend container
├── Dockerfile.web              # Frontend container
├── docker-compose.yml          # Local dev stack
└── .env.example                # Environment template
```

## 🐳 Docker

### Local Development with Docker Compose

```bash
# Start infrastructure only (recommended for development)
docker-compose up -d db redis mailhog

# Start full stack (API + Web + Infrastructure)
docker-compose --profile full up -d

# View logs
docker-compose logs -f api

# Stop everything
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Building Images

```bash
# Build API image
docker build -f Dockerfile.api -t credocarbon-api:latest .

# Build Web image
docker build -f Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -t credocarbon-web:latest .

# Run API container
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e CLOUD_PROVIDER=local \
  credocarbon-api:latest
```

## ☁️ Cloud Deployment

### Google Cloud Platform (Recommended)

The platform is optimized for GCP Cloud Run deployment.

```bash
# Build and push to Artifact Registry
docker build -f Dockerfile.api -t asia-south2-docker.pkg.dev/PROJECT/REPO/credocarbon-api:latest .
docker push asia-south2-docker.pkg.dev/PROJECT/REPO/credocarbon-api:latest

# Deploy to Cloud Run
gcloud run deploy credocarbon-api \
  --image asia-south2-docker.pkg.dev/PROJECT/REPO/credocarbon-api:latest \
  --platform managed \
  --region asia-south2 \
  --allow-unauthenticated \
  --set-env-vars "CLOUD_PROVIDER=gcp,GCP_PROJECT_ID=..."
```

See [docs/GCP_DEPLOYMENT.md](docs/GCP_DEPLOYMENT.md) for complete guide.

## ⚙️ Configuration

All configuration is done through environment variables. See [.env.example](.env.example) for the complete list.

### Cloud Provider Selection

```bash
# Use local adapters (development)
CLOUD_PROVIDER=local

# Use GCP adapters (production)
CLOUD_PROVIDER=gcp

# Mix providers (e.g., GCP storage, local everything else)
CLOUD_PROVIDER=local
STORAGE_BACKEND=gcp
```

### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLOUD_PROVIDER` | Cloud backend (local/gcp/aws/azure) | `local` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `SECRET_KEY` | JWT signing key | - |
| `GCP_PROJECT_ID` | GCP project for cloud services | - |
| `GCS_BUCKET_NAME` | GCS bucket for file storage | `temp-garbage` |
| `CORS_ORIGINS` | Allowed CORS origins | `localhost:3000` |

## 📚 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - Detailed architecture and extensibility
- [Docker Guide](docs/DOCKER.md) - Container configuration and usage
- [GCP Deployment](docs/GCP_DEPLOYMENT.md) - Cloud Run deployment guide
- [API Documentation](docs/API_DOCUMENTATION.md) - REST API reference

## 🧩 Extending the Platform

### Adding a New Cloud Provider

1. Create adapter directory: `apps/api/infra/{provider}/`
2. Implement adapters extending base classes:
   ```python
   from apps.api.infra.adapters.base import CloudFileStorageBase
   
   class MyCloudStorageAdapter(CloudFileStorageBase):
       provider = "mycloud"
       uri_scheme = "mycloud"
       
       async def _do_upload(self, path, content, content_type):
           # Implementation
   ```
3. Register in `apps/api/infra/adapters/factory.py`

### Adding a New Feature Module

1. Create module directory: `apps/api/modules/{feature}/`
2. Add `router.py`, `service.py`, `models.py`, `schemas.py`
3. Register router in `apps/api/main.py`

## 📄 License

Proprietary - All rights reserved.
