# GCP Cloud Run Deployment

This guide covers deploying CredoCarbon to Google Cloud Platform using Cloud Run.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                       │
│  │  Cloud Run   │         │  Cloud Run   │                       │
│  │    (Web)     │────────▶│    (API)     │                       │
│  │  Port 3000   │         │  Port 8080   │                       │
│  └──────────────┘         └──────┬───────┘                       │
│                                  │                               │
│         ┌────────────────────────┼───────────────────────┐       │
│         │                        │                       │       │
│         ▼                        ▼                       ▼       │
│  ┌──────────────┐         ┌──────────────┐       ┌─────────────┐│
│  │     GCS      │         │  Cloud SQL   │       │   Pub/Sub   ││
│  │   Storage    │         │  PostgreSQL  │       │   Events    ││
│  └──────────────┘         └──────────────┘       └─────────────┘│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GCP Project** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Docker** for building images
4. **Artifact Registry** repository created

## Quick Deploy

### 1. Set Environment

```bash
export PROJECT_ID=your-project-id
export REGION=asia-south2
export REPO=your-artifact-repo

gcloud config set project $PROJECT_ID
gcloud auth configure-docker $REGION-docker.pkg.dev
```

### 2. Build and Push Images

```bash
# API
docker build -f Dockerfile.api \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/credocarbon-api:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/credocarbon-api:latest

# Web
docker build -f Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=https://credocarbon-api-xxx.run.app \
  -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/credocarbon-web:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/credocarbon-web:latest
```

### 3. Deploy to Cloud Run

```bash
# Deploy API
gcloud run deploy credocarbon-api \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/credocarbon-api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "CLOUD_PROVIDER=gcp" \
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID" \
  --set-env-vars "GCS_BUCKET_NAME=your-bucket" \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --set-env-vars "SECRET_KEY=your-secret" \
  --set-env-vars "CORS_ORIGINS=https://your-web.run.app"

# Get API URL
API_URL=$(gcloud run services describe credocarbon-api --region $REGION --format 'value(status.url)')

# Deploy Web
gcloud run deploy credocarbon-web \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/credocarbon-web:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000
```

## CI/CD with GitHub Actions

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-cloud-run.yml`.

### Required Secrets

| Secret | Description |
|--------|-------------|
| `GCP_CICD_AUTH` | Service account JSON for CI/CD project |
| `GCP_PROD_AUTH` | Service account JSON for production project |
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key |

### Trigger Deployment

Push to `main` or `gcp-dev` branch to trigger automatic deployment.

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key for authentication |
| `CLOUD_PROVIDER` | Set to `gcp` |
| `GCP_PROJECT_ID` | GCP project ID |
| `GCS_BUCKET_NAME` | GCS bucket for file storage |
| `CORS_ORIGINS` | Web app URL for CORS |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | - |
| `EMAIL_FROM` | Sender email | noreply@credocarbon.com |
| `CLOUD_TASKS_LOCATION` | Cloud Tasks region | asia-south2 |

## GCS Setup

```bash
# Create bucket
gsutil mb -l $REGION gs://your-bucket-name

# Set CORS (if needed for signed URLs)
cat > cors.json << EOF
[
  {
    "origin": ["https://your-web.run.app"],
    "method": ["GET", "PUT"],
    "maxAgeSeconds": 3600
  }
]
EOF
gsutil cors set cors.json gs://your-bucket-name
```

## Database Setup

### Option 1: Cloud SQL

```bash
# Create instance
gcloud sql instances create credocarbon-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION

# Create database
gcloud sql databases create credo_carbon --instance=credocarbon-db

# Create user
gcloud sql users create credo --instance=credocarbon-db --password=your-password
```

### Option 2: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Database
3. Use pooler connection string for Cloud Run

## Monitoring

```bash
# View logs
gcloud run logs read credocarbon-api --region $REGION

# Stream logs
gcloud run logs read credocarbon-api --region $REGION --tail 100 --follow

# View metrics
gcloud run services describe credocarbon-api --region $REGION
```

## Troubleshooting

### Container Won't Start

Check Cloud Run logs:
```bash
gcloud run logs read credocarbon-api --region $REGION --limit 50
```

### Database Connection Errors

- Verify DATABASE_URL is correct
- Check Cloud SQL is accessible (public IP or connector)
- Verify credentials

### CORS Errors

- Update CORS_ORIGINS to include web app URL
- Redeploy API after changes

### Health Check Failures

API should respond to `/health` endpoint:
```bash
curl https://your-api.run.app/health
```
