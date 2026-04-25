const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loanType: {
      type: String,
      required: true,
      enum: ['Home', 'Car', 'Personal', 'Education', 'Business', 'Gold', 'Other'],
    },
    lenderName: { type: String, required: true, trim: true },
    principalAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0, max: 100 },
    emiAmount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amountPaid: { type: Number, default: 0, min: 0 },
    nextEmiDate: { type: Date },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

loanSchema.virtual('outstandingAmount').get(function () {
  return Math.max(0, this.principalAmount - this.amountPaid);
});

loanSchema.virtual('completionPercentage').get(function () {
  return this.principalAmount
    ? Math.min(100, (this.amountPaid / this.principalAmount) * 100)
    : 0;
});

loanSchema.set('toJSON', { virtuals: true });
loanSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Loan', loanSchema);
