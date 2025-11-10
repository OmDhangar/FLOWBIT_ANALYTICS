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

    // --- START OF FIX ---

    // 1. Set 'today' to the start of the day for accurate date comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Get the key for the CURRENT month (e.g., "2025-11")
    // All overdue invoices will be grouped here.
    const currentMonthKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}`;

    // 3. Set the end date for the forecast
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + monthsNum);

    // 4. Get ALL unpaid invoices with a due date up to the end date
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['PENDING', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
        dueDate: {
          gte: today,
          // This now finds ALL overdue and future-due invoices
          lte: endDate,
          not: null, // Ensure dueDate is not null
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

    invoices.forEach((invoice: any) => {
      // We already filtered for null dueDates in the query

      // Calculate remaining amount
      const paidAmount = invoice.payments.reduce(
        (sum: number, payment: any) => sum + payment.amount,
        0
      );
      const remainingAmount = invoice.totalAmount - paidAmount;

      // Skip if it's already paid off
      if (remainingAmount <= 0) return;

      const invoiceDueDate = new Date(invoice.dueDate);

      let monthKey: string;

      // 5. Grouping Logic:
      // If the invoice is overdue (due date is before today),
      // add its amount to the CURRENT month's bucket.
      if (invoiceDueDate < today) {
        monthKey = currentMonthKey;
      } else {
        // Otherwise, add it to its actual future month
        monthKey = `${invoiceDueDate.getFullYear()}-${String(
          invoiceDueDate.getMonth() + 1
        ).padStart(2, '0')}`;
      }

      const existing = monthlyOutflow.get(monthKey) || 0;
      monthlyOutflow.set(monthKey, existing + remainingAmount);
    });

    // --- END OF FIX ---

    // Convert to array and fill missing months
    const result = [];
    // Start filling buckets from the current date
    const currentDate = new Date(today); 

    for (let i = 0; i < monthsNum; i++) {
      const monthKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}`;

      // Get the sum we calculated. This will include all overdue items
      // in the first month (i=0).
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