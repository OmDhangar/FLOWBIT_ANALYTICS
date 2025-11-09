# Quick Start Guide - Flowbit Analytics

Get the Flowbit Analytics platform running in under 10 minutes.

## Prerequisites Check

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
python --version  # Should be v3.11+
docker --version  # Optional
```

## 1. Install All Dependencies (3 minutes)

```bash
# Root dependencies
npm install

# Backend dependencies
cd apps/api
npm install
cd ../..

# Frontend dependencies
cd apps/web
npm install
cd ../..

# Vanna AI dependencies
cd services/vanna
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

## 2. Start PostgreSQL (1 minute)

```bash
# Using Docker (recommended)
npm run docker:up

# Verify it's running
docker ps
# You should see: flowbit-postgres
```

## 3. Setup Database (2 minutes)

```bash
cd apps/api

# Create .env file
cat > .env << 'EOL'
DATABASE_URL=postgresql://admin:admin@localhost:5432/flowbit_analytics
VANNA_API_BASE_URL=http://localhost:8000
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EOL

# Generate Prisma client and push schema
npm run prisma:generate
npm run prisma:push

# Seed with sample data
npm run seed

cd ../..
```

## 4. Configure Services (1 minute)

### Frontend Environment
```bash
cd apps/web

cat > .env.local << 'EOL'
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOL

cd ../..
```

### Vanna AI Environment
```bash
cd services/vanna

cat > .env << 'EOL'
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql+psycopg://admin:admin@localhost:5432/flowbit_analytics
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowbit_analytics
DB_USER=admin
DB_PASSWORD=admin
PORT=8000
EOL

# IMPORTANT: Replace 'your_groq_api_key_here' with your actual Groq API key
# Get one free at: https://console.groq.com/keys

cd ../..
```

## 5. Start All Services (3 terminals)

### Terminal 1: Backend API
```bash
cd apps/api
npm run dev
```

Wait for: `🚀 Server running on port 3001`

### Terminal 2: Frontend
```bash
cd apps/web
npm run dev
```

Wait for: `Ready on http://localhost:3000`

### Terminal 3: Vanna AI
```bash
cd services/vanna
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

Wait for: `Vanna AI Service started successfully`

## 6. Access the Application

Open your browser and navigate to:

**http://localhost:3000**

You should see:
- ✅ Analytics Dashboard with charts
- ✅ Overview cards with data
- ✅ Invoices table
- ✅ Chat with Data tab

## Verify Everything Works

### Test Backend API
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy",...}
```

### Test Vanna AI
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}
```

### Test Chat Feature
1. Click "Chat with Data" in sidebar
2. Type: "What is the total spend this year?"
3. Press Enter
4. You should see SQL query and results

## Common Issues & Fixes

### Port Already in Use
```bash
# Find and kill process on port 3001 (backend)
# Mac/Linux:
lsof -ti:3001 | xargs kill -9

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database Connection Failed
```bash
# Restart PostgreSQL
npm run docker:down
npm run docker:up

# Or check if it's running
docker ps
```

### Prisma Client Not Found
```bash
cd apps/api
rm -rf node_modules generated
npm install
npm run prisma:generate
```

### Vanna AI Import Errors
```bash
cd services/vanna
pip install -r requirements.txt --force-reinstall
```

### Frontend Build Errors
```bash
cd apps/web
rm -rf .next node_modules
npm install
```

## Next Steps

1. **Import Your Data**: Place `Analytics_Test_Data.json` in `/data` folder and run `npm run seed`
2. **Customize Dashboard**: Edit components in `apps/web/src/components/dashboard/`
3. **Add Features**: Implement additional charts or filters
4. **Deploy**: Follow `DEPLOYMENT.md` for production deployment

## Development Workflow

```bash
# Start all services
npm run dev  # From root (if configured)

# Or manually in 3 terminals:
cd apps/api && npm run dev
cd apps/web && npm run dev
cd services/vanna && python main.py

# View database
cd apps/api && npm run prisma:studio

# Reset database
cd apps/api && npm run prisma:push -- --force-reset
npm run seed
```

## Stopping Services

```bash
# Stop all servers: Ctrl+C in each terminal

# Stop PostgreSQL
npm run docker:down
```

## File Structure Reference

```
flowbit-analytics/
├── apps/
│   ├── api/              # Express backend
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/              # Next.js frontend
│       └── src/
│           ├── app/      # Pages
│           ├── components/  # React components
│           └── lib/      # Utilities
├── services/
│   └── vanna/            # Vanna AI service
│       ├── main.py
│       └── requirements.txt
├── data/
│   └── Analytics_Test_Data.json
└── docker-compose.yml
```

## Useful Commands

```bash
# View logs
docker logs flowbit-postgres

# Access PostgreSQL directly
psql postgresql://admin:admin@localhost:5432/flowbit_analytics

# Check API endpoints
curl http://localhost:3001/api/stats
curl http://localhost:3001/api/invoices
curl http://localhost:3001/api/vendors/top10

# Test chat
curl -X POST http://localhost:3001/api/chat-with-data \
  -H "Content-Type: application/json" \
  -d '{"question":"Show me top 5 vendors"}'
```

## Getting Help

- **Setup Issues**: Check `SETUP_GUIDE.md`
- **API Reference**: See `API_DOCUMENTATION.md`
- **Database Schema**: Review `DATABASE_SCHEMA.md`
- **Deployment**: Follow `DEPLOYMENT.md`

---

**You're all set!** 🎉 The Flowbit Analytics platform is now running locally.

For production deployment, see `DEPLOYMENT.md`.
