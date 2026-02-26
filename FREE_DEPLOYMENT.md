# 🆓 Deploy Stratos for FREE - Complete Guide

Deploy your full-stack app **entirely free** with free hosting, free database, and optional free domain.

---

## 🎯 Best Free Combination

| Service | Cost | What For |
|---------|------|----------|
| **Railway.app** | FREE (with $5/month free credits) | Backend (FastAPI) |
| **Vercel** | FREE | Frontend (React) |
| **MongoDB Atlas** | FREE (512MB) | Database |
| **Railway/Vercel** | FREE subdomain | Custom domain |
| **Freenom** | FREE (optional) | .tk/.ml/.ga domain |
| **TOTAL** | **$0/month** | ✅ Complete app |

---

## Option 1: Railway.app (RECOMMENDED ⭐)

### Why Railway.app?
- ✅ **Completely free** for first $5/month
- ✅ Deploy backend AND database
- ✅ Easy GitHub integration
- ✅ Free subdomain: `yourapp.railway.app`
- ✅ No credit card required initially

### Step 1: Create Railway Account

1. Go to https://railway.app
2. **Sign Up with GitHub**
3. Authorize Railway
4. Create new project

### Step 2: Deploy Backend

```bash
# In your GitHub repo, it's already ready!
# Railway will auto-detect Dockerfile
# Just connect GitHub repo and it deploys
```

**In Railway Dashboard:**
1. **New Project** → **Deploy from GitHub**
2. Select your repository
3. Select `backend` directory
4. Railway auto-builds Docker image
5. Click **Deploy**

**That's it!** Your backend is live at: `https://yourapp-backend.railway.app`

### Step 3: Add MongoDB Database

**In Railway Dashboard:**
1. Click **Add Service** → **Database** → **MongoDB**
2. Click **Create**
3. Get connection string:
   - Copy `MONGO_URL` from Railway environment variables
   - Looks like: `mongodb+srv://admin:password@mongo.railway.internal:27017/...`

### Step 4: Configure Environment Variables

**In Railway Dashboard:**
1. Click your backend service
2. Go to **Variables** tab
3. Add:
   ```
   MONGO_URL=<paste from MongoDB>
   JWT_SECRET=<generate random: openssl rand -hex 32>
   CORS_ORIGINS=yourdomain.railway.app
   ENVIRONMENT=production
   ```
4. **Deploy**

### Step 5: Get Backend URL

Your backend is now live at (Railway generates this):
```
https://yourapp-backend.railway.app
```

---

## Option 2: Deploy Frontend with Vercel (FREE)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. **Sign Up with GitHub**
3. Authorize Vercel

### Step 2: Deploy Frontend

**In Vercel Dashboard:**
1. **New Project** → **Import Git Repository**
2. Select your repo
3. **Framework Preset:** React
4. **Root Directory:** `frontend`
5. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://yourapp-backend.railway.app
   ```
6. Click **Deploy**

**Your frontend is live at:**
```
https://yourapp.vercel.app
```

---

## Option 3: Deploy Both on Railway (Simpler)

### Alternative: Everything on Railway.app

If you prefer one platform:

1. Deploy backend first (see above)
2. Build frontend to static files
3. Serve frontend from same Railway service
4. Everything at: `https://yourapp.railway.app`

---

## 🆓 Getting a FREE Custom Domain

### Option A: Free Subdomain (EASIEST)
```
yourapp.railway.app  ← FREE (already provided)
yourapp.vercel.app   ← FREE (already provided)
```

### Option B: Free Domain from Freenom

1. Go to https://www.freenom.com
2. Search domain (e.g., `myapp.tk`)
3. **Select 12 months** (free option appears)
4. **Continue** without adding to cart
5. You'll see option for FREE
6. Complete signup
7. Add DNS records (point to Railway/Vercel)

**Free domains: .tk, .ml, .ga, .cf** (Freenom)

### Option C: GitHub Pages Custom Domain

If you want just frontend:
1. Use GitHub Pages (free)
2. Can add custom domain
3. Backend on Railway

---

## 📋 Complete FREE Deployment Steps

### Step 1: GitHub Repository

```bash
# Make sure your repo is on GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Backend on Railway (5 minutes)

1. Go to https://railway.app
2. Sign up with GitHub
3. **New Project** → **Deploy from GitHub**
4. Select your repo
5. Confirm `backend` is selected
6. Click **Deploy**
7. Wait 2-3 minutes

### Step 3: Add MongoDB to Railway (2 minutes)

1. In your Railway project
2. **Add Service** → **Database** → **MongoDB**
3. Click **Create**
4. Copy connection string

### Step 4: Configure Backend (3 minutes)

1. In Railway backend service
2. **Variables** tab
3. Paste `MONGO_URL` from MongoDB
4. Add other env variables (JWT_SECRET, etc.)
5. Click **Deploy** button

### Step 5: Frontend on Vercel (3 minutes)

1. Go to https://vercel.com
2. Sign up with GitHub
3. **New Project** → **Import Repository**
4. Select repo
5. Root Directory: `frontend`
6. Add `REACT_APP_API_URL` variable
7. Click **Deploy**

### Step 6: Test Everything (2 minutes)

```
Frontend: https://yourapp.vercel.app
Backend:  https://yourapp-backend.railway.app
Database: MongoDB on Railway
```

**Total: ~20 minutes to live!**

---

## 🔄 Deploy Updates

### Update Backend

```bash
# Commit and push
git add backend/
git commit -m "Update backend"
git push origin main

# Railway auto-deploys!
```

### Update Frontend

```bash
# Commit and push
git add frontend/
git commit -m "Update frontend"
git push origin main

# Vercel auto-deploys!
```

---

## 💾 What's FREE

✅ **Railway.app**
- Backend hosting: FREE ($5/month free credits)
- Database hosting: FREE
- Build & deploy: FREE
- Subdomain: FREE

✅ **Vercel**
- Frontend hosting: FREE
- CI/CD: FREE
- Subdomain: FREE

✅ **MongoDB Atlas**
- 512MB database: FREE
- Unlimited read/write: FREE

---

## ⚠️ Rate Limits (FREE TIERS)

### Railway
- $5/month free credits (usually enough)
- Generous limits for development
- If you exceed it's ~$0.15/hour

### Vercel
- Unlimited deployments
- Up to 12 serverless functions
- Generous bandwidth

### MongoDB Atlas
- 512MB storage
- Unlimited read/write
- 3 nodes shared cluster

---

## 🎯 Monitoring Your Costs

### Railway Dashboard
Shows:
- Remaining free credits
- Resource usage
- Estimated cost

### Vercel Dashboard
Shows:
- Build minutes used
- Bandwidth

### MongoDB Atlas
Shows:
- Storage used

---

## Optional: Connect Custom Domain

Even free tier allows custom domain!

### For Railway Backend

1. In Railway dashboard
2. Go to **Settings**
3. **Custom Domain**
4. Enter domain (e.g., `api.mydomain.com`)
5. Add DNS records shown

### For Vercel Frontend

1. In Vercel dashboard
2. Go to **Settings** → **Domains**
3. Add domain (e.g., `mydomain.com`)
4. Add DNS records shown

---

## Estimated Timeline

| Step | Time |
|------|------|
| Create Railway account | 2 min |
| Connect GitHub & deploy backend | 5 min |
| Add MongoDB | 2 min |
| Configure environment variables | 3 min |
| Create Vercel account | 2 min |
| Deploy frontend | 3 min |
| Configure frontend variables | 2 min |
| Wait for builds | 5 min |
| **TOTAL** | **~25 minutes** |

---

## Troubleshooting FREE Tier

### Backend won't start

```
Check Railway logs:
- Click your service
- Go to Logs tab
- Look for errors
- Usually environment variable issues
```

### Frontend API calls fail

Check:
1. `REACT_APP_API_URL` set correctly in Vercel
2. Backend `CORS_ORIGINS` allows frontend domain
3. MongoDB connection working

### Out of credits on Railway

Options:
1. Add credit card (pay-as-you-go after $5/month)
2. Switch to another free platform
3. Optimize backend performance

---

## 🚀 After You're Live

### Monitor Performance
- Railway: Check resource usage
- Vercel: Check build times
- MongoDB: Check storage

### Scale if Needed
- Railway: $0.15/hour for extra resources
- Vercel: Already unlimited bandwidth
- MongoDB: Upgrade to paid tier if needed

### Keep Costs Down
- Cache API responses
- Optimize database queries
- Minimize frontend bundle size

---

## 🎉 FREE DEPLOYMENT COMPLETE!

You now have:

✅ **Backend:** Running on Railway.app (FREE)
✅ **Frontend:** Running on Vercel (FREE)
✅ **Database:** MongoDB Atlas (FREE)
✅ **Domain:** yourapp.railway.app + yourapp.vercel.app (FREE)
✅ **HTTPS:** Automatic (FREE)

**Total Cost: $0/month** 🎊

---

## Cost Comparison

| Platform | Stratos Cost |
|----------|-------------|
| **Self-hosting** | $65-90/year |
| **Heroku (old)** | $7/month ($84/year) |
| **Render** | $20/month ($240/year) |
| **AWS/Azure** | Variable |
| **Railway FREE** | **$0/month** 🆓 |

---

## Limitations of FREE Tier

⚠️ **Aware of these limits:**

**Railway ($5/month free):**
- 60 mins idle = sleep (wakes on request)
- Limited to free credits
- If exceeded, extra costs apply

**Vercel:**
- No real limitations for frontend
- Great for production

**MongoDB (512MB):**
- Good for development
- Upgrade if you store lots of data

---

## Next Steps

1. Push to GitHub
2. Go to Railway.app
3. Connect GitHub repo
4. Follow the 5-step deployment
5. Visit your app at `https://yourapp.railway.app`
6. Deploy frontend on Vercel
7. Done! 🎉

---

## Resources

- Railway Docs: https://railway.app/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- GitHub Integration: https://docs.github.com/en/developers

---

**Ready to deploy for FREE?** 🚀

Start at: https://railway.app (5 minutes to live!)
