# CredoCarbon Quick Start Guide

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd credo-carbon-anti-gravity
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your database URL
```

### 3. Frontend Setup
```bash
cd apps/web
npm install
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb credocarbon

# Run migrations (tables auto-create on startup)
```

## Running the Application

### Start Backend
```bash
# From project root
uvicorn apps.api.main:app --reload --port 8000
```

### Start Frontend
```bash
# In another terminal
cd apps/web
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Creating Test Users

### Using SuperAdmin API

First, create a SuperAdmin in the database, then use these endpoints:

```bash
# Create VVB User
curl -X POST http://localhost:8000/api/superadmin/vvb-users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"vvb@test.com","password":"Test123!","name":"VVB User","organization":"Test VVB"}'

# Create Registry User
curl -X POST http://localhost:8000/api/superadmin/registry-users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"registry@test.com","password":"Test123!","name":"Registry User","organization":"Test Registry"}'
```

## Login URLs

| Role | URL |
|------|-----|
| Developer | http://localhost:3000/developer/login |
| Buyer | http://localhost:3000/buyer/login |
| VVB | http://localhost:3000/vvb/login |
| Registry | http://localhost:3000/registry/login |
| Admin | http://localhost:3000/admin/login |
| SuperAdmin | http://localhost:3000/superadmin/login |

## Workflow Overview

```
Developer creates project
        ↓
Project submitted to VVB
        ↓
VVB validates project
        ↓
VVB verifies emission reductions
        ↓
Project submitted to Registry
        ↓
Registry reviews and approves
        ↓
Credits issued to Developer
        ↓
Developer lists on Marketplace
        ↓
Buyer purchases credits
        ↓
Buyer retires credits
```

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Module Not Found
```bash
# Ensure you're in project root
cd credo-carbon-anti-gravity
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

### CORS Errors
- Check NEXT_PUBLIC_API_URL in frontend
- Verify CORS settings in backend

## Support

Email: support@credocarbon.com
