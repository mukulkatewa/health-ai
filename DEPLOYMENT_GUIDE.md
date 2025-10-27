# Deployment Guide - Backend (Railway) + Frontend (Vercel)

## Step 1: Deploy Backend to Railway

1. **Go to Railway**: https://railway.app
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose repository**: `mukulkatewa/health-ai`
6. **Configuration**:
   - Root Directory: `backend`
   - Build Command: Auto-detected
   - Start Command: `npm start`

7. **Add Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL database URL (Railway can create one)
   - `JWT_SECRET`: Any random string (e.g., `your-secret-key-12345`)
   - `GOOGLE_API_KEY`: Your Google API key (or leave empty if not using AI features)
   - `PORT`: `3000`

8. **Railway will build and deploy** - Wait for deployment to complete
9. **Copy the deployment URL** (e.g., `https://your-app.up.railway.app`)

## Step 2: Connect Frontend to Backend

1. **Go to Vercel**: https://vercel.com/kaksaab2605-8884s-projects/medico-sync-pro/settings/environment-variables
2. **Add Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-url.up.railway.app/api`
3. **Save**

## Step 3: Redeploy Frontend

Run this command:
```bash
cd frontend/medico-sync-pro
vercel --prod --yes
```

## That's it! Your app should now work! 🎉
