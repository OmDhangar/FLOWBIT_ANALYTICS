# Complete Setup Guide - Flowbit Analytics

This guide will walk you through setting up the entire Flowbit Analytics platform from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Vanna AI Setup](#vanna-ai-setup)
7. [Data Import](#data-import)
8. [Testing](#testing)
9. [Deployment](#deployment)

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.11 or higher
- **PostgreSQL**: v16 or higher (or Docker)
- **Git**: Latest version

### API Keys
- **Groq API Key**: Sign up at https://console.groq.com/keys

### Verify Installation
```bash
node --version    # Should be v18+
npm --version     # Should be v9+
python --version  # Should be v3.11+
psql --version    # Should be v16+ (if not using Docker)
docker --version  # Optional, for containerized PostgreSQL
```

## Initial Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd flowbit-analytics
```

### 2. Install Root Dependencies
```bash
npm install
```

This installs workspace dependencies and sets up the monorepo structure.

## Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
npm run docker:up

# Verify it's running
docker ps

# You should see: flowbit-postgres
```

The database will be available at:
- Host: `localhost`
- Port: `5432`
- Database: `flowbit_analytics`
- User: `admin`
- Password: `admin`

### Option B: Local PostgreSQL Installation

```bash
# Create database
createdb flowbit_analytics

# Or using psql
psql -U postgres
CREATE DATABASE flowbit_analytics;
\q
```

### 3. Verify Database Connection
```bash
psql -U admin -d flowbit_analytics -h localhost -p 5432
# Password: admin

# You should see the PostgreSQL prompt
flowbit_analytics=#
```

## Backend Setup

### 1. Navigate to Backend
```bash
cd apps/api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
```bash
# Copy example env file
cp .env.example .env

# Or create manually
cat > .env << EOL
DATABASE_URL=postgresql://admin:admin@localhost:5432/flowbit_analytics
VANNA_API_BASE_URL=http://localhost:8000
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOL
```

### 4. Generate Prisma Client
```bash
npm run prisma:generate
```

This generates the TypeScript types and Prisma Client based on your schema.

### 5. Push Database Schema
```bash
npm run prisma:push
```

This creates all tables in PostgreSQL without running migrations.

### 6. Verify Schema
```bash
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555 where you can view your database schema.

### 7. Test Backend
```bash
# Start development server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-08T14:44:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

## Frontend Setup

### 1. Navigate to Frontend
```bash
cd apps/web
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
```bash
cat > .env.local << EOL
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOL
```

### 4. Create Global Styles
```bash
mkdir -p src/app
cat > src/app/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOL
```

### 5. Test Frontend
```bash
# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

## Vanna AI Setup

### 1. Navigate to Vanna Service
```bash
cd services/vanna
```

### 2. Create Virtual Environment
```bash
# Create venv
python -m venv venv

if python version more than {3.12}
py -3.12 -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Environment File
```bash
cat > .env << EOL
GROQ_API_KEY=your_actual_groq_api_key_here
DATABASE_URL=postgresql+psycopg://admin:admin@localhost:5432/flowbit_analytics
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowbit_analytics
DB_USER=admin
DB_PASSWORD=admin
PORT=8000
EOL
```

**Important**: Replace `your_actual_groq_api_key_here` with your real Groq API key!

### 5. Test Vanna AI
```bash
# Start service
python main.py

# In another terminal, test health
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "vanna": "initialized"
}
```

## Data Import

### Option 1: Using Your Analytics_Test_Data.json

```bash
# 1. Place your JSON file in the data folder
mkdir -p data
cp /path/to/Analytics_Test_Data.json data/

# 2. Run seed script
cd apps/api
npm run seed
```

The seed script will:
- Read and parse the JSON file
- Create vendors, customers, invoices, line items, and payments
- Handle relationships automatically

### Option 2: Using Sample Data

If you don't have the JSON file yet, the seed script will create sample data automatically:

```bash
cd apps/api
npm run seed
```

This creates:
- 3 sample vendors
- 50 sample invoices
- Realistic data for testing

### Verify Data Import

```bash
# Open Prisma Studio
npm run prisma:studio

# Or query directly
psql -U admin -d flowbit_analytics -h localhost
SELECT COUNT(*) FROM invoices;
SELECT COUNT(*) FROM vendors;
```

## Testing

### 1. Test All Services

```bash
# Terminal 1: Backend
cd apps/api
npm run dev

# Terminal 2: Frontend
cd apps/web
npm run dev

# Terminal 3: Vanna AI
cd services/vanna
source venv/bin/activate
python main.py
```

### 2. Test API Endpoints

```bash
# Stats
curl http://localhost:3001/api/stats

# Invoices
curl http://localhost:3001/api/invoices

# Top Vendors
curl http://localhost:3001/api/vendors/top10

# Chat (requires Vanna AI running)
curl -X POST http://localhost:3001/api/chat-with-data \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the total spend this year?"}'
```

### 3. Test Frontend

Open http://localhost:3000 and verify:
- ✅ Overview cards show data
- ✅ Charts render correctly
- ✅ Invoices table loads
- ✅ Chat interface works
- ✅ No console errors

## Deployment

### Frontend + Backend (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel dashboard
# - DATABASE_URL (use production PostgreSQL)
# - VANNA_API_BASE_URL (use deployed Vanna URL)
# - NEXT_PUBLIC_API_BASE
# - NEXT_PUBLIC_APP_URL
```

### Vanna AI (Render)

1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Environment**: Python 3.11
5. Add environment variables:
   - `GROQ_API_KEY`
   - `DATABASE_URL` (production)
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - `PORT=8000`
6. Deploy

### Production Database

Use a managed PostgreSQL service:
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **Neon**: https://neon.tech

Update `DATABASE_URL` in all services after provisioning.

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps

# Restart container
docker restart flowbit-postgres

# Check logs
docker logs flowbit-postgres
```

### Prisma Client Not Generated

```bash
cd apps/api
rm -rf node_modules generated
npm install
npm run prisma:generate
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Vanna AI Import Errors

```bash
cd services/vanna
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Frontend Build Errors

```bash
cd apps/web
rm -rf .next node_modules
npm install
npm run dev
```

## Next Steps

1. **Customize the Dashboard**: Modify charts and metrics based on your needs
2. **Add Authentication**: Implement user login and role-based access
3. **Enhance Chat**: Add chat history, favorites, and export features
4. **Optimize Performance**: Add caching, pagination, and lazy loading
5. **Write Tests**: Add unit and integration tests
6. **Monitor**: Set up logging and error tracking

## Support

For issues or questions:
1. Check the [README.md](./README.md)
2. Review API documentation
3. Check Prisma Studio for database issues
4. Review browser console for frontend errors
5. Check server logs for backend errors

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vanna AI Documentation](https://vanna.ai/docs)
- [Groq Documentation](https://console.groq.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

**Congratulations!** 🎉 Your Flowbit Analytics platform is now set up and running!
