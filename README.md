# CredoCarbon - Carbon Credit Management Platform

A comprehensive enterprise-grade full-stack platform for managing carbon credits across the entire project lifecycle — from registration and validation to issuance, trading, and retirement.

![Platform Overview](https://img.shields.io/badge/Status-Production%20Ready-green)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-teal)
![Database](https://img.shields.io/badge/Database-SQLite%2FPostgreSQL-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Python](https://img.shields.io/badge/Python-3.12+-yellow)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Models](#-database-models)
- [Frontend Pages](#-frontend-pages)
- [Super Admin Dashboard](#-super-admin-dashboard)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Deployment](#-deployment)

---

## 🌿 Overview

CredoCarbon is a multi-role carbon credit management ecosystem designed to support the complete carbon credit lifecycle:

| Role | Description |
|------|-------------|
| **Developers** | Register carbon projects, manage validation/verification, issue credits, sell on marketplace |
| **Buyers** | Browse marketplace, purchase credits, manage portfolio, retire credits with certificates |
| **VVBs** | Validate projects and verify emission reductions |
| **Registries** | Review projects and issue carbon credits |
| **Admins** | Platform administration and user management |
| **Super Admins** | Full platform control, configuration, analytics |

### Multi-Registry Support
- **VCS** (Verified Carbon Standard)
- **Gold Standard**
- **CDM** (Clean Development Mechanism)
- **GCC** (Global Carbon Council)
- **ACR** (American Carbon Registry)

---

## ✨ Features

### 🏗️ Developer Portal

| Feature | Description |
|---------|-------------|
| **Project Registration Wizard** | 7-step guided project setup with validation |
| **Project Types** | Solar, Wind, Hydro, Biogas, Afforestation/Reforestation |
| **Lifecycle Management** | Draft → Validation → Verification → Registry → Issuance |
| **Carbon Estimation** | Multiple methodology support (CDM, Verra, Gold Standard) |
| **Document Management** | PDD, evidence, permits, boundary files upload |
| **Market Listings** | Create sell orders, manage pricing |
| **Credit Holdings** | View issued credits by project |
| **Revenue Analytics** | Track sales, portfolio value |

### 🛒 Buyer Portal

| Feature | Description |
|---------|-------------|
| **Marketplace** | Browse credits with filters (registry, type, vintage, price) |
| **Wallet** | View holdings, transaction history |
| **Offers** | Make/receive offers, negotiate pricing |
| **Retirements** | Retire credits, generate certificates |
| **Portfolio** | Track impact, carbon offset statistics |
| **Notifications** | Real-time updates on purchases, sales |

### 🛡️ Super Admin Dashboard

| Feature | Description |
|---------|-------------|
| **User Management** | View/edit all users, activate/deactivate |
| **Admin Management** | Create admin accounts with permission levels |
| **Project Oversight** | Monitor all projects, change statuses |
| **Transaction History** | View all marketplace transactions |
| **Audit Logs** | Complete system audit trail |
| **Analytics** | Platform-wide statistics and trends |
| **API Health** | Monitor system health and uptime |
| **Task Management** | Track feature requests, methodologies |
| **Platform Configuration** | Registries, project types, feature flags, fees |

### 🔍 VVB Portal (NEW)

| Feature | Description |
|---------|-------------|
| **Validation Tasks** | Review projects, complete validation checklists |
| **Verification Tasks** | Verify emission reductions, adjust calculations |
| **Query Management** | Raise clarifications, review responses |
| **Project Review** | Access project documents and data |
| **Notifications** | Receive task assignments and updates |

### 🏛️ Registry Portal (NEW)

| Feature | Description |
|---------|-------------|
| **Project Review** | Review validated/verified projects |
| **Credit Issuance** | Issue credits after approval |
| **Credit Management** | Track all issued credit batches |
| **Query Management** | Raise clarifications with developers |
| **Issuance Records** | Complete issuance history |

---

## 🏗️ Architecture

```
credo-carbon-anti-gravity/
├── apps/
│   ├── api/                          # FastAPI Backend
│   │   ├── core/                     # Core infrastructure
│   │   │   ├── database.py           # SQLAlchemy setup
│   │   │   ├── models.py             # 30+ database models
│   │   │   ├── ports.py              # Port interfaces (hexagonal)
│   │   │   └── container.py          # Dependency injection
│   │   │
│   │   ├── modules/                  # Feature modules
│   │   │   ├── auth/                 # Authentication & JWT
│   │   │   │   ├── router.py         # Auth endpoints
│   │   │   │   ├── service.py        # Business logic
│   │   │   │   ├── schemas.py        # Pydantic models
│   │   │   │   └── dependencies.py   # Auth guards
│   │   │   │
│   │   │   ├── project/              # Project management
│   │   │   ├── marketplace/          # Listings & offers
│   │   │   ├── wallet/               # Holdings & transactions
│   │   │   ├── retirement/           # Credit retirement
│   │   │   ├── notification/         # User notifications
│   │   │   ├── dashboard/            # Statistics
│   │   │   ├── audit/                # Audit logging
│   │   │   ├── generation/           # Carbon estimation
│   │   │   │   └── methodologies/    # CDM, Verra, GS implementations
│   │   │   └── superadmin/           # Admin dashboard
│   │   │
│   │   ├── infra/                    # Infrastructure adapters
│   │   │   └── local/                # Local development adapters
│   │   │
│   │   ├── main.py                   # FastAPI entry point
│   │   ├── seed_data.py              # Database seeding
│   │   └── cleanup_db.py             # Database cleanup
│   │
│   ├── uploads/                      # File upload storage
│   │
│   └── web/                          # Next.js Frontend
│       └── src/
│           ├── app/                  # App Router pages
│           │   ├── auth/             # Login page
│           │   ├── developer/        # Developer registration
│           │   ├── buyer/            # Buyer registration
│           │   ├── dashboard/        # Protected dashboards
│           │   │   ├── developer/    # Developer dashboard
│           │   │   └── buyer/        # Buyer dashboard
│           │   ├── superadmin/       # Super admin portal
│           │   │   ├── login/        # Admin login
│           │   │   └── dashboard/    # Admin dashboard
│           │   ├── forgot-password/  # Password reset
│           │   └── reset-password/   # Password reset confirmation
│           │
│           ├── components/           # Reusable components
│           │   ├── ui/               # shadcn/ui components
│           │   └── ...               # Feature components
│           │
│           └── lib/                  # Utilities
│               ├── api.ts            # API client (600+ lines)
│               ├── constants.ts      # Shared constants
│               ├── reports.ts        # Report generation
│               └── stores/           # Zustand stores
│
├── data/                             # Static data files
├── infra/                            # Infrastructure configs
│   └── local/                        # Docker compose
├── credo_carbon.db                   # SQLite database
├── .env                              # Environment variables
├── alembic.ini                       # DB migrations config
├── start-dev.bat                     # Windows dev script
└── README.md                         # This file
```

---

## 🔧 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python web framework |
| **SQLAlchemy** | ORM for database operations |
| **Pydantic** | Data validation and schemas |
| **python-jose** | JWT token handling |
| **bcrypt** | Password hashing |
| **uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Radix UI components |
| **Zustand** | State management |
| **Lucide Icons** | Icon library |
| **Recharts** | Data visualization |

### Database
| Technology | Purpose |
|------------|---------|
| **SQLite** | Development database |
| **PostgreSQL** | Production database (recommended) |
| **Alembic** | Database migrations |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd credo-carbon-anti-gravity
   ```

2. **Set up Python virtual environment**
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate (Windows)
   .\venv\Scripts\activate

   # Activate (Mac/Linux)
   source venv/bin/activate
   ```

3. **Install backend dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy passlib python-jose bcrypt python-multipart aiofiles email-validator python-dotenv
   ```

4. **Install frontend dependencies**
   ```bash
   cd apps/web
   npm install
   cd ../..
   ```

5. **Create environment file**
   ```bash
   # Create .env in root directory
   cp .env.example .env
   ```

6. **Initialize the database**
   ```bash
   python -c "from apps.api.core.database import engine, Base; from apps.api.core.models import *; Base.metadata.create_all(bind=engine)"
   ```

7. **Seed the database** (optional)
   ```bash
   python -m apps.api.seed_data
   ```

### Running the Application

**Option 1: Using startup script (Windows)**
```bash
.\start-dev.bat
```

**Option 2: Manual startup**

```bash
# Terminal 1 - Backend (port 8000)
uvicorn apps.api.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 - Frontend (port 3000)
cd apps/web
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **API Docs (ReDoc)** | http://localhost:8000/redoc |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Developer | developer@test.com | Test123! |
| Buyer | buyer@test.com | Test123! |
| Super Admin | superadmin@credocarbon.com | SuperAdmin@123 |

---

## 📡 API Documentation

### Authentication Module (`/api/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Generic user registration |
| `/auth/login` | POST | Generic user login |
| `/auth/developer/signup` | POST | Developer registration |
| `/auth/developer/login` | POST | Developer login |
| `/auth/buyer/signup` | POST | Buyer registration |
| `/auth/buyer/login` | POST | Buyer login |
| `/auth/vvb/login` | POST | VVB login |
| `/auth/registry/login` | POST | Registry login |
| `/auth/superadmin/login` | POST | Super admin login |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |

### Project Module (`/api/projects`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/projects/` | GET | List user's projects |
| `/projects/` | POST | Create new project |
| `/projects/{id}` | GET | Get project details |
| `/projects/{id}` | PUT | Update project |
| `/projects/{id}` | DELETE | Delete project |
| `/projects/{id}/wizard` | PUT | Update wizard step |
| `/projects/{id}/documents` | POST | Upload document |
| `/projects/{id}/submit-vvb` | POST | Submit to VVB |
| `/projects/{id}/submit-registry` | POST | Submit to registry |

### Marketplace Module (`/api/marketplace`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/marketplace/listings` | GET | Browse listings |
| `/marketplace/listings` | POST | Create listing |
| `/marketplace/listings/{id}` | PUT | Update listing |
| `/marketplace/listings/{id}` | DELETE | Cancel listing |
| `/marketplace/offers` | GET | User's offers |
| `/marketplace/offers` | POST | Make offer |
| `/marketplace/offers/{id}/accept` | POST | Accept offer |
| `/marketplace/offers/{id}/reject` | POST | Reject offer |

### Wallet Module (`/api/wallet`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wallet/summary` | GET | Holdings summary |
| `/wallet/holdings` | GET | Detailed holdings |
| `/wallet/transactions` | GET | Transaction history |

### Retirement Module (`/api/retirements`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/retirements/` | GET | User's retirements |
| `/retirements/` | POST | Retire credits |
| `/retirements/{id}` | GET | Retirement details |
| `/retirements/{id}/certificate` | GET | Download certificate |

### Dashboard Module (`/api/dashboard`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/developer/stats` | GET | Developer statistics |
| `/dashboard/buyer/stats` | GET | Buyer statistics |

### Super Admin Module (`/api/superadmin`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/superadmin/stats` | GET | Platform statistics |
| `/superadmin/users` | GET | List all users |
| `/superadmin/users/{id}` | PUT | Update user |
| `/superadmin/admins` | GET | List admins |
| `/superadmin/admins` | POST | Create admin |
| `/superadmin/projects` | GET | All projects |
| `/superadmin/transactions` | GET | All transactions |
| `/superadmin/audit-logs` | GET | Audit trail |
| `/superadmin/health` | GET | System health |
| `/superadmin/analytics` | GET | Analytics data |
| `/superadmin/config/registries` | GET/POST/PUT/DELETE | Registry management |
| `/superadmin/config/project-types` | GET/POST/PUT/DELETE | Project types |
| `/superadmin/config/feature-flags` | GET/POST/PUT/DELETE | Feature flags |
| `/superadmin/config/announcements` | GET/POST/PUT/DELETE | Announcements |
| `/superadmin/config/fees` | GET/POST/PUT/DELETE | Platform fees |
| `/superadmin/config/email-templates` | GET/POST/PUT/DELETE | Email templates |
| `/superadmin/vvb-users` | POST | Create VVB user |
| `/superadmin/registry-users` | POST | Create Registry user |
| `/superadmin/projects/{id}/assign-vvb` | POST | Assign project to VVB |
| `/superadmin/projects/{id}/assign-registry` | POST | Assign project to Registry |

### VVB Module (`/api/vvb`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/vvb/dashboard/stats` | GET | VVB dashboard statistics |
| `/vvb/dashboard/projects` | GET | Assigned projects |
| `/vvb/validations` | GET | List validation tasks |
| `/vvb/validations/{id}` | GET/PUT | Validation task details |
| `/vvb/verifications` | GET | List verification tasks |
| `/vvb/verifications/{id}` | GET/PUT | Verification task details |
| `/vvb/queries` | GET/POST | Query management |
| `/vvb/queries/{id}/resolve` | PUT | Resolve query |

### Registry Module (`/api/registry`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/registry/dashboard/stats` | GET | Registry dashboard statistics |
| `/registry/dashboard/projects` | GET | Projects for review |
| `/registry/reviews` | GET | List reviews |
| `/registry/reviews/{id}` | GET/PUT | Review details |
| `/registry/issuances` | GET/POST | Credit issuances |
| `/registry/issuances/{id}/process` | POST | Process issuance |
| `/registry/credits` | GET | All credit batches |

---

## 🗄️ Database Models

### Core Models

| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | User accounts with roles (Developer, Buyer, Admin, SuperAdmin) |
| `Project` | `projects` | Carbon projects with wizard data and lifecycle status |
| `Document` | `documents` | Uploaded project documents |
| `CreditHolding` | `credit_holdings` | Credit ownership records |
| `Transaction` | `transactions` | All credit movements (purchase, sale, transfer, retirement) |
| `MarketListing` | `market_listings` | Marketplace sell orders |
| `Offer` | `offers` | Purchase offers on listings |
| `Retirement` | `retirements` | Retired credits with certificates |
| `Notification` | `notifications` | User notifications |
| `AuditLog` | `audit_logs` | System audit trail |

### Admin Models

| Model | Table | Description |
|-------|-------|-------------|
| `AdminTask` | `admin_tasks` | Task management for features/methodologies |

### Platform Configuration Models

| Model | Table | Description |
|-------|-------|-------------|
| `Registry` | `registries` | Carbon credit registries (VCS, GS, CDM) |
| `ProjectTypeConfig` | `project_type_configs` | Project categories configuration |
| `FeatureFlag` | `feature_flags` | Feature toggle switches |
| `Announcement` | `announcements` | Platform banners |
| `PlatformFee` | `platform_fees` | Fee configuration |
| `EmailTemplate` | `email_templates` | Email notification templates |
| `DocumentTemplate` | `document_templates` | PDD/ER report templates |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | DEVELOPER, BUYER, ADMIN, SUPER_ADMIN, VVB, REGISTRY |
| `ProjectStatus` | DRAFT, SUBMITTED_TO_VVB, VALIDATION_PENDING, VALIDATION_APPROVED, VERIFICATION_PENDING, VERIFICATION_APPROVED, REGISTRY_REVIEW, ISSUED |
| `TransactionType` | PURCHASE, SALE, TRANSFER_IN, TRANSFER_OUT, ISSUANCE, RETIREMENT |
| `TransactionStatus` | PENDING, COMPLETED, FAILED, CANCELLED |
| `ListingStatus` | ACTIVE, SOLD, CANCELLED, EXPIRED |
| `RetirementStatus` | PENDING, COMPLETED, FAILED |
| `NotificationType` | PURCHASE, SALE, ISSUANCE, VERIFICATION, VALIDATION, PROJECT, MARKET, RETIREMENT, SYSTEM |

---

## 🖥️ Frontend Pages

### Developer Dashboard (`/dashboard/developer`)

| Page | Path | Description |
|------|------|-------------|
| Dashboard Home | `/dashboard/developer` | Overview, stats, quick actions |
| Projects | `/dashboard/developer/projects` | Project list and management |
| New Project | `/dashboard/developer/project/new` | 7-step project wizard |
| Project Details | `/dashboard/developer/project/[id]` | Project information |
| Edit Project | `/dashboard/developer/project/[id]/edit` | Modify project details |
| Registry Submission | `/dashboard/developer/project/[id]/registry-submission` | Submit to registry |
| Lifecycle | `/dashboard/developer/lifecycle` | Track project stages |
| Market | `/dashboard/developer/market` | Manage listings |
| Profile | `/dashboard/developer/profile` | KYC and settings |
| Notifications | `/dashboard/developer/notifications` | Notification center |

### Buyer Dashboard (`/dashboard/buyer`)

| Page | Path | Description |
|------|------|-------------|
| Dashboard Home | `/dashboard/buyer` | Portfolio overview |
| Marketplace | `/dashboard/buyer/marketplace` | Browse credits |
| Wallet | `/dashboard/buyer/wallet` | Holdings & transactions |
| Offers | `/dashboard/buyer/offers` | Manage offers |
| Retirements | `/dashboard/buyer/retirements` | Retire credits |
| Profile | `/dashboard/buyer/profile` | KYC and settings |
| Notifications | `/dashboard/buyer/notifications` | Notification center |

### VVB Dashboard (`/vvb/dashboard`) (NEW)

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/vvb/dashboard` | Overview with pending tasks |
| Projects | `/vvb/dashboard/projects` | Assigned projects |
| Validation Detail | `/vvb/dashboard/validations/[id]` | Validation workflow |
| Verification Detail | `/vvb/dashboard/verifications/[id]` | Verification workflow |
| Queries | `/vvb/dashboard/queries` | Query management |
| Notifications | `/vvb/dashboard/notifications` | VVB notifications |
| Profile | `/vvb/dashboard/profile` | Profile settings |

### Registry Dashboard (`/registry/dashboard`) (NEW)

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/registry/dashboard` | Overview with pending reviews |
| Projects | `/registry/dashboard/projects` | Projects for review |
| Review Detail | `/registry/dashboard/reviews/[id]` | Review workflow |
| Issuances | `/registry/dashboard/issuances` | Credit issuance list |
| Credits | `/registry/dashboard/credits` | Issued credits management |
| Queries | `/registry/dashboard/queries` | Query management |
| Notifications | `/registry/dashboard/notifications` | Registry notifications |
| Profile | `/registry/dashboard/profile` | Profile settings |

### Super Admin Dashboard (`/superadmin/dashboard`)

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/superadmin/dashboard` | Platform overview |
| Users | `/superadmin/dashboard/users` | User management |
| Admins | `/superadmin/dashboard/admins` | Admin management |
| Projects | `/superadmin/dashboard/projects` | Project oversight |
| Transactions | `/superadmin/dashboard/transactions` | Transaction history |
| Marketplace | `/superadmin/dashboard/marketplace` | Listing management |
| Retirements | `/superadmin/dashboard/retirements` | Retirement records |
| Configuration | `/superadmin/dashboard/config` | Platform settings hub |
| ├─ Registries | `/superadmin/dashboard/config/registries` | Registry CRUD |
| ├─ Project Types | `/superadmin/dashboard/config/project-types` | Project type CRUD |
| ├─ Feature Flags | `/superadmin/dashboard/config/feature-flags` | Feature toggles |
| ├─ Announcements | `/superadmin/dashboard/config/announcements` | Banner management |
| ├─ Fees | `/superadmin/dashboard/config/fees` | Fee configuration |
| └─ Email Templates | `/superadmin/dashboard/config/email-templates` | Template editor |
| Audit Logs | `/superadmin/dashboard/audit` | System audit trail |
| API Health | `/superadmin/dashboard/api-health` | System monitoring |
| Analytics | `/superadmin/dashboard/analytics` | Platform analytics |
| Tasks | `/superadmin/dashboard/tasks` | Task tracking |

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=sqlite:///./credo_carbon.db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Environment
ENV=local

# Super Admin Credentials (used by seed script)
SUPERADMIN_EMAIL=superadmin@credocarbon.com
SUPERADMIN_PASSWORD=SuperAdmin@123
SUPERADMIN_NAME=Super Admin

# Frontend (apps/web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Creating Super Admin User

After configuring your `.env` file, run:

```bash
python -c "from apps.api.scripts.seed_superadmin import create_superadmin; create_superadmin()"
```

---

## 🛠️ Development

### Database Commands

```bash
# Initialize database (create tables)
python -c "from apps.api.core.database import engine, Base; from apps.api.core.models import *; Base.metadata.create_all(bind=engine)"

# Seed with test data
python -m apps.api.seed_data

# Clean database (drop all tables)
python -m apps.api.cleanup_db

# Initialize fresh database
python -m apps.api.init_db
```

### Code Style

- **Backend**: Python with type hints, PEP 8 style
- **Frontend**: TypeScript strict mode, ESLint + Prettier
- **API**: RESTful conventions, Pydantic validation

### Testing

```bash
# Backend tests (when implemented)
pytest apps/api/tests/

# Frontend tests
cd apps/web
npm test
```

---

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set strong `SECRET_KEY`
   - Configure `DATABASE_URL` for PostgreSQL
   - Set `ENV=production`

2. **Database**
   - Migrate to PostgreSQL
   - Run migrations with Alembic
   - Set up backups

3. **Security**
   - Enable HTTPS
   - Update CORS origins
   - Change default admin credentials
   - Enable rate limiting

4. **Frontend**
   ```bash
   cd apps/web
   npm run build
   ```

5. **Backend**
   ```bash
   uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

---

## 📄 License

This project is proprietary software owned by **Credo Carbon**. All rights reserved.

---

## 👥 Team

| Role | Name |
|------|------|
| **Co-Founder & CEO** | Dr. Haider Addas |
| **CTO & Lead Developer** | Ritesh Kumar Anand |

---

## 🏢 About Credo Carbon

**Credo Carbon** is dedicated to building innovative solutions for carbon credit management, enabling organizations to participate in voluntary carbon markets with transparency and efficiency.

---

## 🤝 Support

For support, please contact the Credo Carbon team or create an issue in this repository.

---

© 2024 Credo Carbon. All Rights Reserved.

