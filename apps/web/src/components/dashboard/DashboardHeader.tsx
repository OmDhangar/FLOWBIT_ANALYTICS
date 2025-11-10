'use client';

import { MoreVertical } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <span className="text-gray-600 font-semibold text-sm">AJ</span>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">Amit Jadhav</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

