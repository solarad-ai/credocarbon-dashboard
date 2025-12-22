# GitHub Secrets for CredoCarbon Deployment

## Required Secrets (Add in Settings > Secrets and variables > Actions)

### GCP Authentication

| Secret | Value |
|--------|-------|
| `GCP_CICD_AUTH` | Contents of `prj-cicd-solarad-a8dabe537eb1.json` |
| `GCP_PROD_AUTH` | Contents of `prj-prod-solarad-7a-21550ee081ce.json` |

### Application Secrets

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | `postgresql://postgres.eckkugdibwfgerjornch:dPhyfPqV4vFa6KGx@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres` |
| `SECRET_KEY` | `credocarbon-super-secret-key-2024` |

---

## GCP Configuration

| Setting | Value |
|---------|-------|
| CI/CD Project | `prj-cicd-solarad` |
| Deploy Project | `prj-prod-solarad-7a` |
| Region | `asia-south2` |
| Artifact Registry | `asia-south2-docker.pkg.dev/prj-cicd-solarad/repo-solarad-cicd-as2-01` |

## Supabase Database

| Setting | Value |
|---------|-------|
| Project | `credocarbon` |
| Host | `aws-1-ap-northeast-2.pooler.supabase.com` |
| Port | `6543` |
| Database | `postgres` |
| User | `postgres.eckkugdibwfgerjornch` |
| Password | `dPhyfPqV4vFa6KGx` |

## Trigger Branches
- `main` → Production deployment
- `gcp-dev` → Dev deployment
