'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendDataPoint } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoiceTrendChartProps {
  data: TrendDataPoint[];
}

export default function InvoiceTrendChart({ data }: InvoiceTrendChartProps) {
  const formatCurrency = (value: number) => {
    return `€ ${(value / 1000).toFixed(0)}k`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const invoiceCount = payload.find((p: any) => p.dataKey === 'invoiceCount')?.value || 0;
      const totalSpend = payload.find((p: any) => p.dataKey === 'totalValue')?.value || 0;
      
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center text-gray-700">
              <span className="mr-2">Invoice count:</span>
              <span className="font-semibold">{invoiceCount}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="mr-2">Total Spend:</span>
              <span className="font-semibold">€ {totalSpend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Invoice Volume + Value Trend</CardTitle>
        <CardDescription className="text-xs">Invoice count and total spend over 12 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="monthName" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="invoiceCount" 
              stroke="#6366f1" 
              strokeWidth={2}
              name="Invoice Count"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              stroke="#9ca3af" 
              strokeWidth={2}
              name="Total Value (€)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

