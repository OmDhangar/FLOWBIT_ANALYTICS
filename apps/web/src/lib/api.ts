import axios from 'axios';
import type {
  StatsResponse,
  InvoicesResponse,
  TrendDataPoint,
  TopVendor,
  CategorySpend,
  CashOutflowDataPoint,
  CategoryOutflow,
  ChatRequest,
  ChatResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;

// API functions with proper typing
export const statsApi = {
  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>('/stats');
    return response.data;
  },
};

export const invoicesApi = {
  getInvoices: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<InvoicesResponse> => {
    const response = await api.get<InvoicesResponse>('/invoices', { params });
    return response.data;
  },
  getInvoice: async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
};

export const trendsApi = {
  getTrends: async (months?: number): Promise<TrendDataPoint[]> => {
    const response = await api.get<TrendDataPoint[]>('/invoice-trends', {
      params: { months },
    });
    return response.data;
  },
};

export const vendorsApi = {
  getTop10: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TopVendor[]> => {
    const response = await api.get<TopVendor[]>('/vendors/top10', { params });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/vendors');
    return response.data;
  },
};

export const categoryApi = {
  getCategorySpend: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CategorySpend[]> => {
    const response = await api.get<CategorySpend[]>('/category-spend', {
      params,
    });
    return response.data;
  },
};

export const cashOutflowApi = {
  getForecast: async (months?: number): Promise<CashOutflowDataPoint[]> => {
    const response = await api.get<CashOutflowDataPoint[]>('/cash-outflow', {
      params: { months },
    });
    return response.data;
  },
};

export const categoryOutflowApi = {
  getByCategory: async (months?: number): Promise<CategoryOutflow[]> => {
    const response = await api.get<CategoryOutflow[]>('/category-outflow', {
      params: { months },
    });
    return response.data;
  },
};

export const chatApi = {
  query: async (question: string): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat-with-data', {
      question,
    } as ChatRequest);
    return response.data;
  },
  checkHealth: async () => {
    const response = await api.get('/chat-with-data/health');
    return response.data;
  },
};
