# Database Switching Guide

## Quick Reference

### Current Setup
- **Local DB**: `localhost:5432/credo_carbon` (PostgreSQL on your Mac)
- **Production DB**: `Supabase` (Cloud PostgreSQL on AWS)

---

## How to Switch Databases

### Method 1: Using the Helper Script (Easiest)

```bash
./switch-db.sh
```

Then select:
- `1` for Local Development (safe)
- `2` for Production (⚠️ live data)

### Method 2: Manual Switch

```bash
# For LOCAL database
cp .env.local .env

# For PRODUCTION database
cp .env.production .env

# Always restart backend after switching
```

---

## Important Notes

### Local Development Database ✅
- **Safe** for testing and development
- Contains your account + test accounts
- Can be reset/modified without risk
- Fast (no network latency)

### Production Database ⚠️
- **Live user data** - be very careful!
- Don't run seed scripts
- Don't test destructive operations
- Use only for final verification

---

## Files Created

| File | Purpose |
|------|---------|
| `.env.local` | Local database config |
| `.env.production` | Production database config |
| `.env` | Active config (copy one of above) |
| `switch-db.sh` | Helper script to switch |

---

## After Switching

1. Stop the backend server (Ctrl+C)
2. Restart it:
   ```bash
   source venv/bin/activate
   uvicorn apps.api.main:app --reload --port 8000
   ```
3. Check the connection in logs

---

## Troubleshooting

**"Connection refused"**
- Check if PostgreSQL is running (local)
- Check internet connection (production)

**"Authentication failed"**
- Verify credentials in `.env` file
- Check if password contains special characters (escape them)

---

## Recommendations

For day-to-day development:
- ✅ Use **LOCAL** database
- ✅ Test features locally first
- ✅ Only connect to production when deploying

For production access:
- ⚠️ Read-only queries when possible
- ⚠️ Create database backups first
- ⚠️ Test in staging environment first (if available)
