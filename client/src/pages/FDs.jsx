import { useEffect, useState, useCallback } from 'react';
import { fdsApi } from '../services/api';
import { formatCurrency, formatDate, downloadCSV } from '../utils/helpers';
import StatCard from '../components/StatCard';
import FDModal from '../components/modals/FDModal';
import toast from 'react-hot-toast';

export default function FDs() {
  const [fds, setFds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFD, setEditFD] = useState(null);
  const [filterMatured, setFilterMatured] = useState('false');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterMatured !== 'all' ? { isMatured: filterMatured } : {};
      const [listRes, sumRes] = await Promise.all([fdsApi.getAll(params), fdsApi.getSummary()]);
      setFds(listRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterMatured]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FD?')) return;
    try {
      await fdsApi.remove(id);
      toast.success('FD deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = fds.map((fd) => ({
      Bank: fd.bankName,
      Principal: fd.principalAmount,
      'Interest Rate': `${fd.interestRate}%`,
      'Start Date': formatDate(fd.startDate),
      'Maturity Date': formatDate(fd.maturityDate),
      'Est. Maturity Amount': fd.estimatedMaturityAmount?.toFixed(2),
      'Interest Earned': fd.interestEarned?.toFixed(2),
    }));
    downloadCSV(rows, 'fixed_deposits');
  };

  const getDaysToMaturity = (maturityDate) => {
    const days = Math.ceil((new Date(maturityDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fixed Deposits</h1>
          <p className="text-sm text-gray-500">Manage your fixed deposit investments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">Export CSV</button>
          <button onClick={() => { setEditFD(null); setShowModal(true); }} className="btn-primary text-sm">
            + Add FD
          </button>
        </div>
      </div>

      {/* Upcoming Maturity Alerts */}
      {summary?.upcomingMaturities?.length > 0 && (
        <div className="space-y-2">
          {summary.upcomingMaturities.map((fd) => (
            <div key={fd._id} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-blue-500 text-lg">📅</span>
              <p className="text-sm text-blue-800">
                <strong>{fd.bankName}</strong> FD of {formatCurrency(fd.principalAmount)} matures on{' '}
                <strong>{formatDate(fd.maturityDate)}</strong> — Est. {formatCurrency(fd.estimatedMaturityAmount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Principal" value={formatCurrency(summary?.totalPrincipal)} icon="🏦" color="teal" />
        <StatCard title="Total Maturity Value" value={formatCurrency(summary?.totalMaturityAmount)} icon="📈" color="green" />
        <StatCard title="Total Interest Earned" value={formatCurrency(summary?.totalInterestEarned)} icon="💰" color="blue" />
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-3">
          <label className="label mb-0">Show:</label>
          <select className="input-field w-36" value={filterMatured} onChange={(e) => setFilterMatured(e.target.value)}>
            <option value="false">Active FDs</option>
            <option value="true">Matured</option>
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
        ) : fds.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No FDs found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Bank</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Principal</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Rate</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium hidden md:table-cell">Maturity Amt.</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">Maturity Date</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium hidden lg:table-cell">Status</th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody>
              {fds.map((fd) => {
                const daysLeft = getDaysToMaturity(fd.maturityDate);
                return (
                  <tr key={fd._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-800">{fd.bankName}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{formatCurrency(fd.principalAmount)}</td>
                    <td className="py-2.5 px-3 text-right hidden md:table-cell">
                      <span className="badge-blue">{fd.interestRate}%</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-green-600 hidden md:table-cell">
                      {formatCurrency(fd.estimatedMaturityAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(fd.maturityDate)}
                      {!fd.isMatured && daysLeft > 0 && (
                        <span className={`ml-1 text-xs ${daysLeft <= 30 ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                          ({daysLeft}d)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 hidden lg:table-cell">
                      {fd.isMatured
                        ? <span className="badge-yellow">Matured</span>
                        : <span className="badge-green">Active</span>
                      }
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditFD(fd); setShowModal(true); }} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(fd._id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <FDModal
          fd={editFD}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
