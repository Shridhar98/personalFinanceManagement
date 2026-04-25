import { useState } from 'react';
import Modal from './Modal';
import { fdsApi } from '../../services/api';
import toast from 'react-hot-toast';

const COMPOUNDING = ['monthly', 'quarterly', 'half-yearly', 'yearly'];

const DEFAULT = {
  bankName: '',
  principalAmount: '',
  interestRate: '',
  startDate: new Date().toISOString().split('T')[0],
  maturityDate: '',
  compoundingFrequency: 'quarterly',
  isMatured: false,
  notes: '',
};

export default function FDModal({ fd, onClose, onSaved }) {
  const [form, setForm] = useState(fd ? {
    bankName: fd.bankName,
    principalAmount: fd.principalAmount,
    interestRate: fd.interestRate,
    startDate: fd.startDate.split('T')[0],
    maturityDate: fd.maturityDate.split('T')[0],
    compoundingFrequency: fd.compoundingFrequency,
    isMatured: fd.isMatured,
    notes: fd.notes || '',
  } : DEFAULT);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bankName.trim()) return toast.error('Bank name is required');
    if (!form.principalAmount || Number(form.principalAmount) <= 0) return toast.error('Enter a valid principal');
    if (!form.maturityDate) return toast.error('Maturity date is required');
    if (new Date(form.maturityDate) <= new Date(form.startDate)) return toast.error('Maturity date must be after start date');

    try {
      setSaving(true);
      const payload = {
        ...form,
        principalAmount: Number(form.principalAmount),
        interestRate: Number(form.interestRate),
      };
      if (fd) {
        await fdsApi.update(fd._id, payload);
        toast.success('FD updated');
      } else {
        await fdsApi.create(payload);
        toast.success('FD added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={fd ? 'Edit Fixed Deposit' : 'Add Fixed Deposit'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Bank Name *</label>
          <input type="text" className="input-field" placeholder="e.g. SBI, HDFC" value={form.bankName} onChange={(e) => set('bankName', e.target.value)} required maxLength={100} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Principal Amount (₹) *</label>
            <input type="number" className="input-field" placeholder="0" min="1" step="1" value={form.principalAmount} onChange={(e) => set('principalAmount', e.target.value)} required />
          </div>
          <div>
            <label className="label">Interest Rate (% p.a.) *</label>
            <input type="number" className="input-field" placeholder="e.g. 7.5" min="0" max="100" step="0.1" value={form.interestRate} onChange={(e) => set('interestRate', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input-field" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </div>
          <div>
            <label className="label">Maturity Date *</label>
            <input type="date" className="input-field" value={form.maturityDate} onChange={(e) => set('maturityDate', e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label">Compounding Frequency</label>
          <select className="input-field" value={form.compoundingFrequency} onChange={(e) => set('compoundingFrequency', e.target.value)}>
            {COMPOUNDING.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input-field resize-none" rows={2} maxLength={500} placeholder="Optional notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {fd && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isMatured} onChange={(e) => set('isMatured', e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <span className="text-sm text-gray-700 font-medium">Mark as matured</span>
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : fd ? 'Update' : 'Add FD'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
