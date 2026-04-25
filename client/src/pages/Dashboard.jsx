import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import StatCard from '../components/StatCard';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, chartRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getIncomeVsExpense({ year }),
        ]);
        setSummary(sumRes.data);
        setChartData(chartRes.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const savingsTrend = summary?.lastMonth.savings
    ? ((summary.monthly.savings - summary.lastMonth.savings) / Math.abs(summary.lastMonth.savings)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Net Worth Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium">Total Net Worth</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(summary?.netWorth)}</p>
        <p className="text-blue-200 text-sm mt-1">Assets − Outstanding Liabilities</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(summary?.monthly.income)}
          subtitle="This month"
          icon="💰"
          color="green"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(summary?.monthly.expense)}
          subtitle="This month"
          icon="💸"
          color="red"
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(summary?.monthly.savings)}
          subtitle="Income − Expenses"
          icon="🏦"
          trend={savingsTrend}
          color="blue"
        />
        <StatCard
          title="Monthly EMIs"
          value={formatCurrency(summary?.loans.monthlyEMI)}
          subtitle={`${summary?.loans.count} active loans`}
          icon="💳"
          color="purple"
        />
      </div>

      {/* Second row cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(summary?.investments.totalCurrentValue)}
          subtitle={`P&L: ${formatCurrency(summary?.investments.profitLoss)}`}
          icon="📈"
          color={summary?.investments.profitLoss >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Fixed Deposits"
          value={formatCurrency(summary?.fds.totalPrincipal)}
          subtitle={`${summary?.fds.count} active FDs`}
          icon="🏦"
          color="teal"
        />
        <StatCard
          title="Outstanding Loans"
          value={formatCurrency(summary?.loans.totalOutstanding)}
          subtitle={`${summary?.loans.count} active loans`}
          icon="📋"
          color="yellow"
        />
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-800">Income vs Expenses</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-field w-auto"
          >
            {[2022, 2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <IncomeExpenseChart data={chartData} />
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        {summary?.recentTransactions?.length ? (
          <div className="space-y-3">
            {summary.recentTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm
                    ${tx.transactionType === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tx.transactionType === 'income' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {tx.category || tx.source}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.transactionType === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.transactionType === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
