import axios from 'axios';

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

// API functions
export const statsApi = {
  getStats: () => api.get('/stats'),
};

export const invoicesApi = {
  getInvoices: (params?: any) => api.get('/invoices', { params }),
  getInvoice: (id: string) => api.get(`/invoices/${id}`),
};

export const trendsApi = {
  getTrends: (months?: number) => api.get('/invoice-trends', { params: { months } }),
};

export const vendorsApi = {
  getTop10: (params?: any) => api.get('/vendors/top10', { params }),
  getAll: () => api.get('/vendors'),
};

export const categoryApi = {
  getCategorySpend: (params?: any) => api.get('/category-spend', { params }),
};

export const cashOutflowApi = {
  getForecast: (months?: number) => api.get('/cash-outflow', { params: { months } }),
};

export const chatApi = {
  query: (question: string) => api.post('/chat-with-data', { question }),
  checkHealth: () => api.get('/chat-with-data/health'),
};
