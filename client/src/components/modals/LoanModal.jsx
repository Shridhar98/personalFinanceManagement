import { useState } from 'react';
import Modal from './Modal';
import { loansApi } from '../../services/api';
import { LOAN_TYPES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DEFAULT = {
  loanType: 'Personal',
  lenderName: '',
  principalAmount: '',
  interestRate: '',
  emiAmount: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  amountPaid: '0',
  nextEmiDate: '',
  notes: '',
};

export default function LoanModal({ loan, onClose, onSaved }) {
  const [form, setForm] = useState(loan ? {
    loanType: loan.loanType,
    lenderName: loan.lenderName,
    principalAmount: loan.principalAmount,
    interestRate: loan.interestRate,
    emiAmount: loan.emiAmount,
    startDate: loan.startDate.split('T')[0],
    endDate: loan.endDate.split('T')[0],
    amountPaid: loan.amountPaid || '0',
    nextEmiDate: loan.nextEmiDate ? loan.nextEmiDate.split('T')[0] : '',
    notes: loan.notes || '',
  } : DEFAULT);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lenderName.trim()) return toast.error('Lender name is required');

    try {
      setSaving(true);
      const payload = {
        ...form,
        principalAmount: Number(form.principalAmount),
        interestRate: Number(form.interestRate),
        emiAmount: Number(form.emiAmount),
        amountPaid: Number(form.amountPaid),
        nextEmiDate: form.nextEmiDate || undefined,
      };
      if (loan) {
        await loansApi.update(loan._id, payload);
        toast.success('Loan updated');
      } else {
        await loansApi.create(payload);
        toast.success('Loan added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={loan ? 'Edit Loan' : 'Add Loan'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Loan Type *</label>
            <select className="input-field" value={form.loanType} onChange={(e) => set('loanType', e.target.value)}>
              {LOAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lender Name *</label>
            <input type="text" className="input-field" placeholder="e.g. SBI Bank" value={form.lenderName} onChange={(e) => set('lenderName', e.target.value)} required maxLength={100} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Principal (₹) *</label>
            <input type="number" className="input-field" placeholder="0" min="1" value={form.principalAmount} onChange={(e) => set('principalAmount', e.target.value)} required />
          </div>
          <div>
            <label className="label">Interest Rate (%) *</label>
            <input type="number" className="input-field" placeholder="e.g. 10.5" min="0" max="100" step="0.1" value={form.interestRate} onChange={(e) => set('interestRate', e.target.value)} required />
          </div>
          <div>
            <label className="label">Monthly EMI (₹) *</label>
            <input type="number" className="input-field" placeholder="0" min="1" value={form.emiAmount} onChange={(e) => set('emiAmount', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input-field" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input-field" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount Paid So Far (₹)</label>
            <input type="number" className="input-field" placeholder="0" min="0" value={form.amountPaid} onChange={(e) => set('amountPaid', e.target.value)} />
          </div>
          <div>
            <label className="label">Next EMI Date</label>
            <input type="date" className="input-field" value={form.nextEmiDate} onChange={(e) => set('nextEmiDate', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input-field resize-none" rows={2} maxLength={500} placeholder="Optional notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : loan ? 'Update' : 'Add Loan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
