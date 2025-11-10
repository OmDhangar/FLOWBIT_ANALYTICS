'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Invoice } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface InvoiceStatusChartProps {
  invoices: Invoice[];
}

const STATUS_COLORS: Record<string, string> = {
  PAID: '#10b981',
  PENDING: '#f59e0b',
  SENT: '#3b82f6',
  PARTIALLY_PAID: '#8b5cf6',
  OVERDUE: '#ef4444',
  DRAFT: '#6b7280',
  CANCELLED: '#9ca3af',
};

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, payload, x, y } = props;
  const { status, percentage } = payload;

  const radius = outerRadius + 5; 
  const newX = cx + radius * Math.cos(-midAngle * RADIAN);
  const newY = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const textAnchor = newX > cx ? 'start' : 'end';

  if (percentage < 5) {
    return null;
  }

  return (
    <text
      x={newX}
      y={newY}
      fill="#6b7280" 
      textAnchor={textAnchor}
      dominantBaseline="central"
      style={{ fontSize: '11px', fontWeight: 500 }}
    >
      {`${status}: ${percentage.toFixed(0)}%`}
    </text>
  );
};



export default function InvoiceStatusChart({ invoices }: InvoiceStatusChartProps) {
  // Count invoices by status
  const statusCounts = invoices.reduce((acc, invoice) => {
    const status = invoice.status || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: (count / invoices.length) * 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <p className="font-semibold text-gray-900 mb-1 text-sm">{data.status}</p>
          <p className="text-xs text-gray-700">
            {data.count} invoices ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <Card >
      <CardHeader className="pb-3 ">
        <CardTitle className="text-lg">Invoice Status Distribution</CardTitle>
        <CardDescription className="text-xs">Breakdown of invoices by payment status.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart margin={{ left: 30, right: 30 }}>

            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false} 
              label={renderCustomizedLabel}
              outerRadius={58} 
              innerRadius={20} 
              fill="#8884d8"
              dataKey="count"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status] || '#9ca3af'} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}