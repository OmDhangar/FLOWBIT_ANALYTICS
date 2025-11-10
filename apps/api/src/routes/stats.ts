import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/stats - Get overview statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Total spend (YTD)
    const totalSpendResult = await prisma.invoice.aggregate({
      where: {
        issueDate: {
          gte: yearStart,
        },
        status: {
          in: ['PAID', 'PARTIALLY_PAID', 'SENT', 'PENDING'],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Total invoices processed
    const totalInvoices = await prisma.invoice.count({
      where: {
        issueDate: {
          gte: yearStart,
        },
      },
    });

    const documentsUploaded = await prisma.invoice.count({
      where: {
        documentUrl: {
          not: null,
        },
      },
    });

    // Average invoice value
    const avgInvoiceResult = await prisma.invoice.aggregate({
      where: {
        issueDate: {
          gte: yearStart,
        },
      },
      _avg: {
        totalAmount: true,
      },
    });

    res.json({
      totalSpend: totalSpendResult._sum.totalAmount || 0,
      totalInvoices,
      documentsUploaded,
      averageInvoiceValue: avgInvoiceResult._avg.totalAmount || 0,
      year: currentYear,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
