import { useEffect, useState, useCallback } from 'react';
import { expensesApi } from '../services/api';
import { formatCurrency, formatDate, getCurrentMonthYear, EXPENSE_CATEGORIES, downloadCSV } from '../utils/helpers';
import StatCard from '../components/StatCard';
import ExpensePieChart from '../components/charts/ExpensePieChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import ExpenseModal from '../components/modals/ExpenseModal';
import BudgetModal from '../components/modals/BudgetModal';
import toast from 'react-hot-toast';

export default function Expenses() {
  const { month: curM, year: curY } = getCurrentMonthYear();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [filters, setFilters] = useState({ month: curM, year: curY, category: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { month: filters.month, year: filters.year, page, limit: 10 };
      if (filters.category) params.category = filters.category;

      const [listRes, sumRes, trendRes] = await Promise.all([
        expensesApi.getAll(params),
        expensesApi.getSummary({ month: filters.month, year: filters.year }),
        expensesApi.getMonthlyTrend({ year: filters.year }),
      ]);
      setExpenses(listRes.data.expenses);
      setPagination({ total: listRes.data.total, pages: listRes.data.pages });
      setSummary(sumRes.data);
      setTrend(trendRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesApi.remove(id);
      toast.success('Expense deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = expenses.map((e) => ({
      Date: formatDate(e.date),
      Category: e.category,
      Amount: e.amount,
      Notes: e.notes || '',
      Recurring: e.isRecurring ? 'Yes' : 'No',
    }));
    downloadCSV(rows, 'expenses');
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500">Track and manage your spending</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowBudgetModal(true)} className="btn-secondary text-sm">
            Set Budget
          </button>
          <button onClick={handleExport} className="btn-secondary text-sm">
            Export CSV
          </button>
          <button onClick={() => { setEditExpense(null); setShowModal(true); }} className="btn-primary text-sm">
            + Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="label">Month</label>
            <select
              className="input-field w-32"
              value={filters.month}
              onChange={(e) => { setFilters((f) => ({ ...f, month: Number(e.target.value) })); setPage(1); }}
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select
              className="input-field w-28"
              value={filters.year}
              onChange={(e) => { setFilters((f) => ({ ...f, year: Number(e.target.value) })); setPage(1); }}
            >
              {[2022,2023,2024,2025,2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input-field w-36"
              value={filters.category}
              onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(1); }}
            >
              <option value="">All</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {summary?.budgetAlerts?.length > 0 && (
        <div className="space-y-2">
          {summary.budgetAlerts.map((alert) => (
            <div key={alert.category} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-amber-500 text-lg">⚠️</span>
              <p className="text-sm text-amber-800">
                <strong>{alert.category}</strong>: spent {formatCurrency(alert.spent)} of{' '}
                {formatCurrency(alert.limit)} budget ({alert.percentage}%)
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title={`Total Expenses (${months[filters.month - 1]})`}
          value={formatCurrency(summary?.total)}
          icon="💸"
          color="red"
        />
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h3>
          <ExpensePieChart data={summary?.categoryBreakdown || []} />
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend ({filters.year})</h3>
        <MonthlyBarChart data={trend} dataKey="total" color="#ef4444" label="Expenses" />
      </div>

      {/* Transactions Table */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Transactions</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No expenses found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Notes</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Recurring</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="py-2.5 px-3">
                    <span className="badge-blue">{e.category}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-red-600">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell max-w-xs truncate">{e.notes || '—'}</td>
                  <td className="py-2.5 px-3 hidden md:table-cell">
                    {e.isRecurring ? <span className="badge-green">Yes</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditExpense(e); setShowModal(true); }}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(e._id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">{page} / {pagination.pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ExpenseModal
          expense={editExpense}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}

      {showBudgetModal && (
        <BudgetModal
          month={filters.month}
          year={filters.year}
          onClose={() => setShowBudgetModal(false)}
          onSaved={() => { setShowBudgetModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
