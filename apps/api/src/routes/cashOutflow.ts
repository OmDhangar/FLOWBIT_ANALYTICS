// apps/api/src/routes/cashOutflow.ts

import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/cash-outflow - Get expected cash outflow forecast
router.get('/', async (req: Request, res: Response) => {
  try {
    const { months = '6' } = req.query;
    const monthsNum = parseInt(months as string);

    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsNum);

    // Get unpaid and partially paid invoices with due dates
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['PENDING', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
        dueDate: {
          gte: today,
          lte: endDate,
        },
      },
      include: {
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Group by month
    const monthlyOutflow = new Map<string, number>();

    invoices.forEach((invoice:any) => {
      if (!invoice.dueDate) return;

      const monthKey = `${invoice.dueDate.getFullYear()}-${String(
        invoice.dueDate.getMonth() + 1
      ).padStart(2, '0')}`;

      // Calculate remaining amount
      const paidAmount = invoice.payments.reduce(
        (sum:any, payment:any) => sum + payment.amount,
        0
      );
      const remainingAmount = invoice.totalAmount - paidAmount;

      const existing = monthlyOutflow.get(monthKey) || 0;
      monthlyOutflow.set(monthKey, existing + remainingAmount);
    });

    // Convert to array and fill missing months
    const result = [];
    const currentDate = new Date(today);

    for (let i = 0; i < monthsNum; i++) {
      const monthKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}`;

      const amount = monthlyOutflow.get(monthKey) || 0;

      result.push({
        month: monthKey,
        monthName: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        expectedOutflow: amount,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching cash outflow:', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow forecast' });
  }
});

export default router;
