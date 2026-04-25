import { useEffect, useState, useCallback } from 'react';
import { incomeApi } from '../services/api';
import { formatCurrency, formatDate, getCurrentMonthYear, INCOME_SOURCES, downloadCSV } from '../utils/helpers';
import StatCard from '../components/StatCard';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import IncomeModal from '../components/modals/IncomeModal';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#94a3b8'];

export default function Income() {
  const { month: curM, year: curY } = getCurrentMonthYear();
  const [incomes, setIncomes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [filters, setFilters] = useState({ month: curM, year: curY });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, sumRes, trendRes] = await Promise.all([
        incomeApi.getAll({ ...filters, page, limit: 10 }),
        incomeApi.getSummary(filters),
        incomeApi.getMonthlyTrend({ year: filters.year }),
      ]);
      setIncomes(listRes.data.incomes);
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
    if (!window.confirm('Delete this income record?')) return;
    try {
      await incomeApi.remove(id);
      toast.success('Income record deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = incomes.map((i) => ({
      Date: formatDate(i.date),
      Source: i.source,
      Amount: i.amount,
      Notes: i.notes || '',
      Recurring: i.isRecurring ? 'Yes' : 'No',
    }));
    downloadCSV(rows, 'income');
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pieData = (summary?.sourceBreakdown || []).map((s) => ({ name: s._id, value: s.total }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Income</h1>
          <p className="text-sm text-gray-500">Track all your earnings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">Export CSV</button>
          <button onClick={() => { setEditIncome(null); setShowModal(true); }} className="btn-primary text-sm">
            + Add Income
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title={`Total Income (${months[filters.month - 1]})`}
          value={formatCurrency(summary?.total)}
          icon="💰"
          color="green"
        />
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Income by Source</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data for selected period</p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Trend ({filters.year})</h3>
        <MonthlyBarChart data={trend} dataKey="total" color="#10b981" label="Income" />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Income Records</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incomes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No income records found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Source</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Notes</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{formatDate(inc.date)}</td>
                  <td className="py-2.5 px-3"><span className="badge-green">{inc.source}</span></td>
                  <td className="py-2.5 px-3 text-right font-semibold text-green-600">{formatCurrency(inc.amount)}</td>
                  <td className="py-2.5 px-3 text-gray-500 hidden md:table-cell max-w-xs truncate">{inc.notes || '—'}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditIncome(inc); setShowModal(true); }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(inc._id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
            <span className="text-sm text-gray-600">{page} / {pagination.pages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {showModal && (
        <IncomeModal
          income={editIncome}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
