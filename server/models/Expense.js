const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Travel', 'Rent', 'Utilities', 'Healthcare', 'Entertainment',
             'Shopping', 'Education', 'Investment', 'EMI', 'Subscription', 'Other'],
    },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', null],
      default: null,
    },
    budgetLimit: { type: Number, default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
