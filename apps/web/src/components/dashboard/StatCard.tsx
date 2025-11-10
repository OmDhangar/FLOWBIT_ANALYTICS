'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlighted?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  trend = 'neutral',
  highlighted = false 
}: StatCardProps) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  return (
    <div
      className={cn(
        "bg-white rounded-lg p-4 shadow-sm border",
        highlighted ? "border-yellow-400 border-2" : "border-gray-200"
      )}
    >
      <div className="mb-1.5">
        <span className="text-xs text-gray-600 font-medium">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900 mb-0.5">{value}</div>
          {change !== undefined && changeLabel && (
            <div
              className={cn(
                "flex items-center text-xs",
                isPositive && "text-green-600",
                isNegative && "text-gray-500",
                trend === 'neutral' && "text-gray-500"
              )}
            >
              {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
              {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
              {changeLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

