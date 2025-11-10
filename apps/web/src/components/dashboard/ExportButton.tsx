'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  StatsResponse,
  TrendDataPoint,
  TopVendor,
  CategorySpend,
  CashOutflowDataPoint,
  CategoryOutflow,
  Invoice,
} from '@/lib/types';

interface ExportButtonProps {
  stats: StatsResponse | null;
  trends: TrendDataPoint[];
  vendors: TopVendor[];
  categories: CategorySpend[];
  cashOutflow: CashOutflowDataPoint[];
  categoryOutflow: CategoryOutflow[];
  invoices: Invoice[];
}

export default function ExportButton({
  stats,
  trends,
  vendors,
  categories,
  cashOutflow,
  categoryOutflow,
  invoices,
}: ExportButtonProps) {
  const exportToCSV = () => {
    // Combine all data
    const exportData = {
      stats: stats ? [stats] : [],
      trends,
      vendors,
      categories,
      cashOutflow,
      categoryOutflow,
      invoices: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        vendor: inv.vendor.name,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        totalAmount: inv.totalAmount,
        category: inv.category || 'N/A',
      })),
    };

    // Create CSV content
    let csvContent = '';

    // Stats
    if (stats) {
      csvContent += 'STATISTICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Spend (YTD),${stats.totalSpend}\n`;
      csvContent += `Total Invoices,${stats.totalInvoices}\n`;
      csvContent += `Documents Uploaded,${stats.documentsUploaded}\n`;
      csvContent += `Average Invoice Value,${stats.averageInvoiceValue}\n\n`;
    }

    // Trends
    csvContent += 'INVOICE TRENDS\n';
    csvContent += 'Month,Invoice Count,Total Value\n';
    trends.forEach((t) => {
      csvContent += `${t.monthName},${t.invoiceCount},${t.totalValue}\n`;
    });
    csvContent += '\n';

    // Vendors
    csvContent += 'TOP VENDORS\n';
    csvContent += 'Vendor Name,Total Spend,Invoice Count\n';
    vendors.forEach((v) => {
      csvContent += `${v.name},${v.totalSpend},${v.invoiceCount}\n`;
    });
    csvContent += '\n';

    // Categories
    csvContent += 'CATEGORY SPEND\n';
    csvContent += 'Category,Amount\n';
    categories.forEach((c) => {
      csvContent += `${c.category},${c.amount}\n`;
    });
    csvContent += '\n';

    // Cash Outflow
    csvContent += 'CASH OUTFLOW FORECAST\n';
    csvContent += 'Month,Expected Outflow\n';
    cashOutflow.forEach((c) => {
      csvContent += `${c.monthName},${c.expectedOutflow}\n`;
    });
    csvContent += '\n';

    // Category Outflow
    csvContent += 'CATEGORY OUTFLOW\n';
    csvContent += 'Category,Amount\n';
    categoryOutflow.forEach((c) => {
      csvContent += `${c.category},${c.amount}\n`;
    });
    csvContent += '\n';

    // Invoices
    csvContent += 'INVOICES\n';
    csvContent += 'Invoice Number,Vendor,Issue Date,Due Date,Status,Total Amount,Category\n';
    invoices.forEach((inv) => {
      csvContent += `${inv.invoiceNumber},${inv.vendor.name},${inv.issueDate},${inv.dueDate || 'N/A'},${inv.status},${inv.totalAmount},${inv.category || 'N/A'}\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `flowbit-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export Data
    </Button>
  );
}

