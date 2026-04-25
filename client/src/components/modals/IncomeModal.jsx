import { useState } from 'react';
import Modal from './Modal';
import { incomeApi } from '../../services/api';
import { INCOME_SOURCES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const FREQUENCIES = ['monthly', 'weekly', 'yearly', 'daily'];

const DEFAULT = {
  amount: '',
  source: 'Salary',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  isRecurring: false,
  recurringFrequency: 'monthly',
};

export default function IncomeModal({ income, onClose, onSaved }) {
  const [form, setForm] = useState(income ? {
    amount: income.amount,
    source: income.source,
    date: income.date.split('T')[0],
    notes: income.notes || '',
    isRecurring: income.isRecurring,
    recurringFrequency: income.recurringFrequency || 'monthly',
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
        recurringFrequency: form.isRecurring ? form.recurringFrequency : null,
      };
      if (income) {
        await incomeApi.update(income._id, payload);
        toast.success('Income updated');
      } else {
        await incomeApi.create(payload);
        toast.success('Income added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={income ? 'Edit Income' : 'Add Income'} onClose={onClose}>
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
          <label className="label">Source *</label>
          <select className="input-field" value={form.source} onChange={(e) => set('source', e.target.value)}>
            {INCOME_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
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

        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => set('isRecurring', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Recurring income</span>
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
            {saving ? 'Saving...' : income ? 'Update' : 'Add Income'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
