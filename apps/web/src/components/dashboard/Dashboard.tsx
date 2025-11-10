'use client';

import { useState, useEffect } from 'react';
import {
  statsApi,
  trendsApi,
  vendorsApi,
  categoryApi,
  cashOutflowApi,
  categoryOutflowApi,
  invoicesApi,
} from '@/lib/api';
import type {
  StatsResponse,
  TrendDataPoint,
  TopVendor,
  CategorySpend,
  CashOutflowDataPoint,
  CategoryOutflow,
  Invoice,
} from '@/lib/types';
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import InvoiceTrendChart from './InvoiceTrendChart';
import VendorSpendChart from './VendorSpendChart';
import CategorySpendChart from './CategorySpendChart';
import CashOutflowChart from './CashOutflowChart';
import CategoryOutflowChart from './CategoryOutflowChart';
import InvoiceStatusChart from './InvoiceStatusChart';
import MonthlySpendTrendChart from './MonthlySpendTrendChart';
import InvoicesTable from './InvoicesTable';
import ExportButton from './ExportButton';

export default function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [categories, setCategories] = useState<CategorySpend[]>([]);
  const [cashOutflow, setCashOutflow] = useState<CashOutflowDataPoint[]>([]);
  const [categoryOutflow, setCategoryOutflow] = useState<CategoryOutflow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, trendsData, vendorsData, categoriesData, cashOutflowData, categoryOutflowData, invoicesData] =
        await Promise.all([
          statsApi.getStats(),
          trendsApi.getTrends(12),
          vendorsApi.getTop10(),
          categoryApi.getCategorySpend(),
          cashOutflowApi.getForecast(6),
          categoryOutflowApi.getByCategory(6),
          invoicesApi.getInvoices({ limit: 50 }),
        ]);

      setStats(statsData);
      setTrends(trendsData);
      setTopVendors(vendorsData);
      setCategories(categoriesData);
      setCashOutflow(cashOutflowData);
      setCategoryOutflow(categoryOutflowData);
      setInvoices(invoicesData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `€ ${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate month-over-month changes (simplified - in production, fetch previous month data)
  const getChangeLabel = (change: number): string => {
    const absChange = Math.abs(change);
    if (change > 0) {
      return `+${absChange.toFixed(1)}% from last month`;
    } else if (change < 0) {
      return `less from last month`;
    }
    return 'No change';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 ">
      <div className="flex items-center justify-between mb-4">
        <DashboardHeader />
        {stats && (
          <ExportButton
            stats={stats}
            trends={trends}
            vendors={topVendors}
            categories={categories}
            cashOutflow={cashOutflow}
            categoryOutflow={categoryOutflow}
            invoices={invoices}
          />
        )}
      </div>
          {stats && (
            <>
              {/* Top Row - Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard
                  title="Total Spend (YTD)"
                  value={formatCurrency(stats.totalSpend)}
                  change={stats.totalSpendChange || 8.2}
                  changeLabel={getChangeLabel(stats.totalSpendChange || 8.2)}
                  trend="up"
                />
                <StatCard
                  title="Total Invoices Processed"
                  value={stats.totalInvoices.toString()}
                  change={stats.totalInvoicesChange || 8.2}
                  changeLabel={getChangeLabel(stats.totalInvoicesChange || 8.2)}
                  trend="up"
                  highlighted
                />
                <StatCard
                  title="Documents Uploaded This Month"
                  value={stats.documentsUploaded.toString()}
                  change={stats.documentsUploadedChange || -5}
                  changeLabel={getChangeLabel(stats.documentsUploadedChange || -5)}
                  trend="down"
                />
                <StatCard
                  title="Average Invoice Value"
                  value={formatCurrency(stats.averageInvoiceValue)}
                  change={stats.averageInvoiceValueChange || 8.2}
                  changeLabel={getChangeLabel(stats.averageInvoiceValueChange || 8.2)}
                  trend="up"
                />
              </div>

              {/* Middle Row - Large Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                <InvoiceTrendChart data={trends} />
                <VendorSpendChart data={topVendors} />
              </div>

              {/* Category Spend and Invoices Table Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                <CategorySpendChart data={categoryOutflow} />
                <InvoicesTable invoices={invoices} />
              </div>

              {/* Bottom Row - Three Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                <CashOutflowChart data={cashOutflow} />
                <MonthlySpendTrendChart data={trends} />
                <InvoiceStatusChart invoices={invoices} />
              </div>
            </>
          )}
    </div>
  );
}