import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/vendors/top10 - Get top 10 vendors by spend
router.get('/top10', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause for date filtering
    const where: any = {};
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate as string);
      }
    }

    // Get vendors with their total spend
    const vendors = await prisma.vendor.findMany({
      include: {
        invoices: {
          where,
          select: {
            totalAmount: true,
          },
        },
      },
    });

    // Calculate total spend per vendor
    const vendorSpend = vendors
      .map((vendor:any) => ({
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        totalSpend: vendor.invoices.reduce(
          (sum:any, invoice:any) => sum + invoice.totalAmount,
          0
        ),
        invoiceCount: vendor.invoices.length,
      }))
      .filter((v:any) => v.totalSpend > 0)
      .sort((a:any, b:any) => b.totalSpend - a.totalSpend)
      .slice(0, 10);

    res.json(vendorSpend);
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    res.status(500).json({ error: 'Failed to fetch top vendors' });
  }
});

// GET /api/vendors - Get all vendors
router.get('/', async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

export default router;
