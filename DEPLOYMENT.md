# Deployment Guide – Stratos

This guide walks you through deploying Stratos to **Render** (backend) and **Vercel** (frontend).

## Prerequisites

- GitHub account with repository
- Render account (render.com)
- Vercel account (vercel.com)
- MongoDB Atlas account (free tier available) or local MongoDB

---

## Step 1: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended for Production)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 free tier)
4. Create a database user and password
5. Whitelist your IP (or allow all: 0.0.0.0/0 for testing)
6. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

### Option B: Self-Hosted MongoDB

- Use a VPS with MongoDB or Docker container
- Connection string: `mongodb://host:27017`

---

## Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2.2 Create Render Service

1. **Sign in** to [Render Dashboard](https://dashboard.render.com)
2. **New** → **Web Service**
3. **Connect** your GitHub repository
4. **Settings:**
   - **Name:** `stratos-backend`
   - **Environment:** `Docker`
   - **Build Command:** (leave empty—Dockerfile handles it)
   - **Start Command:** (leave empty—Dockerfile handles it)
5. **Environment Variables** → Add new:
   - `MONGO_URL`: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`
   - `DB_NAME`: `stratos`
   - `JWT_SECRET`: Generate a strong secret (e.g., `openssl rand -hex 32`)
   - `CORS_ORIGINS`: Your frontend URL (e.g., `https://stratos.vercel.app`)
6. **Create Web Service**

**Note:** Render will auto-deploy when you push to `main`.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Link Frontend to Vercel

1. **Sign in** to [Vercel Dashboard](https://vercel.com/dashboard)
2. **Add New** → **Project**
3. **Import Git Repository** → Select your repo
4. **Framework Preset:** `Create React App`
5. **Root Directory:** `./frontend`
6. **Environment Variables:**
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://stratos-backend.onrender.com`)
7. **Deploy**

Vercel will auto-deploy on every push to `main`.

---

## Step 4: Update CORS & API URLs

### Backend (Render Environment Variables)

- `CORS_ORIGINS`: `https://YOUR_VERCEL_DOMAIN.vercel.app`
- `MONGO_URL`: Your MongoDB connection string
- `JWT_SECRET`: A strong random secret

### Frontend (Vercel Environment Variables)

- `REACT_APP_API_URL`: `https://YOUR_RENDER_SERVICE.onrender.com`

---

## Step 5: Set Up CI/CD (GitHub Actions)

The `.github/workflows/deploy.yml` file automatically:

1. **Runs tests** on every push to `main`
2. **Builds** frontend and backend
3. **Deploys** to Render and Vercel on successful push

### Create GitHub Secrets

1. Go to **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** for each:

| Secret | Value |
|--------|-------|
| `RENDER_SERVICE_ID` | Get from Render dashboard: `srv-xxxxxxxxxxxxx` |
| `RENDER_DEPLOY_KEY` | Get from Render dashboard: **Settings** → **Deploy Hook** |
| `VERCEL_TOKEN` | Get from Vercel: **Settings** → **Tokens** |
| `VERCEL_ORG_ID` | Found in Vercel dashboard URL |
| `VERCEL_PROJECT_ID` | Found in `frontend/.vercel/project.json` |

---

## Step 6: Test Deployment

1. **Backend Health Check:**
   ```bash
   curl https://YOUR_RENDER_SERVICE.onrender.com/health
   ```

2. **Frontend:** Open `https://YOUR_VERCEL_DOMAIN.vercel.app`

3. **Test API Call:** Open browser console and verify API requests go to your Render backend

---

## Environment Setup Reference

### Backend (.env)

```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=stratos
CORS_ORIGINS=https://stratos.vercel.app
JWT_SECRET=your-long-random-secret-here
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://stratos-backend.onrender.com
```

---

## Troubleshooting

### Backend fails to start

- Check Render logs: **Dashboard** → **Service** → **Logs**
- Verify `MONGO_URL` is correct and MongoDB is accessible
- Confirm all required env vars are set

### Frontend shows blank page

- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` matches your Render backend URL
- Redeploy frontend after adding env var

### Deployment doesn't trigger

- Push to `main` branch (workflows only trigger on main/master)
- Check GitHub Actions tab for workflow status
- Verify `.github/workflows/deploy.yml` exists and is valid

### MongoDB connection timeout

- Whitelist Render.com IP: [Render IP ranges](https://render.com/docs/static-ip)
  - Or allow `0.0.0.0/0` in MongoDB Atlas for testing

---

## Optional: Custom Domain

1. **Render:** Go to **Service** → **Settings** → **Custom Domains** → Add your domain
2. **Vercel:** Go to **Project** → **Settings** → **Domains** → Add your domain
3. Update DNS records at your registrar (follow Render/Vercel DNS instructions)

---

## Rollback & Monitoring

- **Render:** Dashboard shows deployment history; click to redeploy previous version
- **Vercel:** Similarly shows deployments; easy to rollback
- Both provide real-time log access for debugging

---

## Database Backups

- **MongoDB Atlas:** Automatic daily backups (free tier)
- **Self-hosted:** Set up regular backups manually or via scripts

---

For more help:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
