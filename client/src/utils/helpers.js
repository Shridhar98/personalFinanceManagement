export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatShortDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const getMonthName = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};

export const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Rent', 'Utilities', 'Healthcare',
  'Entertainment', 'Shopping', 'Education', 'Investment', 'EMI', 'Subscription', 'Other',
];

export const INCOME_SOURCES = [
  'Salary', 'Freelance', 'Passive', 'Business', 'Rental', 'Dividend', 'Bonus', 'Gift', 'Other',
];

export const INVESTMENT_TYPES = [
  'Stock', 'MutualFund', 'ETF', 'Crypto', 'Gold', 'RealEstate', 'Other',
];

export const LOAN_TYPES = [
  'Home', 'Car', 'Personal', 'Education', 'Business', 'Gold', 'Other',
];

export const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Travel: '#3b82f6',
  Rent: '#8b5cf6',
  Utilities: '#06b6d4',
  Healthcare: '#ef4444',
  Entertainment: '#ec4899',
  Shopping: '#f97316',
  Education: '#10b981',
  Investment: '#14b8a6',
  EMI: '#6366f1',
  Subscription: '#84cc16',
  Other: '#94a3b8',
};

export const downloadCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
