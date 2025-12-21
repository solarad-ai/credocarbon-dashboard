# CredoCarbon API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Developer Login
```http
POST /api/auth/developer/login
Content-Type: application/json

{
  "email": "developer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "developer@example.com",
    "role": "DEVELOPER",
    "is_verified": true
  }
}
```

### Buyer Login
```http
POST /api/auth/buyer/login
```

### VVB Login
```http
POST /api/auth/vvb/login
```

### Registry Login
```http
POST /api/auth/registry/login
```

### Admin Login
```http
POST /api/auth/admin/login
```

### SuperAdmin Login
```http
POST /api/auth/superadmin/login
```

---

## VVB Endpoints

### Get Dashboard Stats
```http
GET /api/vvb/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pending_validations": 5,
  "in_progress_validations": 2,
  "pending_verifications": 3,
  "in_progress_verifications": 1,
  "open_queries": 4,
  "completed_this_month": 8
}
```

### Get Assigned Projects
```http
GET /api/vvb/dashboard/projects
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "project_id": 1,
    "project_name": "Solar Farm Alpha",
    "project_code": "SF-2024-001",
    "project_type": "renewable_energy",
    "developer_name": "Green Energy Corp",
    "task_type": "validation",
    "task_id": 1,
    "task_status": "PENDING",
    "assigned_at": "2024-01-15T10:00:00Z",
    "open_queries": 0
  }
]
```

### Get Validation Task
```http
GET /api/vvb/validations/{task_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "project_name": "Solar Farm Alpha",
  "project_code": "SF-2024-001",
  "project_type": "renewable_energy",
  "developer_name": "Green Energy Corp",
  "vvb_user_id": 5,
  "status": "IN_PROGRESS",
  "lead_auditor": "John Doe",
  "reviewer": "Jane Smith",
  "checklist": {
    "methodology": true,
    "boundaries": true,
    "additionality": false
  },
  "remarks": "Pending additionality review",
  "assigned_at": "2024-01-15T10:00:00Z",
  "started_at": "2024-01-16T09:00:00Z"
}
```

### Update Validation Task
```http
PUT /api/vvb/validations/{task_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "checklist": {
    "methodology": true,
    "boundaries": true,
    "additionality": true,
    "baseline": true,
    "emission_calculations": true
  },
  "remarks": "All criteria met",
  "decision_notes": "Project approved for verification phase"
}
```

### Get Verification Task
```http
GET /api/vvb/verifications/{task_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "project_name": "Solar Farm Alpha",
  "vvb_user_id": 5,
  "status": "IN_PROGRESS",
  "monitoring_period_start": "2024-01-01",
  "monitoring_period_end": "2024-06-30",
  "claimed_reductions": 50000,
  "verified_reductions": 48500,
  "checklist": {},
  "assigned_at": "2024-07-01T10:00:00Z"
}
```

### Update Verification Task
```http
PUT /api/vvb/verifications/{task_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "VERIFIED",
  "verified_ers": 48500,
  "adjustments": 1000,
  "leakage_deduction": 300,
  "buffer_deduction": 200,
  "remarks": "Minor adjustment for measurement uncertainty"
}
```

### Get Queries
```http
GET /api/vvb/queries
Authorization: Bearer <token>
```

### Create Query
```http
POST /api/vvb/queries
Authorization: Bearer <token>
Content-Type: application/json

{
  "validation_task_id": 1,
  "category": "METHODOLOGY",
  "query_text": "Please clarify the baseline assumptions used in section 3.2"
}
```

### Resolve Query
```http
PUT /api/vvb/queries/{query_id}/resolve
Authorization: Bearer <token>
```

---

## Registry Endpoints

### Get Dashboard Stats
```http
GET /api/registry/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pending_reviews": 3,
  "in_progress_reviews": 2,
  "pending_issuances": 5,
  "total_credits_issued": 500000,
  "open_queries": 1,
  "completed_this_month": 4
}
```

### Get Projects for Review
```http
GET /api/registry/dashboard/projects
Authorization: Bearer <token>
```

### Get Review Details
```http
GET /api/registry/reviews/{review_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "project_id": 1,
  "project_name": "Solar Farm Alpha",
  "project_code": "SF-2024-001",
  "project_type": "renewable_energy",
  "developer_name": "Green Energy Corp",
  "registry_user_id": 6,
  "registry_name": "GCC",
  "status": "PENDING",
  "checklist": {},
  "conditions": null,
  "rejection_reason": null,
  "submitted_at": "2024-07-15T10:00:00Z"
}
```

### Update Review
```http
PUT /api/registry/reviews/{review_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "checklist": {
    "methodology_approved": true,
    "validation_complete": true,
    "verification_complete": true,
    "ready_for_issuance": true
  },
  "decision_notes": "All requirements met"
}
```

### Get Issuances
```http
GET /api/registry/issuances
Authorization: Bearer <token>
```

### Create Issuance
```http
POST /api/registry/issuances
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": 1,
  "quantity": 48500,
  "vintage_year": 2024
}
```

### Process Issuance
```http
POST /api/registry/issuances/{issuance_id}/process
Authorization: Bearer <token>

?registry_reference_id=GCC-2024-001234
&certificate_url=https://example.com/cert.pdf
```

### Get Credit Batches
```http
GET /api/registry/credits
Authorization: Bearer <token>
```

---

## SuperAdmin Endpoints

### Create VVB User
```http
POST /api/superadmin/vvb-users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "vvb@example.com",
  "password": "SecurePassword123",
  "name": "VVB Auditor Name",
  "organization": "VVB Organization"
}
```

**Response:**
```json
{
  "message": "VVB user created successfully",
  "vvb_user_id": 10,
  "email": "vvb@example.com"
}
```

### Create Registry User
```http
POST /api/superadmin/registry-users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "registry@example.com",
  "password": "SecurePassword123",
  "name": "Registry Officer",
  "organization": "Carbon Registry"
}
```

### Get All Users
```http
GET /api/superadmin/users?page=1&page_size=20&role=VVB
Authorization: Bearer <token>
```

### Get Dashboard Stats
```http
GET /api/superadmin/stats
Authorization: Bearer <token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Status Enums

### Validation Status
- `PENDING` - Awaiting review
- `IN_PROGRESS` - Under review
- `QUERIES_RAISED` - Clarifications needed
- `APPROVED` - Validation complete
- `REJECTED` - Validation failed

### Verification Status
- `PENDING` - Awaiting verification
- `IN_PROGRESS` - Under verification
- `DATA_REVIEW` - Reviewing monitoring data
- `VERIFIED` - Successfully verified
- `VERIFIED_WITH_ADJUSTMENTS` - Verified with modifications
- `NOT_VERIFIED` - Verification failed

### Review Status
- `PENDING` - Awaiting registry review
- `IN_PROGRESS` - Under review
- `CLARIFICATIONS_REQUESTED` - More info needed
- `APPROVED` - Ready for issuance
- `APPROVED_WITH_CONDITIONS` - Conditional approval
- `REJECTED` - Review failed

### Query Status
- `OPEN` - Awaiting response
- `RESPONDED` - Developer responded
- `RESOLVED` - Issue resolved
- `CLOSED` - Query closed

---

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated endpoints

---

## Versioning

Current API version: `v1`

All endpoints are prefixed with `/api/` which routes to version 1.
