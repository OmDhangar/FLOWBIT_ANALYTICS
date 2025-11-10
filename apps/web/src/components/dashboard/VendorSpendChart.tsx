'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TopVendor } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VendorSpendChartProps {
  data: TopVendor[];
}

export default function VendorSpendChart({ data }: VendorSpendChartProps) {
  const formatCurrency = (value: number) => {
    return `€${(value / 1000).toFixed(0)}k`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const vendor = payload[0].payload;
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{vendor.name}</p>
          <div className="text-sm text-gray-700">
            <span>Vendor Spend: </span>
            <span className="font-semibold">€ {vendor.totalSpend.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Spend by Vendor (Top 10)</CardTitle>
        <CardDescription className="text-xs">Vendor spend with cumulative percentage distribution.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalSpend" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

