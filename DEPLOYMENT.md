# Deployment Guide - Flowbit Analytics

Complete guide for deploying Flowbit Analytics to production.

## Architecture Overview

```
┌─────────────────┐
│   Vercel        │
│  ┌───────────┐  │
│  │ Frontend  │  │ ← Next.js App
│  │ (Next.js) │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Backend  │  │ ← Express API
│  │ (Express) │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
    ┌────▼────┐
    │ Vercel  │ ← PostgreSQL
    │Postgres │
    └────┬────┘
         │
┌────────▼────────┐
│  Render/Railway │
│  ┌───────────┐  │
│  │ Vanna AI  │  │ ← Python FastAPI
│  │ (FastAPI) │  │
│  └───────────┘  │
└─────────────────┘
```

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Render/Railway account (for Vanna AI)
- Groq API key
- Domain name (optional)

## Part 1: Database Deployment

### Option A: Vercel Postgres (Recommended)

1. **Create Database**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Create Postgres database
   vercel postgres create flowbit-analytics-db
   ```

2. **Get Connection String**
   - Go to Vercel Dashboard → Storage → Your Database
   - Copy `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`

3. **Update Schema**
   ```bash
   # Set DATABASE_URL locally
   export DATABASE_URL="your_vercel_postgres_url"
   
   # Push schema
   cd apps/api
   npx prisma db push
   
   # Seed data
   npm run seed
   ```

### Option B: Supabase

1. **Create Project**
   - Go to https://supabase.com
   - Create new project
   - Wait for database to provision

2. **Get Connection String**
   - Settings → Database → Connection string
   - Choose "URI" format
   - Copy connection string

3. **Configure**
   ```bash
   # Connection string format:
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Option C: Railway

1. **Create Database**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Create project
   railway init
   
   # Add PostgreSQL
   railway add postgresql
   ```

2. **Get Connection String**
   ```bash
   railway variables
   # Copy DATABASE_URL
   ```

## Part 2: Backend API Deployment (Vercel)

### 1. Prepare Backend

Create `apps/api/vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

Create `apps/api/package.json` build script:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && tsc",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 2. Deploy to Vercel

```bash
cd apps/api

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? flowbit-analytics-api
# - Directory? ./
# - Override settings? No
```

### 3. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   DATABASE_URL=your_production_database_url
   VANNA_API_BASE_URL=https://your-vanna-service.onrender.com
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

### 4. Redeploy
```bash
vercel --prod
```

## Part 3: Vanna AI Deployment (Render)

### 1. Prepare Vanna Service

Create `services/vanna/render.yaml`:
```yaml
services:
  - type: web
    name: flowbit-vanna-ai
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
    envVars:
      - key: GROQ_API_KEY
        sync: false
      - key: DATABASE_URL
        sync: false
      - key: DB_HOST
        sync: false
      - key: DB_PORT
        value: 5432
      - key: DB_NAME
        sync: false
      - key: DB_USER
        sync: false
      - key: DB_PASSWORD
        sync: false
      - key: PORT
        value: 8000
```

### 2. Deploy to Render

**Via Dashboard:**
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: flowbit-vanna-ai
   - **Region**: Oregon (or closest)
   - **Branch**: main
   - **Root Directory**: services/vanna
   - **Runtime**: Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   GROQ_API_KEY=your_groq_api_key
   DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db
   DB_HOST=your_db_host
   DB_PORT=5432
   DB_NAME=flowbit_analytics
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   PORT=8000
   ```

6. Click "Create Web Service"

**Via CLI:**
```bash
# Install Render CLI
npm i -g render-cli

# Login
render login

# Deploy
cd services/vanna
render deploy
```

### 3. Get Vanna URL

After deployment, copy the URL (e.g., `https://flowbit-vanna-ai.onrender.com`)

### 4. Update Backend Environment

Go back to Vercel → Backend API → Environment Variables:
- Update `VANNA_API_BASE_URL` with your Render URL

## Part 4: Frontend Deployment (Vercel)

### 1. Prepare Frontend

Create `apps/web/.env.production`:
```env
NEXT_PUBLIC_API_BASE=https://your-api.vercel.app/api
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. Deploy to Vercel

```bash
cd apps/web

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? flowbit-analytics
# - Directory? ./
# - Override settings? No
```

### 3. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_BASE=https://your-api.vercel.app/api
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

### 4. Deploy to Production
```bash
vercel --prod
```

## Part 5: Custom Domain (Optional)

### Backend API Domain

1. Go to Vercel → Backend Project → Settings → Domains
2. Add domain: `api.yourdomain.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

### Frontend Domain

1. Go to Vercel → Frontend Project → Settings → Domains
2. Add domain: `yourdomain.com`
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Update Environment Variables

Update all services with new domain URLs.

## Part 6: Post-Deployment

### 1. Verify Deployments

```bash
# Test Backend
curl https://your-api.vercel.app/health

# Test Vanna AI
curl https://your-vanna.onrender.com/health

# Test Frontend
open https://your-app.vercel.app
```

### 2. Seed Production Database

```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_url"

# Run seed
cd apps/api
npm run seed
```

### 3. Test End-to-End

1. Open frontend
2. Check dashboard loads
3. Verify charts display
4. Test chat functionality
5. Check all API endpoints

## Monitoring & Maintenance

### Vercel Monitoring

- **Logs**: Vercel Dashboard → Deployments → View Logs
- **Analytics**: Vercel Dashboard → Analytics
- **Performance**: Vercel Dashboard → Speed Insights

### Render Monitoring

- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: Render Dashboard → Service → Metrics
- **Health**: Automatic health checks on `/health`

### Database Monitoring

**Vercel Postgres:**
- Dashboard → Storage → Database → Insights

**Supabase:**
- Dashboard → Database → Query Performance

### Set Up Alerts

**Vercel:**
1. Settings → Notifications
2. Enable deployment notifications
3. Add email/Slack webhook

**Render:**
1. Service Settings → Notifications
2. Add email notifications
3. Configure health check alerts

## Scaling Considerations

### Database

**When to scale:**
- More than 10,000 invoices
- Slow query performance
- High concurrent users

**Options:**
- Upgrade to paid tier
- Add read replicas
- Implement caching (Redis)

### Backend API

**When to scale:**
- Response times > 1s
- High CPU usage
- Memory limits reached

**Options:**
- Upgrade Vercel plan
- Implement API caching
- Add CDN for static assets

### Vanna AI

**When to scale:**
- Query timeouts
- High latency
- Memory errors

**Options:**
- Upgrade Render plan (Free → Starter → Standard)
- Implement query caching
- Add request queuing

## Cost Estimates

### Free Tier (Development)
- **Vercel**: Free (100GB bandwidth, 100 builds/month)
- **Render**: Free (750 hours/month)
- **Vercel Postgres**: Free (256 MB storage, 60 hours compute)
- **Groq**: Free tier available
- **Total**: $0/month

### Production (Small Scale)
- **Vercel Pro**: $20/month
- **Render Starter**: $7/month
- **Vercel Postgres**: $20/month
- **Groq**: Pay as you go (~$5-10/month)
- **Total**: ~$52-57/month

### Production (Medium Scale)
- **Vercel Pro**: $20/month
- **Render Standard**: $25/month
- **Supabase Pro**: $25/month
- **Groq**: ~$20-30/month
- **Total**: ~$90-100/month

## Troubleshooting

### Build Failures

**Vercel:**
```bash
# Check build logs
vercel logs

# Local build test
npm run build
```

**Render:**
- Check build logs in dashboard
- Verify requirements.txt
- Check Python version

### Database Connection Issues

```bash
# Test connection
psql "your_database_url"

# Check Prisma connection
npx prisma db pull
```

### CORS Errors

Update backend CORS configuration:
```typescript
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'https://www.yourdomain.com'
  ],
  credentials: true
}));
```

### Environment Variable Issues

1. Verify all variables are set
2. Check for typos
3. Redeploy after changes
4. Clear build cache

## Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### Render
1. Go to Dashboard → Service
2. Click "Manual Deploy"
3. Select previous commit
4. Deploy

## Security Checklist

- [ ] All environment variables set correctly
- [ ] Database uses strong password
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (if implemented)
- [ ] HTTPS enforced
- [ ] API keys rotated regularly
- [ ] Database backups enabled
- [ ] Error messages don't expose sensitive data
- [ ] Dependencies updated
- [ ] Security headers configured

## Backup Strategy

### Database Backups

**Vercel Postgres:**
- Automatic daily backups (Pro plan)
- Manual backups via CLI

**Supabase:**
- Automatic daily backups
- Point-in-time recovery (Pro plan)

**Manual Backup:**
```bash
# Export database
pg_dump "your_database_url" > backup.sql

# Restore database
psql "your_database_url" < backup.sql
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Support

For deployment issues:
1. Check service status pages
2. Review deployment logs
3. Consult documentation
4. Contact support

---

**Congratulations!** Your Flowbit Analytics platform is now deployed to production! 🚀
