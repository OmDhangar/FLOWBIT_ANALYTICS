import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger, logger } from './middleware/logger.js';

// Import routes
import statsRouter from './routes/stats.js';
import invoicesRouter from './routes/invoices.js';
import trendsRouter from './routes/trends.js';
import vendorsRouter from './routes/vendors.js';
import categoryRouter from './routes/category.js';
import cashOutflowRouter from './routes/cashOutflow.js';
import categoryOutflowRouter from './routes/categoryOutflow.js';
import chatRouter from './routes/chat.js';

dotenv.config();

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed',
    });
  }
});

// API Routes
app.use('/api/stats', statsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/invoice-trends', trendsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/category-spend', categoryRouter);
app.use('/api/cash-outflow', cashOutflowRouter);
app.use('/api/category-outflow', categoryOutflowRouter);
app.use('/api/chat-with-data', chatRouter);


app.get('/', (req, res) => {
  res.json({
    message: 'Flowbit Analytics API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      stats: '/api/stats',
      invoices: '/api/invoices',
      trends: '/api/invoice-trends',
      vendors: '/api/vendors/top10',
      categories: '/api/category-spend',
      cashOutflow: '/api/cash-outflow',
      categoryOutflow: '/api/category-outflow',
      chat: '/api/chat-with-data',
    },
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler 
app.use(errorHandler);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 API endpoints available at http://localhost:${PORT}/api`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  server.close(() => {
    process.exit(1);
  });
});

export default app;