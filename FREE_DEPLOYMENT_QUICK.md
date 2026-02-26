# 🆓 FREE Deployment - Quick Start

**Deploy Stratos completely free in 25 minutes**

---

## 🚀 Fastest Way (Railway + Vercel)

### Backend: Railway.app (5 min)
```
1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. It auto-deploys!
```

Backend lives at: `https://yourapp-backend.railway.app`

### Database: MongoDB (2 min)
```
In Railway:
1. Add Service → Database → MongoDB
2. Get connection string
3. Add to backend environment variables
```

### Frontend: Vercel (5 min)
```
1. Go to https://vercel.com
2. Sign up with GitHub
3. New Project → Import Repository
4. Root Directory: frontend
5. Add REACT_APP_API_URL = backend URL
6. Deploy!
```

Frontend lives at: `https://yourapp.vercel.app`

### Connect Them (3 min)
```
In Vercel:
- Set REACT_APP_API_URL = your Railway backend URL

In Railway backend:
- Set CORS_ORIGINS = your Vercel frontend URL
```

**Done!** Your app is live! 🎉

---

## 💰 Cost Breakdown

| Item | Cost |
|------|------|
| Railway backend (with $5/month credits) | **FREE** |
| MongoDB database | **FREE** |
| Vercel frontend | **FREE** |
| Domain (.railway.app + .vercel.app) | **FREE** |
| HTTPS/SSL | **FREE** |
| **TOTAL** | **$0/month** |

---

## Files You Need

✅ Your project is ready!
✅ Docker configs (not needed for this method)
✅ Just push to GitHub and connect to Railway + Vercel

---

## Step-by-Step for Beginners

### Prerequisites
- GitHub account (free)
- Internet connection

### Step 1: Push Code to GitHub

```bash
cd adhista
git add .
git commit -m "Ready for free deployment"
git push origin main
```

### Step 2: Deploy Backend

**Go to:** https://railway.app

```
1. Click Sign Up
2. Select "Sign up with GitHub"
3. Authorize Railway
4. Click "New Project"
5. Select "Deploy from GitHub Repo"
6. Select your repository
7. Wait for auto-build & deploy (2-3 min)
```

**Your backend URL:** Railway shows it in dashboard

### Step 3: Add Database

**In Railway Dashboard:**
```
1. Click "Add Service"
2. Select "Database"
3. Select "MongoDB"
4. Click "Create"
5. Copy the MONGO_URL from "Variables"
```

### Step 4: Set Environment Variables

**In Railway Dashboard:**
```
1. Click your backend service
2. Go to "Variables" tab
3. Paste MONGO_URL
4. Add these new variables:
   - JWT_SECRET = (generate: openssl rand -hex 32)
   - CORS_ORIGINS = (leave blank for now)
   - ENVIRONMENT = production
5. Click "Deploy" button
```

### Step 5: Deploy Frontend

**Go to:** https://vercel.com

```
1. Click "Sign Up"
2. Select "Sign up with GitHub"
3. Authorize Vercel
4. Click "New Project"
5. Select "Import Git Repository"
6. Select your repository
7. For "Root Directory" select "frontend"
8. Click "Deploy"
```

**Your frontend URL:** Vercel shows it after deploy

### Step 6: Connect Them

**In Vercel Dashboard (for frontend):**
```
1. Go to "Settings" → "Environment Variables"
2. Add new variable:
   Name: REACT_APP_API_URL
   Value: https://yourapp-backend.railway.app
3. Redeploy (click Deployments → Redeploy)
```

**In Railway Dashboard (for backend):**
```
1. Go to backend service → Variables
2. Update CORS_ORIGINS to your Vercel URL
   Value: https://yourapp.vercel.app
3. Click Deploy
```

### Done! 🎉

- Frontend: `https://yourapp.vercel.app`
- Backend: `https://yourapp-backend.railway.app`
- Database: MongoDB on Railway

---

## Common Issues

### Backend won't start

```
Check Railway logs:
- Service → Logs
- Look for red error messages
- Usually missing environment variables
```

**Fix:** Add missing variables and deploy again

### Frontend can't reach backend

```
Check:
1. REACT_APP_API_URL is set correctly
2. Backend CORS_ORIGINS includes frontend URL
3. Backend service is actually running
```

**Fix:** Restart both services

### Out of Railway credits

```
Railway gives $5/month free credits
Usually enough for development
If you exceed:
- Add credit card (pay as you go)
- Optimize your backend code
- Switch to another free platform
```

---

## What Each Service Provides

### Railway
- Runs your Python backend
- Hosts MongoDB database
- Free subdomain: `yourapp-backend.railway.app`
- $5/month in free credits
- Auto-deploys from GitHub

### Vercel
- Runs your React frontend
- Free subdomain: `yourapp.vercel.app`
- Unlimited bandwidth
- Auto-deploys from GitHub

### MongoDB Atlas
- 512MB free database
- Unlimited read/write operations
- Perfect for development

---

## Limitations

⚠️ **Know these limits:**

| Limit | Railway | Vercel | MongoDB |
|-------|---------|--------|---------|
| Cost | $5/month free, then pay | FREE | FREE (512MB) |
| Sleep | After 60 mins idle | No sleep | No sleep |
| Builds | Unlimited | Unlimited | N/A |
| Bandwidth | Included | Unlimited | Included |
| Support | Community | Community | Community |

---

## Monitoring

### See Your Dashboard

**Railway:** https://railway.app/dashboard
- Shows resource usage
- Shows remaining free credits
- Shows logs

**Vercel:** https://vercel.com/dashboard
- Shows deployments
- Shows analytics

**MongoDB:** https://cloud.mongodb.com
- Shows storage used
- Shows connections

---

## Optional: Free Custom Domain

### Free Domain Options

```
Option 1: Keep free subdomains
- yourapp.railway.app (backend)
- yourapp.vercel.app (frontend)
- No extra cost!

Option 2: Free domain from Freenom
- Get .tk, .ml, .ga, .cf domain free
- Connect to Railway/Vercel
- Still totally free
```

### If You Want Custom Domain

1. Get free domain from Freenom.com
2. In Railway → Custom Domain → Add DNS records
3. In Vercel → Settings → Domains → Add DNS records
4. Wait 24 hours for DNS to propagate

---

## Update Your Code

### Push Updates

```bash
# Make changes
git add .
git commit -m "Updated"
git push origin main

# Railway & Vercel auto-deploy!
```

---

## API Integration

Your frontend will call backend at:
```javascript
// Already configured if you set REACT_APP_API_URL
fetch(`${process.env.REACT_APP_API_URL}/api/endpoint`)
```

---

## Next Steps

1. ✅ Ensure code is on GitHub
2. ✅ Go to Railway.app
3. ✅ Deploy with 6 steps above
4. ✅ Visit your app
5. ✅ Done! 🎉

---

## Resources

- Railway Documentation: https://railway.app/docs
- Vercel Documentation: https://vercel.com/docs
- MongoDB Documentation: https://docs.mongodb.com

---

**Ready to deploy?** 🚀

1. Go to https://railway.app
2. Sign up
3. Deploy
4. In 25 minutes you're live with a totally FREE full-stack app!

**No credit card required!** 💳❌
**No hidden costs!** 💰❌
**Just your app, live online!** ✨✅
