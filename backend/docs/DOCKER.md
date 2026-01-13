# Docker Guide

This guide covers Docker configuration and usage for the CredoCarbon platform.

## Quick Start

```bash
# Start infrastructure (PostgreSQL, Redis, MailHog)
docker-compose up -d

# Start full stack (API + Web + Infrastructure)
docker-compose --profile full up -d
```

## Docker Compose Services

| Service | Description | Port | URL |
|---------|-------------|------|-----|
| `db` | PostgreSQL 15 | 5432 | `localhost:5432` |
| `redis` | Redis 7 | 6379 | `localhost:6379` |
| `mailhog` | Email testing | 8025 | http://localhost:8025 |
| `api` | Backend (profile: full) | 8080 | http://localhost:8080 |
| `web` | Frontend (profile: full) | 3000 | http://localhost:3000 |

## Common Commands

```bash
# Start infrastructure only (for local development)
docker-compose up -d db redis mailhog

# Start everything including API and Web
docker-compose --profile full up -d

# View logs
docker-compose logs -f api
docker-compose logs -f db

# Stop services
docker-compose down

# Stop and remove volumes (reset data)
docker-compose down -v

# Rebuild images
docker-compose --profile full build

# Restart a specific service
docker-compose restart api
```

## Building Images

### API Image

```bash
# Build
docker build -f Dockerfile.api -t credocarbon-api:latest .

# Run
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e CLOUD_PROVIDER=local \
  -e SECRET_KEY=your-secret-key \
  credocarbon-api:latest
```

### Web Image

```bash
# Build with API URL baked in
docker build -f Dockerfile.web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -t credocarbon-web:latest .

# Run
docker run -p 3000:3000 credocarbon-web:latest
```

## Environment Variables

### Docker Compose Overrides

Create a `.env` file with these variables to customize docker-compose:

```bash
# Database
POSTGRES_USER=credo
POSTGRES_PASSWORD=credo_password
POSTGRES_DB=credo_carbon

# Ports (change if conflicts)
DB_PORT=5432
REDIS_PORT=6379
API_PORT=8080
WEB_PORT=3000

# API Configuration
SECRET_KEY=your-secret-key
CLOUD_PROVIDER=local
```

## Development Workflow

### Recommended Setup

1. Run infrastructure in Docker
2. Run API and Web locally for hot-reload

```bash
# Terminal 1: Infrastructure
docker-compose up -d

# Terminal 2: Backend
cd apps/api
source venv/bin/activate
uvicorn apps.api.main:app --reload --port 8080

# Terminal 3: Frontend
cd apps/web
npm run dev
```

### Full Docker Development

If you prefer everything in Docker:

```bash
docker-compose --profile full up -d

# View API logs
docker-compose logs -f api

# Access API shell
docker-compose exec api bash
```

## Production Considerations

### Image Size Optimization

The Dockerfiles use multi-stage builds to minimize image size:

- API: ~250MB (Python slim + dependencies)
- Web: ~150MB (Node Alpine + standalone Next.js)

### Security

- Both images run as non-root users
- Health checks are enabled
- Only necessary files are included (via .dockerignore)

### Health Checks

```bash
# API
curl http://localhost:8080/health
# Expected: {"status": "ok", "env": "local"}

# Web
curl http://localhost:3000/
# Expected: 200 OK with HTML
```

## Troubleshooting

### Port Conflicts

```bash
# Check what's using a port
netstat -ano | findstr :8080

# Change ports in .env
API_PORT=8081
WEB_PORT=3001
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps db

# View database logs
docker-compose logs db

# Connect to database
docker-compose exec db psql -U credo -d credo_carbon
```

### Container Won't Start

```bash
# View container logs
docker-compose logs api

# Check container status
docker-compose ps -a

# Rebuild image
docker-compose build --no-cache api
```

### Reset Everything

```bash
# Stop all and remove volumes
docker-compose down -v

# Remove all images
docker rmi credocarbon-api:latest credocarbon-web:latest

# Fresh start
docker-compose up -d
```
