// apps/api/src/routes/trends.ts

import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/invoice-trends - Get invoice volume and value trends
router.get('/', async (req: Request, res: Response) => {
  try {
    const { months = '12' } = req.query;
    const monthsNum = parseInt(months as string);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    // Get invoices grouped by month
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
        },
      },
      select: {
        issueDate: true,
        totalAmount: true,
      },
      orderBy: {
        issueDate: 'asc',
      },
    });

    // Group by month
    const monthlyData = new Map<string, { count: number; total: number }>();

    invoices.forEach((invoice:any) => {
      const monthKey = `${invoice.issueDate.getFullYear()}-${String(
        invoice.issueDate.getMonth() + 1
      ).padStart(2, '0')}`;

      const existing = monthlyData.get(monthKey) || { count: 0, total: 0 };
      monthlyData.set(monthKey, {
        count: existing.count + 1,
        total: existing.total + invoice.totalAmount,
      });
    });

    // Convert to array and fill missing months
    const result = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < monthsNum; i++) {
      const monthKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}`;
      
      const data = monthlyData.get(monthKey) || { count: 0, total: 0 };
      
      result.push({
        month: monthKey,
        monthName: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        invoiceCount: data.count,
        totalValue: data.total,
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch invoice trends' });
  }
});

export default router;
