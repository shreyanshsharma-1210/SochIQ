# SochIQ Deployment Guide

This guide details how to deploy **SochIQ** into production:
- **Backend (FastAPI)**: Deployed to [Render](https://render.com)
- **Frontend (Next.js 14)**: Deployed to [Vercel](https://vercel.com)

---

## 1. Deploy Backend to Render

### Option A: Using the Render Blueprint (Recommended - 1 Click)
The repository includes a ready-to-use [`render.yaml`](file:///render.yaml).

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository: `shreyanshsharma-1210/SochIQ`.
4. Render will automatically detect `render.yaml` and configure:
   - **Service Name**: `sochiq-backend`
   - **Environment**: Python 3.11.9
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/healthz`
5. Fill in the required environment variables:
   - `SUPABASE_URL`: Your Supabase Project URL (e.g. `https://xyz.supabase.co`)
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon/Publishable Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for storage/admin purge)
   - `SUPABASE_JWT_ISSUER`: `https://xyz.supabase.co/auth/v1`
   - `GROQ_API_KEY`: Your Groq API Key
   - `ALLOWED_ORIGINS`: Comma-separated allowed URLs (e.g. `http://localhost:3000,https://sochiq.vercel.app`) *(Note: Any `*.vercel.app` domain is also automatically permitted via CORS regex)*
6. Click **Apply**.
7. Once deployed, copy your Render service URL (e.g., `https://sochiq-backend.onrender.com`).

### Option B: Manual Web Service on Render
1. Click **New +** > **Web Service**.
2. Select `shreyanshsharma-1210/SochIQ`.
3. Set:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check**: `/healthz`
4. Add the environment variables listed above and click **Create Web Service**.

---

## 2. Deploy Frontend to Vercel

### Option A: Via Vercel Web Dashboard (Recommended)
1. Log into [Vercel](https://vercel.com/new).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository: `shreyanshsharma-1210/SochIQ`.
4. In **Project Settings**:
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Framework Preset**: `Next.js` (detected automatically).
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<YOUR-RENDER-BACKEND-URL>/api/v1`
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon/Publishable Key
6. Click **Deploy**.
7. Vercel will build and assign your production domain (e.g. `https://sochiq.vercel.app`).

### Option B: Via Vercel CLI
From your local terminal:
```bash
cd frontend
npx vercel login
npx vercel --prod
```
When prompted:
- Set up and deploy: **Yes**
- Which scope: Select your personal/team account
- Link to existing project: **No** (or link if created)
- Project name: `sochiq`
- Directory located: `./`
- Want to modify settings: **No**

---

## 3. Post-Deployment Verification

1. **Verify Backend Health**:
   Visit `https://<YOUR-RENDER-BACKEND-URL>/healthz`. You should receive:
   ```json
   {
     "status": "healthy",
     "service": "SochIQ",
     "version": "2.0.0"
   }
   ```
2. **Verify Frontend**:
   Open your Vercel URL, upload a CSV or Excel file, test the analytics dashboard, and verify that the 30-minute cloud workspace and AI Assistant interact smoothly with the Render backend.
