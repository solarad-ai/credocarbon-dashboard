# CredoCarbon Project Architecture & Dependencies

## 📁 Project Structure

```
credo-carbon/
├── apps/
│   ├── api/              # FastAPI Backend
│   │   ├── core/         # Core models, database, ports
│   │   ├── modules/      # Feature modules (auth, project, dashboard, etc.)
│   │   ├── infra/        # Infrastructure adapters
│   │   ├── scripts/      # Utility scripts
│   │   └── main.py       # FastAPI app entry point
│   │
│   ├── web/              # Next.js Frontend
│   │   └── src/
│   │       ├── app/      # Next.js 13+ app directory
│   │       ├── components/ # Reusable UI components
│   │       └── lib/      # API client & utilities
│   │
│   └── uploads/          # File uploads storage
│
├── data/                 # Data files
├── docs/                 # Documentation
├── infra/                # Infrastructure configs
└── public/               # Public assets
```

## 🔧 Backend Architecture (FastAPI)

### Core Components

**1. Main Application** (`apps/api/main.py`)
- FastAPI app initialization
- CORS middleware configuration
- Router registration with `/api` prefix
- Database table creation on startup

**2. Database** (`apps/api/core/database.py`)
- PostgreSQL via SQLAlchemy
- Connection: Supabase (production) or local PostgreSQL
- Session management with `get_db()` dependency

**3. Models** (`apps/api/core/models.py`)
- User (roles: DEVELOPER, BUYER, VVB, REGISTRY, ADMIN, SUPER_ADMIN)
- Project (with wizard_data JSON field)
- CreditHolding, Transaction, MarketListing
- Retirement, Offer, Notification, etc.

### Module Structure

Each module follows this pattern:
```
module_name/
├── router.py      # API endpoints
├── models.py      # SQLAlchemy models (if needed)
├── schemas.py     # Pydantic schemas
└── service.py     # Business logic
```

### Key Modules

**1. Auth Module** (`apps/api/modules/auth/`)
- Role-based authentication
- JWT token generation
- Separate login endpoints for each role:
  - `/api/auth/developer/login`
  - `/api/auth/buyer/login`
  - `/api/auth/vvb/login`
  - `/api/auth/registry/login`
  - `/api/auth/admin/login`
  - `/api/auth/superadmin/login`

**2. Project Module** (`apps/api/modules/project/`)
- CRUD operations for projects
- Wizard data storage in JSON field
- Endpoints:
  - `POST /api/projects/` - Create project
  - `GET /api/projects/` - List projects
  - `GET /api/projects/{id}` - Get project
  - `PUT /api/projects/{id}` - Update project
  - `PUT /api/projects/{id}/wizard` - Update wizard data
  - `DELETE /api/projects/{id}` - Delete project

**3. Dashboard Module** (`apps/api/modules/dashboard/`)
- Aggregated statistics
- Activity feeds
- Project summaries
- Endpoints:
  - `GET /api/dashboard/developer/stats`
  - `GET /api/dashboard/buyer/stats`
  - `GET /api/dashboard/activity`
  - `GET /api/dashboard/projects/summary`
  - `GET /api/dashboard/marketplace/featured`

**4. Other Modules**
- **Generation**: Credit estimation & generation data
- **Marketplace**: Listings, offers, transactions
- **Retirement**: Credit retirement
- **VVB**: Validation & verification tasks
- **Registry**: Registry reviews & issuance
- **Admin**: Platform administration
- **Superadmin**: System-wide management

## 🎨 Frontend Architecture (Next.js)

### API Client (`apps/web/src/lib/api.ts`)

**Base Configuration:**
```typescript
API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
```

**Key API Clients:**
- `projectApi` - Project CRUD operations
- `dashboardApi` - Dashboard data
- `marketplaceApi` - Marketplace operations
- `authApi` - Authentication
- `adminApi`, `vvbApi`, `registryApi`, etc.

### Dashboard Structure

**Multi-Role Dashboards:**
1. **Developer** (`/dashboard/developer`)
   - Project creation wizard
   - Credit estimation
   - Project management

2. **Buyer** (`/dashboard/buyer`)
   - Marketplace browsing
   - Credit purchases
   - Retirement

3. **VVB** (`/vvb/dashboard`)
   - Validation tasks
   - Verification tasks

4. **Registry** (`/registry/dashboard`)
   - Project reviews
   - Credit issuance

5. **Platform Admin** (`/admin/dashboard`)
   - User management
   - System monitoring

6. **Super Admin** (`/superadmin/dashboard`)
   - Full system control
   - Configuration management

## 🔄 Data Flow

### Project Creation Flow

```
1. User clicks "New Project" in Developer Dashboard
2. Frontend: POST /api/projects/ with projectType
3. Backend: Creates Project with status=DRAFT, returns project ID
4. Frontend: Navigates to /dashboard/developer/project/{id}/wizard/basic-info
5. User fills form → Auto-save triggers
6. Frontend: PUT /api/projects/{id} with wizard_data
7. Backend: Updates project.wizard_data JSON field
8. Repeat for each wizard step
```

### Authentication Flow

```
1. User enters credentials on role-specific login page
2. Frontend: POST /api/auth/{role}/login
3. Backend: Validates credentials, generates JWT
4. Frontend: Stores token in localStorage
5. All subsequent requests include: Authorization: Bearer {token}
6. Backend: Validates token via get_current_user dependency
```

## 🔗 Critical Dependencies

### Backend → Frontend

**API URL Configuration:**
- Backend runs on: `http://localhost:8000` (dev) or Cloud Run (prod)
- All routes prefixed with `/api`
- Frontend must call: `{API_BASE_URL}/endpoint`
  - ✅ Correct: `http://localhost:8000/api/projects`
  - ❌ Wrong: `http://localhost:8000/api/api/projects`

### Frontend → Backend

**Environment Variables:**
- `NEXT_PUBLIC_API_URL` must point to backend
- Local dev: `http://127.0.0.1:8000/api`
- Production: `https://credocarbon-api-xxxxx.a.run.app/api`

## 🗄️ Database Schema

### Key Tables

**users**
- id, email, password_hash, role, profile_data (JSON)

**projects**
- id, developer_id, project_type, status, name, code
- wizard_data (JSON) - Stores all wizard form data
- wizard_step - Current wizard step

**credit_holdings**
- id, user_id, project_id, quantity, available

**transactions**
- id, user_id, project_id, type, quantity, amount_cents

**market_listings**
- id, seller_id, project_id, quantity, price_per_ton_cents

**retirements**
- id, user_id, quantity, beneficiary_name, status

## 🚨 Common Issues & Solutions

### Issue 1: Double `/api` in URLs
**Cause:** API_BASE_URL includes `/api`, endpoints also include `/api`
**Solution:** Remove `/api` prefix from endpoint calls in `api.ts`

### Issue 2: 404 Errors on API Calls
**Cause:** Backend not running or wrong URL
**Check:** 
```bash
ps aux | grep uvicorn  # Check if backend running
curl http://localhost:8000/health  # Test backend
```

### Issue 3: Auto-save Not Working
**Cause:** Project ID not available or save function not awaited
**Solution:** Ensure project is created before save, use async/await

### Issue 4: Logout Back Button Issue
**Cause:** Using router.push() instead of window.location.replace()
**Solution:** Use `window.location.replace()` to prevent back navigation

## 🔐 Security

### Authentication
- JWT tokens stored in localStorage
- Token included in Authorization header
- Backend validates via `get_current_user` dependency

### Authorization
- Role-based access control (RBAC)
- Each endpoint checks user role
- Developers can only access their own projects

## 🚀 Running the Application

### Backend
```bash
cd /path/to/credo-carbon
source venv/bin/activate
uvicorn apps.api.main:app --reload --port 8000
```

### Frontend
```bash
cd apps/web
npm run dev
```

### Environment Setup
1. Create `.env.local` in `apps/web/`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

2. Backend uses `.env` or environment variables for DATABASE_URL

## 📊 Current Status

✅ **Working:**
- Backend API running on port 8000
- Frontend running on port 3000
- Authentication for all roles
- Project CRUD operations
- Dashboard statistics

⚠️ **Recently Fixed:**
- Double `/api` URL issue
- Logout security (back button)
- Auto-save functionality
- PPA duration validation (min=0)

## 🔍 Debugging Tips

1. **Check Backend Logs:**
```bash
# Terminal where uvicorn is running shows all API requests
```

2. **Check Frontend Console:**
```javascript
// Browser DevTools → Console
// Look for API errors, network failures
```

3. **Test API Directly:**
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/projects/ -H "Authorization: Bearer {token}"
```

4. **Database Inspection:**
```bash
# Connect to PostgreSQL and query tables
psql $DATABASE_URL
SELECT * FROM users;
SELECT * FROM projects;
```
