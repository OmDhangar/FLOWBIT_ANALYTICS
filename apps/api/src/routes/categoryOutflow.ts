import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/category-outflow - Get cash outflow forecast grouped by category
router.get('/', async (req: Request, res: Response) => {
  try {
    const { months = '24' } = req.query;
    const monthsNum = parseInt(months as string);

    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsNum);

    // Get unpaid and partially paid invoices with due dates, payments,
    // AND their line items
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['PENDING', 'SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
        dueDate: {  
          lte: endDate,
        },
      },
      include: {
        payments: {
          select: {
            amount: true,
          },
        },
        lineItems: {
          select: {
            amount: true,
            category: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Group by category
    const categoryOutflow = new Map<string, number>();

    invoices.forEach((invoice: any) => {
      // Note: We don't need to check if dueDate is null here,
      // because our database query already filters for it (lte: endDate).
      
      // Calculate remaining amount for the *entire invoice*
      const paidAmount = invoice.payments.reduce(
        (sum: number, payment: any) => sum + payment.amount,
        0
      );
      const remainingAmount = invoice.totalAmount - paidAmount;

      if (remainingAmount <= 0) return;

      const lineItemSubtotal = invoice.lineItems.reduce(
        (sum: number, item: any) => sum + item.amount,
        0
      );

      if (lineItemSubtotal <= 0) {
        const category = invoice.category || 'Uncategorized';
        const existing = categoryOutflow.get(category) || 0;
        categoryOutflow.set(category, existing + remainingAmount);
      } else {
        invoice.lineItems.forEach((item: any) => {
          const category = item.category || 'Uncategorized';
          const itemProportion = item.amount / lineItemSubtotal;
          const outflowForItem = remainingAmount * itemProportion;

          const existing = categoryOutflow.get(category) || 0;
          categoryOutflow.set(category, existing + outflowForItem);
        });
      }
    });

    const result = Array.from(categoryOutflow.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error) {
    console.error('Error fetching category outflow:', error);
    res.status(500).json({ error: 'Failed to fetch category outflow forecast' });
  }
});

export default router;