# CredoCarbon Free Cloud Deployment Guide

Deploy your CredoCarbon platform for **$0/month** using Vercel + Render + Supabase.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Vercel       │    │     Render      │    │    Supabase     │
│   (Frontend)    │───▶│    (Backend)    │───▶│   (Database)    │
│   Next.js       │    │    FastAPI      │    │   PostgreSQL    │
│   FREE          │    │    FREE         │    │   FREE          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Step 1: Setup Supabase (Database)

### 1.1 Create Account & Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - **Name**: `credocarbon`
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** (takes ~2 minutes)

### 1.2 Get Connection String
1. Go to **Project Settings** → **Database**
2. Scroll to **"Connection string"** → **"URI"**
3. Copy the connection string, it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com) and sign up with GitHub

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `solarad-ai/credo-carbon`
3. Configure:
   - **Name**: `credocarbon-api`
   - **Region**: Choose same as Supabase
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### 2.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `SECRET_KEY` | Generate: `openssl rand -hex 32` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (update after Vercel deploy) |

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for build (5-10 minutes first time)
3. Copy your Render URL: `https://credocarbon-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import: `solarad-ai/credo-carbon`
3. Configure:
   - **Framework Preset**: `Next.js` (auto-detected)
   - **Root Directory**: Click **"Edit"** → Enter `apps/web`
   - **Build Command**: Leave default (`next build`)
   - **Output Directory**: Leave default

### 3.3 Add Environment Variables
Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://credocarbon-api.onrender.com` |

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Your app is live at: `https://your-project.vercel.app`

---

## Step 4: Update CORS (Important!)

Go back to **Render Dashboard** → Your service → **Environment**:

Update `CORS_ORIGINS` to your actual Vercel URL:
```
https://credocarbon.vercel.app
```

Click **"Save Changes"** - Render will auto-redeploy.

---

## Step 5: Initialize Database

### Option A: Via Render Shell
1. Go to Render Dashboard → Your service → **Shell**
2. Run:
   ```bash
   python -c "from apps.api.core.database import engine; from apps.api.core.models import Base; Base.metadata.create_all(bind=engine)"
   python apps/api/seed_data.py
   ```

### Option B: Via API Endpoint
Access: `https://credocarbon-api.onrender.com/admin/seed` (if you have that endpoint)

---

## Verification Checklist

| Check | URL | Expected |
|-------|-----|----------|
| ✅ Frontend loads | `https://your-app.vercel.app` | Homepage shows |
| ✅ API health | `https://credocarbon-api.onrender.com/health` | `{"status": "ok"}` |
| ✅ Login works | Try developer login | Redirects to dashboard |

---

## Troubleshooting

### Backend not starting?
- Check Render logs for errors
- Verify `requirements.txt` exists in `apps/api/`
- Ensure `DATABASE_URL` is correct

### Frontend can't connect to API?
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Verify CORS_ORIGINS includes your Vercel domain
- Check browser console for errors

### Database connection failed?
- Verify Supabase password in connection string
- Check if Supabase project is active (free tier pauses after 1 week inactivity)

---

## Free Tier Limitations

| Service | Limitation | Workaround |
|---------|-----------|------------|
| **Render** | Sleeps after 15min inactivity | First request takes ~30s to wake |
| **Supabase** | Pauses after 1 week inactivity | Login to dashboard weekly |
| **Vercel** | 100GB bandwidth/month | More than enough for testing |

---

## Next Steps

After testing, consider upgrading to paid tiers for production:
- **Render Starter**: $7/mo (no sleep, faster builds)
- **Supabase Pro**: $25/mo (no pausing, more storage)
- **Vercel Pro**: $20/mo (more bandwidth, team features)
