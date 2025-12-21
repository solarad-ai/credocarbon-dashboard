# CredoCarbon Platform - User Documentation

## Overview

CredoCarbon is a comprehensive carbon credit management platform that enables project developers to register carbon offset projects, validators to verify emission reductions, registries to issue credits, and buyers to purchase and retire carbon credits.

---

## User Roles

| Role | Description |
|------|-------------|
| **Developer** | Creates and manages carbon offset projects |
| **Buyer** | Purchases and retires carbon credits |
| **VVB** | Validates and verifies projects |
| **Registry** | Reviews projects and issues credits |
| **Admin** | Manages platform operations |
| **SuperAdmin** | Full platform control |

---

## Table of Contents

1. [Developer Guide](#developer-guide)
2. [Buyer Guide](#buyer-guide)
3. [VVB Guide](#vvb-guide)
4. [Registry Guide](#registry-guide)
5. [Admin Guide](#admin-guide)
6. [SuperAdmin Guide](#superadmin-guide)

---

# Developer Guide

## Getting Started

### Registration
1. Navigate to `/developer/signup`
2. Fill in your details:
   - Email address
   - Password (min 8 characters)
   - Organization name
   - Country
3. Verify your email
4. Complete KYC verification

### Login
1. Go to `/developer/login`
2. Enter your email and password
3. Click "Log In"

## Dashboard Overview

After logging in, you'll see:
- **My Projects** - Summary of all your projects by status
- **Tasks Requiring Attention** - Pending actions needed
- **Recent Activity** - Latest project updates
- **Quick Actions** - Create new project, view credits

## Creating a Project

### Step 1: Project Type
Select your project category:
- Renewable Energy
- Energy Efficiency  
- Forestry/AFOLU
- Waste Management
- Industrial Processes

### Step 2: Basic Information
- Project Name
- Project Description
- Location (Country, Region)
- Expected Start Date
- Crediting Period

### Step 3: Generation Data
- Upload generation or emission reduction data
- Specify monitoring methodology
- Add baseline calculations

### Step 4: Stakeholder Consultation
- Upload consultation records
- Add meeting minutes
- Document community engagement

### Step 5: Compliance
- Social safeguards checklist
- Environmental safeguards checklist
- Add any supplementary documentation

### Step 6: Registry Submission
- Select target registry (GCC, VCS, Gold Standard)
- Generate required documents
- Submit for validation

## Project Lifecycle

```
DRAFT → SUBMITTED_TO_VVB → VALIDATION_PENDING → VALIDATION_APPROVED 
→ VERIFICATION_PENDING → VERIFICATION_APPROVED → REGISTRY_REVIEW → ISSUED
```

## Managing Credits

Once credits are issued:
- View in **Portfolio**
- List for sale in **Marketplace**
- Track retirements
- View transaction history

---

# Buyer Guide

## Getting Started

### Registration
1. Navigate to `/buyer/signup`
2. Complete registration form
3. Verify email
4. Complete KYC (Individual or Corporate)

### Login
1. Go to `/buyer/login`
2. Enter credentials
3. Access your dashboard

## Dashboard Overview

- **Portfolio Summary** - Your credit holdings
- **Recent Purchases** - Transaction history
- **Active Orders** - Pending buy orders
- **Market Insights** - Credit pricing trends

## Browsing Credits

### Marketplace
1. Go to **Marketplace**
2. Filter by:
   - Project Type
   - Vintage Year
   - Price Range
   - Registry
   - Location
3. View credit details
4. Add to cart or buy directly

## Purchasing Credits

1. Select credits from marketplace
2. Review purchase details
3. Confirm payment method
4. Complete transaction
5. Credits appear in Portfolio

## Retiring Credits

1. Go to **Portfolio**
2. Select credits to retire
3. Enter retirement details:
   - Beneficiary name
   - Retirement purpose
   - Date
4. Confirm retirement
5. Receive retirement certificate

## Wallet & Payments

- View balance
- Add funds
- Track transactions
- Withdraw funds

---

# VVB Guide

## Getting Started

VVB accounts are created by SuperAdmin. Contact your administrator for access.

### Login
1. Navigate to `/vvb/login`
2. Enter your credentials
3. Access VVB dashboard

## Dashboard Overview

- **Pending Validations** - New projects awaiting validation
- **In Progress Validations** - Projects you're currently validating
- **Pending Verifications** - Monitoring periods to verify
- **Open Queries** - Questions awaiting developer response

## Validation Workflow

### Receiving an Assignment
Projects are assigned by Admin/SuperAdmin. You'll receive a notification when assigned.

### Conducting Validation

1. Go to **Projects** → Select project
2. Review project documentation:
   - Project Description Document
   - Baseline calculations
   - Monitoring plan
   - Stakeholder records

3. Complete validation checklist:
   - [ ] Methodology appropriate
   - [ ] Boundaries correctly defined
   - [ ] Additionality demonstrated
   - [ ] Baseline conservative
   - [ ] Emission calculations correct
   - [ ] Monitoring plan adequate
   - [ ] Safeguards addressed
   - [ ] Stakeholder consultation complete
   - [ ] Documentation complete
   - [ ] Regulatory compliance verified

4. Raise queries if clarification needed
5. Update status and add remarks
6. Submit decision (Approve/Reject)

## Verification Workflow

### Verifying Emission Reductions

1. Go to **Verifications** → Select verification task
2. Review monitoring data
3. Verify claimed reductions:
   - Check data collection methods
   - Validate calculations
   - Apply adjustments if needed
   - Account for leakage
   - Calculate buffer percentage

4. Complete verification checklist
5. Enter verified emission reductions
6. Submit verification report

## Query Management

### Raising Queries
1. Go to query section within task
2. Select category (Methodology, Documentation, etc.)
3. Write your question
4. Submit query

### Reviewing Responses
1. Check **Queries** page for developer responses
2. Review attached documents
3. Mark as resolved or request more info

---

# Registry Guide

## Getting Started

Registry accounts are created by SuperAdmin. Contact your administrator for access.

### Login
1. Navigate to `/registry/login`
2. Enter credentials
3. Access Registry dashboard

## Dashboard Overview

- **Pending Reviews** - VVB-approved projects awaiting review
- **In Progress Reviews** - Active reviews
- **Pending Issuances** - Approved projects ready for credit issuance
- **Total Credits Issued** - Platform statistics

## Review Workflow

### Conducting Registry Review

1. Go to **Projects** → Select project
2. Review validation/verification reports
3. Complete review checklist:
   - [ ] Methodology approved for registry
   - [ ] Validation report complete
   - [ ] Verification report complete
   - [ ] Credit calculation verified
   - [ ] Additionality confirmed
   - [ ] Safeguards verified
   - [ ] Documentation complete
   - [ ] Fees paid
   - [ ] Registry requirements met
   - [ ] Ready for issuance

4. Add conditions (if any)
5. Submit decision:
   - **Approve** - Ready for issuance
   - **Approve with Conditions** - Minor issues to address
   - **Reject** - Major issues, provide reason

## Credit Issuance

### Issuing Credits

1. Go to **Issuances**
2. Select approved project
3. Enter issuance details:
   - Registry Reference ID
   - Credit quantity
   - Vintage year
   - Serial number range
4. Upload certificate
5. Confirm issuance
6. Credits are created and assigned to developer

## Credit Management

### Viewing Issued Credits
1. Go to **Credits**
2. View all credit batches
3. Track:
   - Available credits
   - Sold credits
   - Retired credits

---

# Admin Guide

## Getting Started

Admin accounts are created by SuperAdmin.

### Login
1. Navigate to `/admin/login`
2. Enter credentials
3. Access Admin dashboard

## Dashboard Features

### User Management
- View all platform users
- Filter by role, status
- Edit user details
- Activate/Deactivate accounts

### Project Oversight
- View all projects
- Monitor project status
- Assign VVBs to projects
- Track project milestones

### Transaction Monitoring
- View marketplace transactions
- Monitor credit transfers
- Track retirements
- Generate reports

### Support
- Respond to user queries
- Manage support tickets
- Send notifications

---

# SuperAdmin Guide

## Getting Started

SuperAdmin is the highest privilege level with full platform control.

### Login
1. Navigate to `/superadmin/login`
2. Enter credentials
3. Access SuperAdmin console

## Dashboard Overview

- Platform statistics (users, projects, credits, transactions)
- System health monitoring
- Recent activity feed
- Quick actions

## User Management

### Creating Users

#### Create Admin
```
POST /api/superadmin/admins
{
  "email": "admin@example.com",
  "password": "SecurePass123",
  "name": "Admin Name",
  "organization": "CredoCarbon"
}
```

#### Create VVB User
```
POST /api/superadmin/vvb-users
{
  "email": "vvb@example.com",
  "password": "SecurePass123",
  "name": "VVB Auditor",
  "organization": "VVB Organization"
}
```

#### Create Registry User
```
POST /api/superadmin/registry-users
{
  "email": "registry@example.com",
  "password": "SecurePass123",
  "name": "Registry Officer",
  "organization": "Carbon Registry"
}
```

### Managing Users
- View all users: `/superadmin/dashboard/users`
- Edit user details
- Deactivate accounts
- Change roles

## Platform Configuration

### Registries
- Add new registries
- Configure registry settings
- Enable/disable registries

### Project Types
- Add project categories
- Configure validation rules
- Set buffer percentages

### Feature Flags
- Enable/disable platform features
- Control beta features
- A/B testing configuration

### Platform Fees
- Set transaction fees
- Configure fee structure
- View fee reports

### Email Templates
- Customize notification emails
- Edit welcome messages
- Configure system alerts

## Monitoring

### Audit Logs
- View all system actions
- Filter by user, action type
- Export for compliance

### API Health
- Monitor endpoint status
- View error rates
- Check database connections

### Analytics
- User growth trends
- Credit issuance trends
- Transaction volumes
- Revenue reports

---

## API Endpoints Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/developer/login` | POST | Developer login |
| `/api/auth/buyer/login` | POST | Buyer login |
| `/api/auth/vvb/login` | POST | VVB login |
| `/api/auth/registry/login` | POST | Registry login |
| `/api/auth/admin/login` | POST | Admin login |
| `/api/auth/superadmin/login` | POST | SuperAdmin login |

### VVB Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vvb/dashboard/stats` | GET | Dashboard statistics |
| `/api/vvb/dashboard/projects` | GET | Assigned projects |
| `/api/vvb/validations/{id}` | GET/PUT | Validation task |
| `/api/vvb/verifications/{id}` | GET/PUT | Verification task |
| `/api/vvb/queries` | GET/POST | Query management |

### Registry Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/registry/dashboard/stats` | GET | Dashboard statistics |
| `/api/registry/dashboard/projects` | GET | Projects for review |
| `/api/registry/reviews/{id}` | GET/PUT | Review details |
| `/api/registry/issuances` | GET/POST | Credit issuances |
| `/api/registry/credits` | GET | Issued credits |

---

## Support

For technical support:
- Email: support@credocarbon.com
- Documentation: https://docs.credocarbon.com
- Status Page: https://status.credocarbon.com
