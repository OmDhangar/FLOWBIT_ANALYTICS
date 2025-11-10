'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { CategorySpend } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CategorySpendChartProps {
  data: CategorySpend[];
}

const COLORS = ['#3b82f6', '#f97316', '#fbbf24'];

export default function CategorySpendChart({ data }: CategorySpendChartProps) {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: (item.amount / total) * 100,
  }));

  const formatCurrency = (value: number) => {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{data.category}</p>
          <p className="text-sm text-gray-700">
            {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Spend by Category</CardTitle>
        <CardDescription className="text-xs">Distribution of spending across different categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1.5">
          {dataWithPercentage.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-700">{item.category}</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

