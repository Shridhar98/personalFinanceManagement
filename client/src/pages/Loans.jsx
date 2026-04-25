import { useEffect, useState, useCallback } from 'react';
import { loansApi } from '../services/api';
import { formatCurrency, formatDate, downloadCSV } from '../utils/helpers';
import StatCard from '../components/StatCard';
import LoanModal from '../components/modals/LoanModal';
import toast from 'react-hot-toast';

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [filterActive, setFilterActive] = useState('true');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterActive !== 'all' ? { isActive: filterActive } : {};
      const [listRes, sumRes] = await Promise.all([loansApi.getAll(params), loansApi.getSummary()]);
      setLoans(listRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterActive]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this loan?')) return;
    try {
      await loansApi.remove(id);
      toast.success('Loan deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = loans.map((l) => ({
      Type: l.loanType,
      Lender: l.lenderName,
      Principal: l.principalAmount,
      'Interest Rate': `${l.interestRate}%`,
      EMI: l.emiAmount,
      'Amount Paid': l.amountPaid,
      Outstanding: l.outstandingAmount,
      'End Date': formatDate(l.endDate),
    }));
    downloadCSV(rows, 'loans');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500">Track EMIs and outstanding amounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">Export CSV</button>
          <button onClick={() => { setEditLoan(null); setShowModal(true); }} className="btn-primary text-sm">
            + Add Loan
          </button>
        </div>
      </div>

      {/* Upcoming EMI Alerts */}
      {summary?.upcomingEMIs?.length > 0 && (
        <div className="space-y-2">
          {summary.upcomingEMIs.map((emi) => (
            <div key={emi._id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-amber-500 text-lg">⏰</span>
              <p className="text-sm text-amber-800">
                EMI of <strong>{formatCurrency(emi.emiAmount)}</strong> for{' '}
                <strong>{emi.loanType} ({emi.lenderName})</strong> due on{' '}
                <strong>{formatDate(emi.nextEmiDate)}</strong>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Outstanding" value={formatCurrency(summary?.totalOutstanding)} icon="💳" color="red" />
        <StatCard title="Monthly EMI" value={formatCurrency(summary?.monthlyEMI)} icon="📆" color="purple" />
        <StatCard title="Active Loans" value={summary?.activeLoans || 0} icon="📋" color="blue" />
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-3">
          <label className="label mb-0">Show:</label>
          <select className="input-field w-36" value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
            <option value="true">Active Loans</option>
            <option value="false">Closed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Loan Cards / Table */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loans.length === 0 ? (
          <div className="card">
            <p className="text-gray-400 text-sm text-center py-6">No loans found</p>
          </div>
        ) : (
          loans.map((loan) => (
            <div key={loan._id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{loan.loanType} Loan</h3>
                    <span className="text-gray-400 text-sm">— {loan.lenderName}</span>
                    {loan.isActive
                      ? <span className="badge-green">Active</span>
                      : <span className="badge-yellow">Closed</span>
                    }
                  </div>
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Paid: {formatCurrency(loan.amountPaid)}</span>
                      <span>Outstanding: {formatCurrency(loan.outstandingAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${loan.completionPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{loan.completionPercentage?.toFixed(1)}% complete</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Principal</p>
                      <p className="font-medium">{formatCurrency(loan.principalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Monthly EMI</p>
                      <p className="font-medium text-purple-600">{formatCurrency(loan.emiAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Interest Rate</p>
                      <p className="font-medium">{loan.interestRate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">End Date</p>
                      <p className="font-medium">{formatDate(loan.endDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditLoan(loan); setShowModal(true); }} className="btn-secondary text-xs">Edit</button>
                  <button onClick={() => handleDelete(loan._id)} className="btn-danger text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <LoanModal
          loan={editLoan}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
