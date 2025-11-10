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
import { CashOutflowDataPoint } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CashOutflowChartProps {
  data: CashOutflowDataPoint[];
}

export default function CashOutflowChart({ data }: CashOutflowChartProps) {
  // Data is already grouped by month from the API, so no client-side grouping is needed.

  const formatCurrency = (value: number) => {
    // Handle case where value might be 0 to avoid "€NaNk"
    if (value === 0) return '€0';
    return `€${(value / 1000).toFixed(0)}k`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Use the 'monthName' and 'expectedOutflow' fields from the prop data
      const monthName = payload[0].payload.monthName;
      const amount = payload[0].payload.expectedOutflow;

      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{monthName}</p>
          <p className="text-sm text-gray-700">
            € {amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Cash Outflow Forecast</CardTitle>
        {/* Updated description to match the monthly data */}
        <CardDescription className="text-xs">Expected payment obligations for the coming months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {/* 1. Use the 'data' prop directly */}
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              // 2. Use 'monthName' for the X-axis
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
            {/* 3. Use 'expectedOutflow' as the dataKey for the bar */}
            <Bar dataKey="expectedOutflow" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}