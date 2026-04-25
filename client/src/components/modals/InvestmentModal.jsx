import { useState } from 'react';
import Modal from './Modal';
import { investmentsApi } from '../../services/api';
import { INVESTMENT_TYPES } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DEFAULT = {
  type: 'Stock',
  name: '',
  ticker: '',
  quantity: '',
  buyPrice: '',
  currentPrice: '',
  buyDate: new Date().toISOString().split('T')[0],
  sellPrice: '',
  sellDate: '',
  isSold: false,
  notes: '',
};

export default function InvestmentModal({ investment, onClose, onSaved }) {
  const [form, setForm] = useState(investment ? {
    type: investment.type,
    name: investment.name,
    ticker: investment.ticker || '',
    quantity: investment.quantity,
    buyPrice: investment.buyPrice,
    currentPrice: investment.currentPrice || '',
    buyDate: investment.buyDate.split('T')[0],
    sellPrice: investment.sellPrice || '',
    sellDate: investment.sellDate ? investment.sellDate.split('T')[0] : '',
    isSold: investment.isSold,
    notes: investment.notes || '',
  } : DEFAULT);
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Investment name is required');
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Enter a valid quantity');
    if (!form.buyPrice || Number(form.buyPrice) < 0) return toast.error('Enter a valid buy price');

    try {
      setSaving(true);
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice),
        currentPrice: form.currentPrice ? Number(form.currentPrice) : null,
        sellPrice: form.sellPrice ? Number(form.sellPrice) : null,
        sellDate: form.sellDate || null,
      };
      if (investment) {
        await investmentsApi.update(investment._id, payload);
        toast.success('Investment updated');
      } else {
        await investmentsApi.create(payload);
        toast.success('Investment added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={investment ? 'Edit Investment' : 'Add Investment'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type *</label>
            <select className="input-field" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ticker / Symbol</label>
            <input type="text" className="input-field" placeholder="e.g. INFY, BTC" value={form.ticker} onChange={(e) => set('ticker', e.target.value.toUpperCase())} maxLength={10} />
          </div>
        </div>

        <div>
          <label className="label">Investment Name *</label>
          <input type="text" className="input-field" placeholder="e.g. Infosys, Nifty 50 Index Fund" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={100} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Quantity *</label>
            <input type="number" className="input-field" placeholder="0" min="0.000001" step="any" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
          </div>
          <div>
            <label className="label">Buy Price (₹) *</label>
            <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01" value={form.buyPrice} onChange={(e) => set('buyPrice', e.target.value)} required />
          </div>
          <div>
            <label className="label">Current Price (₹)</label>
            <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01" value={form.currentPrice} onChange={(e) => set('currentPrice', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Buy Date *</label>
          <input type="date" className="input-field" value={form.buyDate} onChange={(e) => set('buyDate', e.target.value)} required />
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isSold} onChange={(e) => set('isSold', e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <span className="text-sm font-medium text-gray-700">Mark as sold</span>
          </label>
          {form.isSold && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Sell Price (₹)</label>
                <input type="number" className="input-field" placeholder="0.00" min="0" step="0.01" value={form.sellPrice} onChange={(e) => set('sellPrice', e.target.value)} />
              </div>
              <div>
                <label className="label">Sell Date</label>
                <input type="date" className="input-field" value={form.sellDate} onChange={(e) => set('sellDate', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input-field resize-none" rows={2} maxLength={500} placeholder="Optional notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : investment ? 'Update' : 'Add Investment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
