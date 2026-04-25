import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.msg ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ─── Expenses ────────────────────────────────────────────────────────────────
export const expensesApi = {
  getAll: (params) => api.get('/expenses', { params }),
  getSummary: (params) => api.get('/expenses/summary', { params }),
  getMonthlyTrend: (params) => api.get('/expenses/monthly-trend', { params }),
  getBudgets: (params) => api.get('/expenses/budgets', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
  setBudget: (data) => api.post('/expenses/budgets', data),
};

// ─── Income ──────────────────────────────────────────────────────────────────
export const incomeApi = {
  getAll: (params) => api.get('/income', { params }),
  getSummary: (params) => api.get('/income/summary', { params }),
  getMonthlyTrend: (params) => api.get('/income/monthly-trend', { params }),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  remove: (id) => api.delete(`/income/${id}`),
};

// ─── Investments ─────────────────────────────────────────────────────────────
export const investmentsApi = {
  getAll: (params) => api.get('/investments', { params }),
  getPortfolioSummary: () => api.get('/investments/portfolio-summary'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  remove: (id) => api.delete(`/investments/${id}`),
};

// ─── FDs ─────────────────────────────────────────────────────────────────────
export const fdsApi = {
  getAll: (params) => api.get('/fds', { params }),
  getSummary: () => api.get('/fds/summary'),
  create: (data) => api.post('/fds', data),
  update: (id, data) => api.put(`/fds/${id}`, data),
  remove: (id) => api.delete(`/fds/${id}`),
};

// ─── Loans ───────────────────────────────────────────────────────────────────
export const loansApi = {
  getAll: (params) => api.get('/loans', { params }),
  getSummary: () => api.get('/loans/summary'),
  create: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  remove: (id) => api.delete(`/loans/${id}`),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
  getIncomeVsExpense: (params) => api.get('/dashboard/income-vs-expense', { params }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (id) => api.patch(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.patch(`/admin/users/${id}/unsuspend`),
  makeAdmin: (id) => api.patch(`/admin/users/${id}/make-admin`),
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};
