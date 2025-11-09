# Flowbit Analytics - Production-Grade Full-Stack Analytics Platform

A comprehensive analytics dashboard with AI-powered natural language querying, built with Next.js, Express, PostgreSQL, and Vanna AI.

## 🏗️ Architecture

```
flowbit-analytics/
├── apps/
│   ├── web/          # Next.js frontend (TypeScript + Tailwind + shadcn/ui)
│   └── api/          # Express.js backend (TypeScript + Prisma)
├── services/
│   └── vanna/        # Vanna AI service (Python + FastAPI + Groq)
├── data/
│   └── Analytics_Test_Data.json  # Source data
└── docker-compose.yml
```

## 🚀 Features

### Analytics Dashboard
- **Overview Cards**: Total Spend (YTD), Total Invoices, Documents Uploaded, Average Invoice Value
- **Interactive Charts**:
  - Invoice Volume + Value Trend (Line Chart)
  - Spend by Vendor (Top 10, Horizontal Bar Chart)
  - Spend by Category (Pie Chart)
  - Cash Outflow Forecast (Bar Chart)
- **Invoices Table**: Searchable, sortable, with filters

### Chat with Data
- Natural language queries powered by Vanna AI + Groq LLM
- Real-time SQL generation and execution
- Visual results display with charts
- Query history (bonus feature)

## 📊 Database Schema

### Tables
- **vendors**: Vendor information (name, contact, address)
- **customers**: Customer information
- **invoices**: Invoice records with status, amounts, dates
- **line_items**: Individual items on invoices
- **payments**: Payment records linked to invoices

### Relationships
```
vendors (1) ─── (N) invoices (1) ─── (N) line_items
                     │
                     └─── (N) payments
                     │
customers (1) ─── (N) invoices
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **API**: RESTful

### AI Layer
- **Framework**: FastAPI (Python)
- **AI Engine**: Vanna AI
- **LLM Provider**: Groq (llama-3.3-70b-versatile)
- **Database Connector**: psycopg2

### DevOps
- **Containerization**: Docker & Docker Compose
- **Monorepo**: npm workspaces
- **Deployment**: Vercel (Frontend + Backend), Render/Railway (Vanna AI)

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 16+ (or Docker)
- Groq API Key ([Get one here](https://console.groq.com))

## ⚙️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd flowbit-analytics

# Install root dependencies
npm install

# Install app dependencies
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..

# Install Python dependencies for Vanna
cd services/vanna
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 2. Environment Variables

#### Backend API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/flowbit_analytics
VANNA_API_BASE_URL=http://localhost:8000
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Vanna AI (`services/vanna/.env`)
```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql+psycopg://admin:admin@localhost:5432/flowbit_analytics
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowbit_analytics
DB_USER=admin
DB_PASSWORD=admin
PORT=8000
```

### 3. Start PostgreSQL

```bash
# Using Docker Compose
npm run docker:up

# Or install PostgreSQL locally and create database
createdb flowbit_analytics
```

### 4. Setup Database

```bash
cd apps/api

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed database with sample data or your JSON file
# Place Analytics_Test_Data.json in /data folder first
npm run seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Start Backend API
cd apps/api
npm run dev

# Terminal 2: Start Frontend
cd apps/web
npm run dev

# Terminal 3: Start Vanna AI Service
cd services/vanna
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Vanna AI**: http://localhost:8000

## 📡 API Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/stats` | GET | Overview statistics |
| `/api/invoices` | GET | List invoices (with filters) |
| `/api/invoices/:id` | GET | Get single invoice |
| `/api/invoice-trends` | GET | Invoice volume/value trends |
| `/api/vendors/top10` | GET | Top 10 vendors by spend |
| `/api/category-spend` | GET | Spend by category |
| `/api/cash-outflow` | GET | Cash outflow forecast |
| `/api/chat-with-data` | POST | Natural language query |

### Vanna AI Service

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/query` | POST | Process NL query |
| `/api/train` | POST | Train with custom SQL |

## 🎨 Frontend Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard/
│   │   ├── overview-cards.tsx
│   │   ├── invoice-trends-chart.tsx
│   │   ├── vendor-spend-chart.tsx
│   │   ├── category-spend-chart.tsx
│   │   ├── cash-outflow-chart.tsx
│   │   └── invoices-table.tsx
│   ├── chat/
│   │   ├── chat-interface.tsx
│   │   ├── chat-message.tsx
│   │   └── query-results.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   └── providers/
│       └── query-provider.tsx
├── lib/
│   ├── api.ts              # API client
│   ├── utils.ts            # Utility functions
│   └── types.ts            # TypeScript types
└── hooks/
    ├── use-stats.ts
    ├── use-invoices.ts
    └── use-chat.ts
```

## 🔧 Data Seeding

The seed script (`apps/api/src/seed.ts`) handles:

1. Reading `Analytics_Test_Data.json`
2. Normalizing nested structures
3. Creating vendors, customers, invoices, line items, and payments
4. Handling relationships and foreign keys

**To use your data:**
1. Place `Analytics_Test_Data.json` in `/data` folder
2. Run `npm run seed` from `apps/api`

The script intelligently maps JSON fields to database schema.

## 🚢 Deployment

### Frontend + Backend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from root
vercel

# Set environment variables in Vercel dashboard
```

### Vanna AI (Render/Railway/Fly.io)

**Render:**
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`
5. Add environment variables
6. Deploy

**Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd services/vanna
railway up
```

### Database (Production)

Use managed PostgreSQL:
- **Vercel Postgres**
- **Supabase**
- **Railway**
- **Neon**

Update `DATABASE_URL` in all services.

## 📊 Sample Queries for Chat with Data

- "What's the total spend in the last 90 days?"
- "List top 5 vendors by spend"
- "Show overdue invoices as of today"
- "What is the average invoice value by category?"
- "How many invoices were paid last month?"
- "Show me the cash outflow forecast for next quarter"

## 🎯 Key Features Implemented

✅ Normalized PostgreSQL database with Prisma ORM  
✅ RESTful API with Express.js  
✅ Next.js frontend with App Router  
✅ shadcn/ui components with Tailwind CSS  
✅ Interactive Recharts visualizations  
✅ Vanna AI integration with Groq LLM  
✅ Natural language to SQL conversion  
✅ Real-time query execution  
✅ Docker containerization  
✅ Comprehensive error handling  
✅ TypeScript throughout  
✅ Production-ready configuration  

## 🎁 Bonus Features

- **Persistent Chat History**: Store and retrieve past queries
- **CSV/Excel Export**: Export invoice data
- **Advanced Filters**: Date range, status, vendor filters
- **Responsive Design**: Mobile-friendly UI
- **Dark Mode**: Theme toggle
- **Query Caching**: Faster repeated queries
- **Rate Limiting**: API protection
- **Logging**: Structured logging with timestamps

## 📝 Development Commands

```bash
# Root level
npm run dev              # Start all services
npm run docker:up        # Start PostgreSQL
npm run docker:down      # Stop PostgreSQL

# Backend API
npm run dev              # Development server
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:studio    # Open Prisma Studio
npm run seed             # Seed database

# Frontend
npm run dev              # Development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Vanna AI
python main.py           # Start service
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps

# Restart PostgreSQL
npm run docker:down && npm run docker:up

# Check connection
psql -U admin -d flowbit_analytics -h localhost
```

### Prisma Issues
```bash
# Regenerate client
npm run prisma:generate

# Reset database
npx prisma migrate reset
```

### Vanna AI Issues
```bash
# Check Groq API key is set
echo $GROQ_API_KEY

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 📚 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Vanna AI Docs](https://vanna.ai/docs)
- [Groq Docs](https://console.groq.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built with ❤️ for the Flowbit Analytics internship assessment

---

## 🎬 Quick Start (TL;DR)

```bash
# 1. Install dependencies
npm install && cd apps/api && npm install && cd ../web && npm install && cd ../..

# 2. Start PostgreSQL
npm run docker:up

# 3. Setup database
cd apps/api && npm run prisma:push && npm run seed && cd ../..

# 4. Start all services (3 terminals)
cd apps/api && npm run dev
cd apps/web && npm run dev
cd services/vanna && python main.py

# 5. Open http://localhost:3000
```

**Note**: Don't forget to add your Groq API key to `services/vanna/.env`!
