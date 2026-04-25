import { useState } from 'react';
import Modal from './Modal';
import { expensesApi } from '../../services/api';
import { EXPENSE_CATEGORIES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const FREQUENCIES = ['monthly', 'weekly', 'yearly', 'daily'];

const DEFAULT = {
  amount: '',
  category: 'Food',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  isRecurring: false,
  recurringFrequency: 'monthly',
  budgetLimit: '',
};

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const [form, setForm] = useState(expense ? {
    amount: expense.amount,
    category: expense.category,
    date: expense.date.split('T')[0],
    notes: expense.notes || '',
    isRecurring: expense.isRecurring,
    recurringFrequency: expense.recurringFrequency || 'monthly',
    budgetLimit: expense.budgetLimit || '',
  } : DEFAULT);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    try {
      setSaving(true);
      const payload = {
        ...form,
        amount: Number(form.amount),
        budgetLimit: form.budgetLimit ? Number(form.budgetLimit) : null,
        recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
      };
      if (expense) {
        await expensesApi.update(expense._id, payload);
        toast.success('Expense updated');
      } else {
        await expensesApi.create(payload);
        toast.success('Expense added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={expense ? 'Edit Expense' : 'Add Expense'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (₹) *</label>
            <input
              type="number"
              className="input-field"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Category *</label>
          <select className="input-field" value={form.category} onChange={(e) => set('category', e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input-field resize-none"
            rows={2}
            maxLength={500}
            placeholder="Optional notes..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Budget Limit for Category (₹)</label>
          <input
            type="number"
            className="input-field"
            placeholder="Optional budget limit"
            min="0"
            value={form.budgetLimit}
            onChange={(e) => set('budgetLimit', e.target.value)}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => set('isRecurring', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Recurring expense</span>
          </label>
          {form.isRecurring && (
            <div>
              <label className="label">Frequency</label>
              <select className="input-field" value={form.recurringFrequency} onChange={(e) => set('recurringFrequency', e.target.value)}>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
