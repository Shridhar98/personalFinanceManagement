const mongoose = require('mongoose');

const fdSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bankName: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    maturityDate: { type: Date, required: true },
    compoundingFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
      default: 'quarterly',
    },
    isMatured: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

fdSchema.virtual('durationMonths').get(function () {
  const diff = this.maturityDate - this.startDate;
  return Math.round(diff / (1000 * 60 * 60 * 24 * 30));
});

fdSchema.virtual('estimatedMaturityAmount').get(function () {
  const n = this.compoundingFrequency === 'monthly' ? 12
    : this.compoundingFrequency === 'quarterly' ? 4
    : this.compoundingFrequency === 'half-yearly' ? 2
    : 1;
  const t = (this.maturityDate - this.startDate) / (1000 * 60 * 60 * 24 * 365);
  return this.principalAmount * Math.pow(1 + (this.interestRate / 100) / n, n * t);
});

fdSchema.virtual('interestEarned').get(function () {
  return this.estimatedMaturityAmount - this.principalAmount;
});

fdSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FD', fdSchema);
