/**
 * Type definitions for all API responses and data structures
 * This ensures type-safety across the entire frontend application
 */

// ============================================================================
// Statistics API Types
// ============================================================================

export interface StatsResponse {
  totalSpend: number;
  totalInvoices: number;
  documentsUploaded: number;
  averageInvoiceValue: number;
  year: number;
  // Optional fields for trend calculations
  totalSpendChange?: number;
  totalInvoicesChange?: number;
  documentsUploadedChange?: number;
  averageInvoiceValueChange?: number;
}

// ============================================================================
// Invoice Types
// ============================================================================

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'SENT' 
  | 'PAID' 
  | 'PARTIALLY_PAID' 
  | 'OVERDUE' 
  | 'CANCELLED';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Customer {
  id: string;
  name: string;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: Vendor;
  customer?: Customer;
  issueDate: string;
  dueDate?: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  category?: string;
  description?: string;
  documentUrl?: string;
  payments?: Payment[];
  _count?: {
    lineItems: number;
  };
}

export interface InvoicesResponse {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// Trends API Types
// ============================================================================

export interface TrendDataPoint {
  month: string; // Format: "YYYY-MM"
  monthName: string; // Format: "Jan 2024"
  invoiceCount: number;
  totalValue: number;
}

// ============================================================================
// Vendors API Types
// ============================================================================

export interface TopVendor {
  id: string;
  name: string;
  email: string;
  totalSpend: number;
  invoiceCount: number;
}

// ============================================================================
// Category API Types
// ============================================================================

export interface CategorySpend {
  category: string;
  amount: number;
  percentage?: number; // Calculated on frontend
}

// ============================================================================
// Cash Outflow API Types
// ============================================================================

export interface CashOutflowDataPoint {
  month: string; // Format: "YYYY-MM"
  monthName: string; // Format: "Nov 2024"
  expectedOutflow: number;
}

export interface CategoryOutflow {
  category: string;
  amount: number;
}

// Grouped by date ranges for the forecast chart
export interface CashOutflowForecast {
  dateRange: string; // "0-7 days", "8-30 days", etc.
  amount: number;
}

// ============================================================================
// Chat API Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: Array<Record<string, any>>;
  error?: string;
  timestamp: Date;
  executionTime?: number;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  question: string;
  sql?: string;
  results?: Array<Record<string, any>>;
  data?: Array<Record<string, any>>; // Alias for results
  message?: string; // Human-readable response
  error?: string;
  executionTime?: number;
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DateRange = {
  startDate?: string;
  endDate?: string;
};

export type SortOrder = 'asc' | 'desc';

export type SortField = 'issueDate' | 'totalAmount' | 'vendorName' | 'status';

