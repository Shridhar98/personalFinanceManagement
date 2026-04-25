import { useState } from 'react';
import Modal from './Modal';
import { expensesApi } from '../../services/api';
import { EXPENSE_CATEGORIES, getCurrentMonthYear } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function BudgetModal({ month, year, onClose, onSaved }) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limitAmount, setLimitAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!limitAmount || Number(limitAmount) <= 0) return toast.error('Enter a valid budget limit');
    try {
      setSaving(true);
      await expensesApi.setBudget({ category, limitAmount: Number(limitAmount), month, year });
      toast.success('Budget limit set');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <Modal title={`Set Budget — ${monthNames[month - 1]} ${year}`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Category</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Budget Limit (₹)</label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 5000"
            min="1"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            required
          />
          <p className="text-xs text-gray-400 mt-1">You'll be alerted when spending exceeds 80%</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Set Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
