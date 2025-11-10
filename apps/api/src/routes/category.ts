import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/category-spend - Get spend grouped by category
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      category: {
        not: null,
      },
    };

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate as string);
      }
    }

    // Get invoices grouped by category
    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        category: true,
        totalAmount: true,
      },
    });

    // Group by category
    const categoryMap = new Map<string, number>();

    invoices.forEach((invoice) => {
      const category = invoice.category || 'Uncategorized';
      const existing = categoryMap.get(category) || 0;
      categoryMap.set(category, existing + invoice.totalAmount);
    });

    // Convert to array and sort
    const result = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error) {
    console.error('Error fetching category spend:', error);
    res.status(500).json({ error: 'Failed to fetch category spend' });
  }
});

export default router;
