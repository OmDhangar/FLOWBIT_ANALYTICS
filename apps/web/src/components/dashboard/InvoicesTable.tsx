'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

interface InvoicesTableProps {
  invoices: Invoice[];
}

export default function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group invoices by vendor and calculate totals
  const vendorGroups = filteredInvoices.reduce((acc, invoice) => {
    const vendorName = invoice.vendor.name;
    if (!acc[vendorName]) {
      acc[vendorName] = {
        vendor: invoice.vendor.name,
        invoiceCount: 0,
        totalNetValue: 0,
        invoices: [],
      };
    }
    acc[vendorName].invoiceCount += 1;
    acc[vendorName].totalNetValue += invoice.totalAmount;
    acc[vendorName].invoices.push(invoice);
    return acc;
  }, {} as Record<string, { vendor: string; invoiceCount: number; totalNetValue: number; invoices: Invoice[] }>);

  const vendorData = Object.values(vendorGroups)
    .sort((a, b) => b.totalNetValue - a.totalNetValue)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Invoices by Vendor</CardTitle>
            <p className="text-xs text-gray-600 mt-0.5">
              Top vendors by invoice count and net value.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  # Invoices
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendorData.map((vendor, index) => (
                <tr key={vendor.vendor} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                    {vendor.vendor}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                    {vendor.invoiceCount}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                    € {vendor.totalNetValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

