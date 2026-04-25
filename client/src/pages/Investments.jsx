import { useEffect, useState, useCallback } from 'react';
import { investmentsApi } from '../services/api';
import { formatCurrency, formatDate, INVESTMENT_TYPES, downloadCSV } from '../utils/helpers';
import StatCard from '../components/StatCard';
import InvestmentModal from '../components/modals/InvestmentModal';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterSold, setFilterSold] = useState('false');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterSold !== 'all') params.isSold = filterSold;
      const [listRes, portfolioRes] = await Promise.all([
        investmentsApi.getAll(params),
        investmentsApi.getPortfolioSummary(),
      ]);
      setInvestments(listRes.data);
      setPortfolio(portfolioRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterSold]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this investment?')) return;
    try {
      await investmentsApi.remove(id);
      toast.success('Investment deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = investments.map((inv) => ({
      Name: inv.name,
      Type: inv.type,
      Ticker: inv.ticker || '',
      Quantity: inv.quantity,
      'Buy Price': inv.buyPrice,
      'Current Price': inv.currentPrice || '',
      'Buy Date': formatDate(inv.buyDate),
      'P&L': inv.profitLoss?.toFixed(2),
    }));
    downloadCSV(rows, 'investments');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Investments</h1>
          <p className="text-sm text-gray-500">Track your portfolio performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">Export CSV</button>
          <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-primary text-sm">
            + Add Investment
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Invested" value={formatCurrency(portfolio?.totalInvested)} icon="💵" color="blue" />
        <StatCard title="Current Value" value={formatCurrency(portfolio?.totalCurrentValue)} icon="📊" color={portfolio?.totalProfitLoss >= 0 ? 'green' : 'red'} />
        <StatCard
          title="Total P&L"
          value={formatCurrency(portfolio?.totalProfitLoss)}
          subtitle={`${portfolio?.profitLossPercentage}%`}
          icon={portfolio?.totalProfitLoss >= 0 ? '📈' : '📉'}
          color={portfolio?.totalProfitLoss >= 0 ? 'green' : 'red'}
        />
        <div className="card">
          <p className="text-sm font-medium text-gray-500 mb-2">Asset Allocation</p>
          {portfolio?.allocation?.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={portfolio.allocation} cx="50%" cy="50%" outerRadius={35} dataKey="value">
                  {portfolio.allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-xs text-center mt-4">No data</p>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-3">
          <label className="label mb-0">Filter:</label>
          <select className="input-field w-36" value={filterSold} onChange={(e) => setFilterSold(e.target.value)}>
            <option value="false">Active Holdings</option>
            <option value="true">Sold</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : investments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No investments found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Type</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Invested</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Current Value</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium hidden md:table-cell">P&L</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">Buy Date</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div>
                      <p className="font-medium text-gray-800">{inv.name}</p>
                      {inv.ticker && <p className="text-xs text-gray-400">{inv.ticker}</p>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3"><span className="badge-blue">{inv.type}</span></td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{formatCurrency(inv.investedAmount)}</td>
                  <td className="py-2.5 px-3 text-right hidden md:table-cell">{formatCurrency(inv.currentValue)}</td>
                  <td className={`py-2.5 px-3 text-right font-semibold hidden md:table-cell ${inv.profitLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {inv.profitLoss >= 0 ? '+' : ''}{formatCurrency(inv.profitLoss)}
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 hidden lg:table-cell">{formatDate(inv.buyDate)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditItem(inv); setShowModal(true); }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(inv._id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <InvestmentModal
          investment={editItem}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
